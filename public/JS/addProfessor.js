document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const courseSelect = document.getElementById("TaughtCourses");

  try {
    const response = await fetch("/api/admin/unassigned-courses", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (data.success && data.courses.length > 0) {
      data.courses.forEach((course) => {
        const option = document.createElement("option");
        option.value = course.CourseName;
        option.textContent = course.CourseName;
        courseSelect.appendChild(option);
      });
    } else {
      const option = document.createElement("option");
      option.disabled = true;
      option.textContent = "No unassigned courses found";
      courseSelect.appendChild(option);
    }
  } catch (error) {
    console.error("Failed to load unassigned courses:", error);
  }
});

document
  .getElementById("add-student-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const ProfessorID = parseInt(form.ProfessorID.value);
    const Name = form.FullName.value;
    const Email = form.Email.value;
    const Password = form.password.value;
    const courseNames = Array.from(form.TaughtCourses.selectedOptions).map(
      (opt) => opt.value
    );

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/admin/add-professor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          ProfessorID,
          Name,
          Email,
          Password,
          courseNames,
        }),
      });

      const data = await res.json();
      const msgBox = document.getElementById("add-student-message");

      if (data.success) {
        msgBox.style.color = "green";
        msgBox.textContent = "Professor added successfully.";
        setTimeout(() => {
          location.reload();
        }, 1500);
      } else {
        msgBox.style.color = "red";
        msgBox.textContent = data.message || "Error occurred.";
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      document.getElementById("add-student-message").textContent =
        "Something went wrong.";
    }
  });
