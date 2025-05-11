document.getElementById('add-student-form').addEventListener('submit', function(event) {
    event.preventDefault();
    // Add student logic here
    document.getElementById('add-student-message').textContent = 'Student added successfully';
});

document.getElementById('edit-student-form').addEventListener('submit', function(event) {
    event.preventDefault();
    // Edit student logic here
    document.getElementById('edit-student-message').textContent = 'The modifications were saved successfully';
});
