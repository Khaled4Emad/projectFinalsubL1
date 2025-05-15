document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const academicId = urlParams.get('academicId');
  const token = localStorage.getItem('token');

  if (!academicId) return alert("Missing Academic ID");

  try {
    const response = await fetch(`/api/admin/search-student?academicId=${academicId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!data.success) return alert("Student not found");

    const student = data.student;
    const form = document.getElementById('editStudentForm');

    // Populate form fields
    form.AcademicID.value = student.AcademicID;
    form.AcademicEmail.value = student.AcademicEmail;
    form.Name.value = student.Name;
    form.GPA.value = student.GPA;
    form.AcademicYear.value = student.AcademicYear;
    form.Password.value = student.Password;
    form.TuitionFees.value = student.TuitionFees;
    form.TuitionFeesStatus.value = student.TuitionFeesStatus;

    // Submit updated form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        AcademicID: form.AcademicID.value,
        AcademicEmail: form.AcademicEmail.value,
        Name: form.Name.value,
        GPA: form.GPA.value,
        AcademicYear: form.AcademicYear.value,
        Password: form.Password.value,
        TuitionFees: form.TuitionFees.value,
        TuitionFeesStatus: form.TuitionFeesStatus.value
      };

      try {
        const updateRes = await fetch('/api/admin/edit-student', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        const updateData = await updateRes.json();
        if (updateData.success) {
          alert("Student updated successfully");
          window.location.href = "/Admin"; // redirect if needed
        } else {
          alert(updateData.message);
        }
      } catch (err) {
        console.error("Error updating student:", err);
        alert("Error updating student");
      }
    });

  } catch (err) {
    console.error("Error fetching student data:", err);
  }
});
