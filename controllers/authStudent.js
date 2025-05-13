const jwt = require("jsonwebtoken");

app.post("/api/student/login", async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM Students WHERE AcademicEmail = @email");

    const student = result.recordset[0];

    if (!student) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Here you check for the password directly since you're not hashing it (Not recommended for production)
    if (student.Password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }


    // Generate JWT token
    const token = jwt.sign(
      { studentId: student.AcademicID, email: student.AcademicEmail, userType: student.UserType },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Send token to client
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
