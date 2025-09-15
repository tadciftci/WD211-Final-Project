/**
 * validation.js
 * Handles login form validation and AJAX login request.
 */

$(document).ready(function() {
  $("#login-form").validate({
    // Validation rules
    rules: {
      email: {
        required: true,
        email: true
      },
      pin: {
        required: true,
        digits: true,
        rangelength: [5, 5]
      }
    },
    // Custom error messages
    messages: {
      email: {
        required: "Email is required.",
        email: "Please enter a valid email address."
      },
      pin: {
        required: "PIN code is required.",
        digits: "PIN must contain only digits.",
        rangelength: "PIN must be exactly 5 digits long."
      }
    },
    // Prevent default and send AJAX on valid submission
    submitHandler: function(form) {
      const email = $("#email").val().trim();
      const pin = $("#pin").val().trim();
      const errorMessage = $("#error-message");

      $.ajax({
        url: "https://www.tomiheimonen.info/wd211/apis/employee-login.php",
        method: "POST",
        data: { email, pin },
        success: function(response) {
          // On success, redirect to inventory
          window.location.href = "Inventory.html";
        },
        error: function(xhr) {
          // Show API error message
          errorMessage.text(xhr.responseJSON?.message || "Incorrect Email or Password").removeClass("hidden");
        }
      });
    },
    invalidHandler: function() {
      // Hide API error message when user corrects inputs
      $("#error-message").addClass("hidden");
    }
  });
});
