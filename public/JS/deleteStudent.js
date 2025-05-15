document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  document.querySelectorAll(".delete-student").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const academicId = btn.getAttribute("data-academicid");

      const confirmDelete = confirm("Are you sure you want to delete this student?");
      if (!confirmDelete) return;

      try {
        const response = await fetch("/api/admin/delete-student", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ academicId: academicId })
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
});
