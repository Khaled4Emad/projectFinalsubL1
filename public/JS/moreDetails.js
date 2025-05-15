document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const academicId = urlParams.get('academicId');
  const token = localStorage.getItem('token');

  if (!academicId) return;

  try {
    const response = await fetch(`/api/admin/search-student?academicId=${academicId}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await response.json();

    if (!data.success) {
      alert("Student not found");
      return;
    }

    const student = data.student;
    const creditHours = (student.EnrolledCoursesCount || 0) * 3;

    document.querySelector('.personalinfoandpic ul').innerHTML = `
      <li><strong>Name:</strong> ${student.Name}</li>
    `;

    document.querySelector('.academic-info ul').innerHTML = `
      <li><strong>Academic ID:</strong> ${student.AcademicID}</li>
      <li><strong>GPA:</strong> ${student.GPA}</li>
      <li><strong>Credit Hours:</strong> ${creditHours}</li>
      <li><strong>Academic Year:</strong> ${student.AcademicYear}</li>
      <li><strong>Password:</strong> ${student.Password}</li>
    `;

    document.querySelector('.expenses ul').innerHTML = `
      <li><strong>Total Expenses:</strong> ${student.TuitionFees}</li>
      <li><strong>Status:</strong>
        <div id="paymentStatus">${student.TuitionFeesStatus}</div>
      </li>
    `;
  } catch (err) {
    console.error("Error fetching student:", err);
  }
});
