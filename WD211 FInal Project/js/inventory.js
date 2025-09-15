/**
 * inventory.js
 * Handles fetching orders, rendering, status updates, and archiving.
 */

$(document).ready(function() {
    let orders = [];
    let archivedOrders = [];
  
    /**
     * Fetch active orders from the API and render them.
     */
    function fetchAndLoadOrders() {
      fetch("https://www.tomiheimonen.info/wd211/apis/employee-get-orders.php")
        .then(res => {
          if (!res.ok) throw new Error("Failed to load orders");
          return res.json();
        })
        .then(data => {
          // Map API fields to our internal model
          orders = data.map(o => ({
            id: parseInt(o.orderId.replace(/\D/g, '')), // remove non-digits and convert to number
            name: o.items,
            description: `Ordered on ${o.orderDate} for $${o.price}`,
            brand: o.email,
            status: mapStatusCode(o.orderStatus)
          }));
          loadOrders();
        })
        .catch(err => showOrderError(err.message));
    }
  
    /**
     * Convert numeric status code into our string labels.
     */
    function mapStatusCode(code) {
      switch (code) {
        case 0: return "received";
        case 1: return "waiting for products";
        case 2: return "in preparation";
        case 3: return "ready for shipping";
        case 4: return "archived";
        default: return "unknown";
      }
    }
  
    /**
     * Render the list of active orders.
     */
    function loadOrders() {
      const ordersUl = $("#orders-ul");
      ordersUl.empty();
      orders.forEach(order => {
        const li = $("<li>")
          .text(`${order.name} - ${order.status}`)
          .attr("data-id", order.id)
          .click(() => showOrderDetails(order));
        ordersUl.append(li);
      });
    }
  
    /**
     * Display details of a selected order in the form.
     * @param {Object} order
     */
    function showOrderDetails(order) {
      $("#item-name").val(order.name);
      $("#item-description").val(order.description);
      $("#item-brand").val(order.brand);
      $("#item-status").val(order.status);
      $("#update-status-btn").data("order-id", order.id);
      $("#archive-order-btn").data("order-id", order.id);
  
      // Show archive button only when status is "shipped"
      if (order.status.toLowerCase() === "shipped") {
        $("#archive-order-btn").removeClass("hidden");
      } else {
        $("#archive-order-btn").addClass("hidden");
      }
    }
  
    /**
     * Show an error message in the order details section.
     * @param {string} msg
     */
    function showOrderError(msg) {
      $("#order-error").text(msg).removeClass("hidden");
    }
  
    // Update order status via API
    $("#update-status-btn").click(function() {
        const id = $(this).data("order-id");
        const newStatus = $("#item-status").val();
        const statusCode = inverseMapStatus(newStatus);
      
        console.log("Updating order", id, "to status", newStatus, "(code", statusCode, ")");

        fetch(
          `https://www.tomiheimonen.info/wd211/apis/employee-change-order.php?orderID=${id}&status=${statusCode}`
        )
          .then(res => {
            console.log("Status response:", res.status, res.statusText);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
          })
          .then(text => {
            console.log("API returned text:", text);
            if (text.trim() !== "ok") {
              throw new Error("API error: " + text);
            }
            // Update local model
            orders = orders.map(o =>
              o.id === id ? { ...o, status: newStatus } : o
            );
            loadOrders();
            showOrderDetails(orders.find(o => o.id === id));
          })
          .catch(err => {
            console.error("Update failed:", err);
            showOrderError("Could not update status: " + err.message);
          });
      });
  
    // Archive shipped order via the same change-order endpoint with status=4
    $("#archive-order-btn").click(function() {
      const id = $(this).data("order-id");
      fetch(`https://www.tomiheimonen.info/wd211/apis/employee-change-order.php?orderID=${id}&status=4`)
        .then(res => {
          if (!res.ok) throw new Error("Archive failed");
          return res.text();
        })
        .then(text => {
          if (text !== "ok") throw new Error("API error: " + text);
          // Move to archivedOrders
          const archived = orders.find(o => o.id === id);
          archived.status = "archived";
          archivedOrders.push(archived);
          orders = orders.filter(o => o.id !== id);
          loadOrders();
          loadArchivedOrders();
          $("#archive-order-btn").addClass("hidden");
        })
        .catch(err => showOrderError(err.message));
    });
  
    /**
     * Convert status string back into numeric code.
     */
    function inverseMapStatus(str) {
      switch (str) {
        case "received": return 0;
        case "waiting for products": return 1;
        case "in preparation": return 2;
        case "ready for shipping": return 3;
        case "shipped": return 4;
        default: return 0;
      }
    }
  
    /**
     * Render the list of archived orders.
     */
    function loadArchivedOrders() {
      const ul = $("#archived-orders-ul");
      ul.empty();
      archivedOrders.forEach(o => {
        ul.append($("<li>").text(`${o.name} - ${o.status}`));
      });
    }
  
    // Initial load
    fetchAndLoadOrders();
  });
  