document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-student-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized: Admin token is missing.");
      return;
    }

    const formData = new FormData(form);

    const payload = {
      Name: formData.get("name"),
      AcademicID: parseInt(formData.get("academic_id")),
      AcademicEmail: formData.get("email"),
      Password: formData.get("password"),
      GPA: parseFloat(formData.get("gpa")),
      AcademicYear: parseInt(formData.get("academic_year")),
      TuitionFees: parseFloat(formData.get("tuition_fees")),
      TuitionFeesStatus: formData.get("tuition_fees_status")
    };

    try {
      const response = await fetch("/api/admin/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Student added successfully.");
        form.reset();
      } else {
        alert(data.message || "Failed to add student.");
      }
    } catch (error) {
      console.error("Request error:", error);
      alert("An error occurred while adding the student.");
    }
  });
});
