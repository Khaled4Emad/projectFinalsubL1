// document.addEventListener('DOMContentLoaded', function() {
//     const documentButtons = document.querySelectorAll('.openDocument');

//     documentButtons.forEach(button => {
//         button.addEventListener('click', function(e) {
//             e.preventDefault(); // Prevent default button behavior
//             const filename = this.getAttribute('data-pdf'); // Get the filename attribute
//             if (filename) {
//                 window.open(`${filename}`, '_blank');
//             }
//         });
//     });
// });

// document.addEventListener('DOMContentLoaded', function() {
//     const paymentStatusDiv = document.getElementById('paymentStatus');
//     const payButton = document.getElementById('pay');

//     function togglePayButton() {
//         if (paymentStatusDiv.textContent.trim() === 'Paid') {
//             payButton.style.display = 'none';
//         } else {
//             payButton.style.display = 'block';
//         }
//     }

//     // Initial call to set the state
//     togglePayButton();

//     // Add event listener to the payment status div
//     paymentStatusDiv.addEventListener('DOMSubtreeModified', function() {
//         togglePayButton();
//     });

//     // Function to open payment window
//     function openPaymentWindow() {
//         window.open('payment.html', '_blank');
//     }

//     // Add event listener to the pay button
//     payButton.addEventListener('click', openPaymentWindow);
// });
