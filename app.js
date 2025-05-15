const express = require("express");
const sql = require("mssql/msnodesqlv8");
const authenticateJWT = require("./middleware/authenticateStudent");
const authenticateJWTteacher = require("./middleware/authenticateStudent")
const jwt = require('jsonwebtoken');
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.json()); // For parsing JSON data
// Connection configuration for each database
// Enhanced connection configuration
const studentsConfig = {
  connectionString: `Driver={${process.env.DB_DRIVER}};Server=${process.env.DB_SERVER};Database=StudentsDB;Trusted_Connection=Yes;`,
  options: {
    trustServerCertificate: true,
    connectionTimeout: 30000, // 30 seconds connection timeout
    requestTimeout: 60000, // 60 seconds query timeout
    pool: {
      max: 10, // Maximum pool size
      min: 0, // Minimum pool size
      idleTimeoutMillis: 30000, // Idle timeout
    },
  },
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(studentsConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database Connection Failed:", err);
    process.exit(1);
  });

// Handle clean shutdown
process.on("SIGINT", async () => {
  const pool = await poolPromise;
  await pool.close();
  process.exit(0);
});

const professorsConfig = {
  connectionString: `Driver={${process.env.DB_DRIVER}};Server=${process.env.DB_SERVER};Database=ProfessorsDB;Trusted_Connection=Yes;`,
  options: {
    trustServerCertificate: true,
    connectionTimeout: 30000, // 30 seconds connection timeout
    requestTimeout: 60000, // 60 seconds query timeout
    pool: {
      max: 10, // Maximum pool size
      min: 0, // Minimum pool size
      idleTimeoutMillis: 30000, // Idle timeout
    },
  },
};

// Create a connection pool for doctors
const doctorsPoolPromise = new sql.ConnectionPool(professorsConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to Doctors Database");
    return pool;
  })
  .catch((err) => {
    console.error("Database Connection Failed for Doctors:", err);
    process.exit(1);
  });

// Handle clean shutdown for doctors database
process.on("SIGINT", async () => {
  const pool = await doctorsPoolPromise;
  await pool.close();
  process.exit(0);
});

// Serve the index.html file at the root
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "views", "index.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error loading page");
    }
  });
});

// Student routes - now protected with student ID check
app.get("/student", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user", "MainPageStudent.html"));
});

app.get("/doctor", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user", "mainForDoctor.html"));
});


app.get("/doctor/profile", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "user", "doctorProfile.html")
  );
});

app.get("/student/profile", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "user", "ProfilePageStudent.html")
  );
});

app.get("/student/Payment", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user", "Payment.html"));
});

app.get("/student/RegistrationOfMaterials", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "user", "RegistrationOfMaterials.html")
  );
});

// New endpoint to get current student info
app.get("/api/student/current", async (req, res) => {
  const studentId = req.query.studentId;
  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  try {
    await sql.connect(studentsConfig);
    const request = new sql.Request();
    request.input("AcademicID", sql.Int, studentId);

    const result = await request.query(`
            SELECT AcademicID, Name, AcademicEmail, GPA, AcademicYear 
            FROM Students 
            WHERE AcademicID = @AcademicID
        `);

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    await sql.close();
  }
});

// New endpoint to register for a course

// Get student's current course load and GPA

