document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-student-form");
    const courseSelect = document.getElementById("TaughtCourses");
    const messageDiv = document.getElementById("add-student-message");

    // Fetch and populate unassigned courses
    async function loadUnassignedCourses() {
        const token = localStorage.getItem("token");
        if (!token) {
        alert("Unauthorized: Admin token is missing.");
        return;
        }

        try {
        const res = await fetch("/api/admin/unassigned-courses", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
            courseSelect.innerHTML = '<option value="" disabled selected>Select a course</option>';
            data.courses.forEach(course => {
            const option = document.createElement("option");
            option.value = course.CourseName;
            option.textContent = course.CourseName;
            courseSelect.appendChild(option);
            });
        } else {
            console.error("Failed to load courses:", data.message);
        }
        } catch (err) {
        console.error("Error loading courses:", err);
        }
    }

    loadUnassignedCourses();

    // Handle form submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
        alert("Unauthorized: Admin token is missing.");
        return;
        }

        const formData = new FormData(form);
        const selectedCourse = courseSelect.value;

        if (!selectedCourse) {
        messageDiv.style.color = "red";
        messageDiv.textContent = "Please select a course.";
        return;
        }

        const payload = {
        ProfessorID: parseInt(formData.get("ProfessorID")),
        Name: formData.get("FullName"),
        Email: formData.get("Email"),
        Password: formData.get("password"),
        courseNames: [selectedCourse]
        };

        try {
        const res = await fetch("/api/admin/add-professor", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            messageDiv.style.color = "green";
            messageDiv.textContent = data.message || "Professor added successfully.";
            form.reset();
            loadUnassignedCourses(); // Refresh course list
        } else {
            messageDiv.style.color = "red";
            messageDiv.textContent = data.message || "Failed to add professor.";
        }
        } catch (err) {
        console.error("Add professor error:", err);
        messageDiv.style.color = "red";
        messageDiv.textContent = "An error occurred while adding the professor.";
        }
    });
});
