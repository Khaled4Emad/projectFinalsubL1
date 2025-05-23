const express = require("express");
const sql = require("mssql/msnodesqlv8");
const {
  authenticateJWT,
  authenticateJWTteacher,
  authenticateJWTadmin
}= require("./middleware/authenticateStudent");
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


const adminsConfig = {
  connectionString: `Driver={${process.env.DB_DRIVER}};Server=${process.env.DB_SERVER};Database=AdminDB;Trusted_Connection=Yes;`,
  options: {
    trustServerCertificate: true,
    connectionTimeout: 30000,
    requestTimeout: 60000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
};

const adminsPoolPromise = new sql.ConnectionPool(adminsConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to Admins Database");
    return pool;
  })
  .catch((err) => {
    console.error("Database Connection Failed for Admins:", err);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  const pool = await adminsPoolPromise;
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

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user", "main.html"));
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

app.get("/admin/AddStudent", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "user", "AddStudent.html")
  );
});

app.get("/admin/Adddoctor", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "user", "Adddoctor.html")
  );
});

app.get("/admin/SearchResult", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "user", "SearchResult.html")
  );
});

app.get("/admin/MoreDetails", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "user", "MoreDetails.html")
  );
});

app.get("/admin/EditStudent", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "user", "EditStudent.html")
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
    pool = await poolPromise;
  } else if (userType === "doctor") {
    config = professorsConfig;
    table = "Professors";
    emailColumn = "Email";
    passwordColumn = "Password";
    pool = await doctorsPoolPromise;
  } else if (userType === "admin") {
    config = adminsConfig;
    table = "Admins";
    emailColumn = "Email";
    passwordColumn = "Password";
    pool = await adminsPoolPromise;
  } else {
    return res.status(400).json({ success: false, message: "Invalid user type." });
  }

  try {
    const request = pool.request();

    const query = `
      SELECT * FROM dbo.${table}
      WHERE ${emailColumn} = @Email AND ${passwordColumn} = @Password
    `;

    request.input("Email", sql.NVarChar, email);
    request.input("Password", sql.NVarChar, password);

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];

      if (userType === "student") {
        payload = {
          studentId: user.AcademicID,
          userType: userType
        };
      } else if (userType === "doctor") {
        payload = {
          professorId: user.ProfessorID,
          userType: userType
        };
      } else if (userType === "admin") {
        payload = {
          adminId: user.AdminID,
          userType: userType
        };
      }

      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

      res.json({
        success: true,
        token: token,
        user: {
          id: user.AcademicID || user.ProfessorID || user.AdminID,
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

//! Admin
app.post("/api/admin/add-student", authenticateJWTadmin, async (req, res) => {
  const {
    AcademicID,
    AcademicEmail,
    Password,
    GPA,
    Name,
    AcademicYear,
    TuitionFees,
    TuitionFeesStatus
  } = req.body;

  if (
    !AcademicID ||
    !AcademicEmail ||
    !Password ||
    GPA == null ||
    !Name ||
    !AcademicYear ||
    TuitionFees == null ||
    !TuitionFeesStatus
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!["Paid", "Unpaid"].includes(TuitionFeesStatus)) {
    return res.status(400).json({ message: "TuitionFeesStatus must be 'Paid' or 'Unpaid'" });
  }

  if (AcademicYear < 1 || AcademicYear > 5) {
    return res.status(400).json({ message: "AcademicYear must be between 1 and 5" });
  }

  if (GPA < 0 || GPA > 4) {
    return res.status(400).json({ message: "GPA must be between 0 and 4" });
  }

  try {
    const pool = await poolPromise;

    const checkResult = await pool
      .request()
      .input("AcademicID", sql.Int, AcademicID)
      .query(`
        SELECT AcademicID FROM ServerA.StudentsDB.dbo.Students
        WHERE AcademicID = @AcademicID
      `);

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ message: "Student with this ID already exists" });
    }

    await pool
      .request()
      .input("AcademicID", sql.Int, AcademicID)
      .input("AcademicEmail", sql.NVarChar, AcademicEmail)
      .input("Password", sql.NVarChar, Password)
      .input("GPA", sql.Decimal(3, 2), GPA)
      .input("Name", sql.NVarChar, Name)
      .input("AcademicYear", sql.Int, AcademicYear)
      .input("TuitionFees", sql.Decimal(10, 2), TuitionFees)
      .input("TuitionFeesStatus", sql.NVarChar, TuitionFeesStatus)
      .query(`
        INSERT INTO ServerA.StudentsDB.dbo.Students 
        (AcademicID, AcademicEmail, Password, GPA, Name, AcademicYear, TuitionFees, TuitionFeesStatus)
        VALUES 
        (@AcademicID, @AcademicEmail, @Password, @GPA, @Name, @AcademicYear, @TuitionFees, @TuitionFeesStatus)
      `);

    res.status(201).json({ message: "Student added successfully" });

  } catch (err) {
    console.error("Error adding student:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/add-professor", authenticateJWTadmin, async (req, res) => {
  const {
    ProfessorID,
    Name,
    Email,
    Password,
    courseNames = []
  } = req.body;

  try {
    const pool = await poolPromise;

    for (const courseName of courseNames) {
      const courseCheck = await pool.request()
        .input("CourseName", sql.NVarChar(100), courseName)
        .query(`
          SELECT CourseID, ProfessorID
          FROM ServerB.CoursesDB.dbo.Courses
          WHERE CourseName = @CourseName
        `);

      if (courseCheck.recordset.length === 0) {
        return res.status(404).json({ success: false, message: `Course "${courseName}" not found.` });
      }

      const course = courseCheck.recordset[0];
      if (course.ProfessorID) {
        return res.status(409).json({ success: false, message: `Course "${courseName}" is already assigned to another professor.` });
      }
    }

    await pool.request()
      .input("ProfessorID", sql.Int, ProfessorID)
      .input("Name", sql.NVarChar(100), Name)
      .input("Email", sql.NVarChar(100), Email)
      .input("Password", sql.NVarChar(100), Password)
      .query(`
        INSERT INTO ServerC.ProfessorsDB.dbo.Professors (ProfessorID, Name, Email, Password)
        VALUES (@ProfessorID, @Name, @Email, @Password)
      `);

    for (const courseName of courseNames) {
      await pool.request()
        .input("CourseName", sql.NVarChar(100), courseName)
        .input("ProfessorID", sql.Int, ProfessorID)
        .query(`
          UPDATE ServerB.CoursesDB.dbo.Courses
          SET ProfessorID = @ProfessorID
          WHERE CourseName = @CourseName
        `);
    }

    res.status(201).json({ success: true, message: "Professor added and courses assigned successfully." });

  } catch (err) {
    console.error("Error adding professor and assigning courses:", err);
    if (err.originalError?.info?.number === 2627) {
      res.status(400).json({ success: false, message: "Duplicate ProfessorID or Email." });
    } else {
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
});
//search student
app.get("/api/admin/search-student", authenticateJWTadmin, async (req, res) => {
  const academicId = req.query.academicId;

  if (!academicId || isNaN(academicId)) {
    return res.status(400).json({ success: false, message: "Invalid or missing Academic ID." });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("AcademicID", sql.Int, academicId);

    // Fetch student info from StudentsDB
    const studentResult = await request.query(`
      SELECT AcademicID, AcademicEmail, Password, Name, GPA, AcademicYear, TuitionFees, TuitionFeesStatus
      FROM Students
      WHERE AcademicID = @AcademicID
    `);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const student = studentResult.recordset[0];

    // Count enrolled courses for this student
    const enrollmentCountResult = await request.query(`
      SELECT COUNT(*) AS EnrolledCoursesCount
      FROM StudentEnrollments
      WHERE AcademicID = @AcademicID
    `);

    const enrolledCoursesCount = enrollmentCountResult.recordset[0].EnrolledCoursesCount || 0;

    res.status(200).json({
      success: true,
      student: {
        ...student,
        EnrolledCoursesCount: enrolledCoursesCount
      }
    });

  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});
//edit student
app.put("/api/admin/edit-student", authenticateJWTadmin, async (req, res) => {
  const {
    AcademicID,
    AcademicEmail,
    Password,
    GPA,
    Name,
    AcademicYear,
    TuitionFees,
    TuitionFeesStatus
  } = req.body;

  if (!AcademicID || isNaN(AcademicID)) {
    return res.status(400).json({ success: false, message: "Invalid or missing AcademicID." });
  }


  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("AcademicID", sql.Int, AcademicID);
    request.input("AcademicEmail", sql.NVarChar(100), AcademicEmail);
    request.input("Password", sql.NVarChar(100), Password);
    request.input("GPA", sql.Decimal(3, 2), GPA);
    request.input("Name", sql.NVarChar(100), Name);
    request.input("AcademicYear", sql.Int, AcademicYear);
    request.input("TuitionFees", sql.Decimal(10, 2), TuitionFees);
    request.input("TuitionFeesStatus", sql.NVarChar(10), TuitionFeesStatus);

    const query = `
      UPDATE Students
      SET AcademicEmail = @AcademicEmail,
          Password = @Password,
          GPA = @GPA,
          Name = @Name,
          AcademicYear = @AcademicYear,
          TuitionFees = @TuitionFees,
          TuitionFeesStatus = @TuitionFeesStatus
      WHERE AcademicID = @AcademicID
    `;

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    res.status(200).json({ success: true, message: "Student data updated successfully." });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

//delete student
app.delete("/api/admin/delete-student", authenticateJWTadmin, async (req, res) => {
  const { academicId } = req.body;

  if (!academicId || isNaN(academicId)) {
    return res.status(400).json({ success: false, message: "Invalid or missing Academic ID." });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();

    await request.input("AcademicID", sql.Int, academicId);

    await request.query(`
      DELETE FROM StudentEnrollments WHERE AcademicID = @AcademicID
    `);
    const result = await request.query(`
      DELETE FROM Students WHERE AcademicID = @AcademicID
    `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    res.status(200).json({ success: true, message: "Student and their enrollments deleted successfully." });

  } catch (err) {
    console.error("Error deleting student and enrollments:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/*
app.delete("/api/admin/delete-student", authenticateJWTadmin, async (req, res) => {
  const { academicId } = req.body;

  if (!academicId || isNaN(academicId)) {
    return res.status(400).json({ success: false, message: "Invalid or missing Academic ID." });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("AcademicID", sql.Int, academicId);

    const result = await request.query(`
      DELETE FROM Students WHERE AcademicID = @AcademicID
    `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    res.status(200).json({ success: true, message: "Student deleted successfully." });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});*/


//! courses

app.get("/api/admin/unassigned-courses", authenticateJWTadmin, async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .query(`
        SELECT CourseID, CourseName
        FROM ServerB.CoursesDB.dbo.Courses
        WHERE ProfessorID IS NULL
      `);

    res.status(200).json({
      success: true,
      courses: result.recordset
    });
  } catch (err) {
    console.error("Error fetching unassigned courses:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

