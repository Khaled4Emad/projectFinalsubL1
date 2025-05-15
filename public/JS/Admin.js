// Reusable search function
async function searchStudentById(academicId) {
  if (!academicId) return;

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/admin/search-student?academicId=${encodeURIComponent(academicId)}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();

    const tbody = document.querySelector("#search-results-section tbody");
    tbody.innerHTML = "";

    if (data.success) {
      const student = data.student;
      const enrolledCoursesCount = student.EnrolledCoursesCount || 0;
      const creditHours = enrolledCoursesCount * 3;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${student.Name}</td>
        <td>${student.AcademicID}</td>
        <td>${student.GPA}</td>
        <td>${creditHours}</td>
        <td>${student.AcademicYear}</td>
        <td class="Action">
          <a href="/admin/MoreDetails?academicId=${student.AcademicID}" style="text-decoration: none;">
            <i class="fa-solid fa-circle-info"></i>
          </a>
          <a href="/admin/EditStudent?academicId=${student.AcademicID}" style="text-decoration: none;">
            <i class="fa-solid fa-pen"></i>
          </a>
          <a href="#" class="delete-student" data-academicid="${student.AcademicID}" style="text-decoration: none;">
            <i class="fa-solid fa-trash"></i>
          </a>
        </td>
      `;
      tbody.appendChild(tr);
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${data.message}</td></tr>`;
    }
  } catch (err) {
    console.error("Error:", err.message);
    alert("Search failed: " + err.message);
  }
}

// On SearchResult page load, check URL param and search automatically
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const idFromUrl = urlParams.get("id");

  if (idFromUrl) {
    // Set search input field with this id (optional, but nice UX)
    const searchField = document.getElementById("search-field");
    if (searchField) searchField.value = idFromUrl;

    // Search automatically
    searchStudentById(idFromUrl);
  }

  // Search form submission handler
  const searchForm = document.getElementById("search-form");
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = document.getElementById("search-field").value.trim();
    searchStudentById(id);
  });

  const token = localStorage.getItem("token");

  // Delete button handler (event delegation)
  document.getElementById("search-results-section").addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-student");
    if (!btn) return;

    e.preventDefault();

    const academicId = btn.getAttribute("data-academicid");

    const confirmDelete = confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    try {
      const response = await fetch("/api/admin/delete-student", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ academicId }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Student deleted successfully");
        btn.closest("tr").remove();
      } else {
        alert(data.message || "Failed to delete student.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Server error while deleting student.");
    }
  });
});

/////////////////////////////

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const academicId = urlParams.get('academicId');

  if (academicId) {
    // Fill the search input field with this academicId
    const searchField = document.getElementById('search-field');
    if (searchField) searchField.value = academicId;

    // Trigger the existing search functionality programmatically
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  }
});