app.get("/api/student/course-load", async (req, res) => {
  const studentId = req.query.studentId;
  if (!studentId) return res.status(400).json({ error: "Student ID required" });

  try {
    //await sql.connect(studentsConfig);
    // const request = new sql.Request();
    const pool = await poolPromise;
    const request = pool.request();

    // Get student's current enrolled courses and GPA
    request.input("studentId", sql.Int, studentId);
    const result = await request.query(`
            SELECT 
                s.GPA,
                COUNT(e.CourseID) AS CurrentCourses,
                SUM(c.CourseHours) AS CurrentHours
            FROM Students s
            LEFT JOIN StudentEnrollments e ON s.AcademicID = e.AcademicID
            LEFT JOIN ServerB.CoursesDB.dbo.Courses c ON e.CourseID = c.CourseID
            WHERE s.AcademicID = @studentId
            GROUP BY s.GPA
        `);

    res.json(
      result.recordset[0] || { GPA: 0, CurrentCourses: 0, CurrentHours: 0 }
    );
  } catch (err) {
    console.error("Error getting course load:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    // await sql.close();
  }
});


app.post("/login", async (req, res) => {
  const { email, password, userType } = req.body;

  let config, table, emailColumn, passwordColumn, pool, payload;

  if (userType === "student") {
    config = studentsConfig;
    table = "Students";
    emailColumn = "AcademicEmail";
    passwordColumn = "Password";
  } else if (userType === "doctor") {
    config = professorsConfig;
    table = "Professors";
    emailColumn = "Email";
    passwordColumn = "Password";
  }

  try {
     
    if (userType === "student") {
      pool = await poolPromise;
    } else if (userType === "doctor") {
      pool = await doctorsPoolPromise;
    }
    const request = pool.request();

    // Define the SQL query with parameters
    const query = `
      SELECT * FROM dbo.${table}
      WHERE ${emailColumn} = @Email AND ${passwordColumn} = @Password
    `;

    request.input("Email", sql.NVarChar, email);
    request.input("Password", sql.NVarChar, password);

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];

      // Create a payload to include in the JWT (e.g., user ID and user type)
      if (userType === "student"){
        payload = {
          studentId: user.AcademicID,
          userType: userType
        };
      }else if (userType === "doctor") {
        payload = {
          professorId: user.ProfessorID,
          userType: userType
        };
        console.log("payload"+payload)
      }

      // Sign the JWT with the payload and secret key
      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }); // Token expires in 1 hour

      // Send the JWT as a response
      res.json({
        success: true,
        token: token, // Send the token back to the client
        user: {
          id: user.AcademicID,
          email: user[emailColumn],
          name: user.Name
        }
      });
    } else {
      res.json({ success: false, message: "Invalid credentials." });
    }
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


