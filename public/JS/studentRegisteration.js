let allCourses = [];

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("You are not logged in.");
    window.location.href = "/login";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/student/profile", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to fetch profile data");

    const data = await response.json();

    // Fill in student info
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("studentName", data.Name);
    setText("name", data.Name);
    setText("academicId", data.AcademicID);
    setText("email", data.AcademicEmail);
    setText("gpa", data.GPA);
    setText("academicYear", data.AcademicYear);
    setText("password", data.Password);
    setText("creditHours", data.EnrolledCourses * 3);
    setText("tuition", `$${data.TuitionFees.toFixed(2)}`);
    setText("status", data.TuitionFeesStatus);

    if (data.TuitionFeesStatus === "Paid") {
      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.classList.remove("status-pending");
        statusEl.classList.add("status-paid");
      }
    }

    updateRegisterButtonVisibility(data);

    // Fetch and render courses
    await fetchCourses();

  } catch (err) {
    console.error(err);
    alert("Error loading profile. Please try again.");
  }
});


function updateRegisterButtonVisibility(data) {
  const enrolledCourses = data.EnrolledCourses;
  const gpa = parseFloat(data.GPA);
  const academicYear = parseInt(data.AcademicYear, 10);

  // max courses logic based on GPA
  let maxCourses;
  if (gpa > 2) maxCourses = 6;
  else maxCourses = 5;

  const button = document.getElementById("registerButton");
  if (!button) return;

  if (enrolledCourses >= maxCourses) {
    button.disabled = true;
    button.style.opacity = 0.6;  // visually indicate disabled state
    button.style.cursor = "not-allowed";
  } else {
    button.disabled = false;
    button.style.opacity = 1;
    button.style.cursor = "pointer";
  }
}



async function fetchCourses() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch("http://localhost:3000/api/student/available-courses", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to fetch courses");

    const data = await response.json();

    console.log("Courses API response:", data);

    if (data.success) {
      allCourses = data.availableCourses.map(course => ({
        ...course,
        registered: false
      }));
      renderTableForTerm(1);
    } else {
      const container = document.getElementById("table-container");
      if (container) container.innerHTML = "<p style='text-align:center;margin:30px;color:#888'>No available courses</p>";
    }
  } catch (error) {
    console.error("Error loading courses:", error);
    const container = document.getElementById("table-container");
    if (container) container.innerHTML = "<p style='text-align:center;margin:30px;color:#888'>Error loading courses</p>";
  }
}

function renderTableForTerm(term) {
  const tableContainer = document.getElementById('table-container');
  if (!tableContainer) return;

  const data = allCourses; // Filter by term if you have term info in your course data

  if (!data || data.length === 0) {
    tableContainer.innerHTML = "<p style='text-align:center;margin:30px;color:#888'>No Courses</p>";
    return;
  }

  let html = `<table>
      <thead>
          <tr>
              <th>#</th>
              <th>Course name</th>
              <th>Course code</th>
              <th>Course hours</th>
              <th>Professor</th>
              <th>Available places</th>
              <th>Registration</th>
          </tr>
      </thead>
      <tbody>`;
  data.forEach((course, idx) => {
      html += `<tr>
          <td>${idx + 1}</td>
          <td>${course.CourseName}</td>
          <td>${course.CourseCode}</td>
          <td>${course.CourseHours}</td>
          <td>${course.ProfessorName}</td>
          <td>${course.MaxEnrollment - course.CurrentEnrollment}</td>
          <td>
              <button class="action-btn ${course.registered ? 'remove' : 'add'}" onclick="toggleRegister(${idx}, this)">
                  ${course.registered ? '✖' : '+'}
              </button>
          </td>
      </tr>`;
  });
  html += `</tbody></table>`;
  tableContainer.innerHTML = html;
}

function toggleRegister(index, btn) {
  const course = allCourses[index];
  course.registered = !course.registered;
  btn.innerHTML = course.registered ? '✖' : '+';
  btn.className = 'action-btn ' + (course.registered ? 'remove' : 'add');
}

function showTerm(term, btn) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  btn.classList.add('active');
  renderTableForTerm(term);
}

async function saveSelectedCourses() {
  const selectedCourses = allCourses
    .filter(c => c.registered)
    .map(c => c.CourseName);

  if (selectedCourses.length === 0) {
    alert("Please select at least one course to save.");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch("http://localhost:3000/api/student/register-courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ courseNames: selectedCourses })
    });

    const data = await response.json();
    if (data.success) {
      alert(`Courses registered successfully. GPA: ${data.gpa}, Tuition Status: ${data.tuitionStatus}`);

      // Re-fetch profile to update enrolled courses and button visibility
      const profileResponse = await fetch("http://localhost:3000/api/student/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (profileResponse.ok) {
        const updatedProfile = await profileResponse.json();
        updateRegisterButtonVisibility(updatedProfile);
      }

      // Refresh courses list
      await fetchCourses();

    } else {
      alert("Failed to register courses: " + data.message);
    }
  } catch (error) {
    console.error("Error saving courses:", error);
    alert("An error occurred while saving.");
  }
}