app.get("/api/student/profile", authenticateJWT, async (req, res) => {
  try {
    console.log("Inside profile API");
    const studentId = req.studentId;
    console.log("Fetching profile for studentId:", studentId);

    const pool = await poolPromise;

    // Fetch student info
    const studentResult = await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
        SELECT AcademicID, AcademicEmail, GPA, Name, AcademicYear,
                TuitionFees, TuitionFeesStatus, Password
        FROM Students
        WHERE AcademicID = @studentId
      `);

          console.log("Student result count:", studentResult.recordset.length);


    if (studentResult.recordset.length === 0) {
      console.log("No student found for id:", studentId);
      return res.status(404).json({ message: "Student not found" });
    }

    // Count number of courses student is enrolled in
    const courseCountResult = await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
        SELECT COUNT(*) AS EnrolledCourses
        FROM StudentEnrollments
        WHERE AcademicID = @studentId
      `);

    const student = studentResult.recordset[0];
    student.EnrolledCourses = courseCountResult.recordset[0].EnrolledCourses;

    console.log("Returning student data:", student);
    res.status(200).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//* Endpoint to change Unpaid to Paid

app.put("/api/student/Payment", authenticateJWT, async (req, res) => {
  try {
    const studentId = req.studentId;

    const pool = await poolPromise;

    // First, check if the student exists and has unpaid tuition
    const checkResult = await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
        SELECT TuitionFeesStatus 
        FROM Students 
        WHERE AcademicID = @studentId
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const currentStatus = checkResult.recordset[0].TuitionFeesStatus;
    if (currentStatus === "Paid") {
      return res.status(400).json({ message: "Tuition fees already marked as paid" });
    }

    // Update the tuition fees status to 'Paid'
    await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
        UPDATE Students
        SET TuitionFeesStatus = 'Paid'
        WHERE AcademicID = @studentId
      `);

    res.status(200).json({ message: "Tuition fees status updated to Paid" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



// New endpoint to get available courses for a student
app.get("/api/student/available-courses", authenticateJWT, async (req, res) => {
  const studentId = req.studentId;

  if (!studentId) {
    return res.status(400).json({ success: false, message: "Student ID is required" });
  }

  try {
    await sql.connect(studentsConfig);
    const request = new sql.Request();
    request.input("StudentId", sql.Int, studentId);

    // Step 1: Get GPA and TuitionFeesStatus
    const studentResult = await request.query(`
      SELECT GPA, TuitionFeesStatus 
      FROM Students 
      WHERE AcademicID = @StudentId
    `);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const { GPA, TuitionFeesStatus } = studentResult.recordset[0];

    const maxAllowedCourses = GPA >= 2.0 ? 6 : 5;

    // Step 2: Fetch available courses the student hasn't taken and meets prerequisites
    const coursesResult = await request.query(`
      SELECT c.CourseID, c.CourseName, c.CourseCode, c.CourseHours, 
             p.Name AS ProfessorName, c.CurrentEnrollment, c.MaxEnrollment
      FROM ServerB.CoursesDB.dbo.Courses c
      JOIN ServerC.ProfessorsDB.dbo.Professors p ON c.ProfessorID = p.ProfessorID
      WHERE c.CourseID NOT IN (
          SELECT CourseID 
          FROM StudentsDB.dbo.StudentEnrollments 
          WHERE AcademicID = @StudentId
      )
      AND (
          c.PrerequisiteCourseID IS NULL
          OR c.PrerequisiteCourseID IN (
              SELECT CourseID 
              FROM StudentsDB.dbo.StudentEnrollments 
              WHERE AcademicID = @StudentId
          )
      )
    `);

    const availableCourses = coursesResult.recordset;

    res.json({
      success: true,
      gpa: GPA,
      maxAllowedCourses: maxAllowedCourses,
      availableCourses: availableCourses, // limit list for client-side help
    });

  } catch (err) {
    console.error("Error fetching available courses:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching available courses",
    });
  } finally {
    await sql.close();
  }
});
app.post("/api/student/register-courses", authenticateJWT, async (req, res) => {
  const studentId = req.studentId;
  const { courseNames } = req.body;

  if (!studentId || !Array.isArray(courseNames) || courseNames.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Student ID and a list of course names are required.",
    });
  }

  try {
    const pool = await poolPromise;
    const studentRequest = pool.request();
    studentRequest.input("studentId", sql.Int, studentId);

    // 1. Get GPA and TuitionFeesStatus
    const studentResult = await studentRequest.query(`
      SELECT GPA, TuitionFeesStatus FROM Students WHERE AcademicID = @studentId
    `);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const { GPA, TuitionFeesStatus } = studentResult.recordset[0];

    if (TuitionFeesStatus !== "Paid") {
      return res.status(403).json({
        success: false,
        message: "Tuition fees are unpaid. Please pay your fees before registering for courses.",
      });
    }

    const maxAllowedCourses = GPA >= 2.0 ? 6 : 5;

    if (courseNames.length > maxAllowedCourses) {
      return res.status(400).json({
        success: false,
        message: `GPA is ${GPA}. You can register for up to ${maxAllowedCourses} courses.`,
      });
    }

    const results = [];

    for (const name of courseNames) {
      // 2. Get CourseID from CourseName
      const courseIdResult = await pool.request()
        .input("courseName", sql.NVarChar, name)
        .query(`
          SELECT CourseID FROM ServerB.CoursesDB.dbo.Courses
          WHERE CourseName = @courseName
        `);

      if (courseIdResult.recordset.length === 0) {
        results.push({ course: name, success: false, message: "Course not found" });
        continue;
      }

      const courseId = courseIdResult.recordset[0].CourseID;

      // 3. Check if already enrolled
      const existsResult = await pool.request()
        .input("AcademicID", sql.Int, studentId)
        .input("CourseID", sql.Int, courseId)
        .input("Term", sql.Int, 1)
        .query(`
          SELECT COUNT(*) as count FROM StudentEnrollments
          WHERE AcademicID = @AcademicID AND CourseID = @CourseID AND Term = @Term
        `);

      if (existsResult.recordset[0].count > 0) {
        results.push({ course: name, success: false, message: "Already enrolled in this course" });
        continue;
      }

      // 4. Insert into StudentEnrollments
      try {
        await pool.request()
          .input("AcademicID", sql.Int, studentId)
          .input("CourseID", sql.Int, courseId)
          .input("Term", sql.Int, 1) // assuming current term = 1
          .query(`
            INSERT INTO StudentEnrollments (AcademicID, CourseID, Term)
            VALUES (@AcademicID, @CourseID, @Term)
          `);

        results.push({ course: name, success: true, message: "Enrolled successfully" });
      } catch (err) {
        results.push({
          course: name,
          success: false,
          message: err.message || "Insert failed",
        });
      }
    }

    res.json({
      success: true,
      gpa: GPA,
      tuitionStatus: TuitionFeesStatus,
      attempted: courseNames.length,
      allowed: maxAllowedCourses,
      results: results,
    });
  } catch (err) {
    console.error("Bulk registration error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during course registration",
    });
  }
});

app.post("/api/student/unregister-course", authenticateJWT, async (req, res) => {
  const studentId = req.studentId;
  const { courseName } = req.body;

  if (!studentId || !courseName) {
    return res.status(400).json({ error: "Missing studentId or courseName" });
  }

  try {
    await sql.connect(studentsConfig);
    const request = new sql.Request();

    // 1. Get CourseID from courseName
    request.input("courseName", sql.NVarChar, courseName);
    const courseResult = await request.query(`
      SELECT CourseID FROM ServerB.CoursesDB.dbo.Courses
      WHERE CourseName = @courseName
    `);

    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseId = courseResult.recordset[0].CourseID;

    // 2. Check if enrollment exists
    request.input("studentId", sql.Int, studentId);
    request.input("courseId", sql.Int, courseId);
    const enrollment = await request.query(`
      SELECT 1 FROM StudentEnrollments 
      WHERE AcademicID = @studentId AND CourseID = @courseId
    `);

    if (!enrollment.recordset.length) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    // 3. Delete enrollment
    await request.query(`
      DELETE FROM StudentEnrollments
      WHERE AcademicID = @studentId AND CourseID = @courseId
    `);

    // 4. Update course's CurrentEnrollment
    await request.query(`
      UPDATE ServerB.CoursesDB.dbo.Courses
      SET CurrentEnrollment = CurrentEnrollment - 1
      WHERE CourseID = @courseId
    `);

    res.json({ success: true, message: `Successfully unregistered from ${courseName}` });
  } catch (err) {
    console.error("Unregistration error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    await sql.close();
  }
});

//! professors 

app.get("/api/professor/profile", authenticateJWTteacher, async (req, res) => {
  try {
    const professorId = req.professorId;
    console.log("professorId: " + professorId);

    const pool = await poolPromise;

    const profResult = await pool
      .request()
      .input("professorId", sql.Int, professorId)
      .query(`
        SELECT ProfessorID, Name, Email, Password
        FROM ServerC.ProfessorsDB.dbo.Professors
        WHERE ProfessorID = @professorId
      `);

    if (profResult.recordset.length === 0) {
      return res.status(404).json({ message: "Professor not found" });
    }

    const professor = profResult.recordset[0];

    const coursesResult = await pool
      .request()
      .input("professorId", sql.Int, professorId)
      .query(`
        SELECT CourseName
        FROM ServerB.CoursesDB.dbo.Courses
        WHERE ProfessorID = @professorId
      `);

    const courseNames = coursesResult.recordset.map(course => course.CourseName);

    res.status(200).json({
      professor,
      courseNames
    });

  } catch (err) {
    console.error("Error fetching professor profile or courses:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

