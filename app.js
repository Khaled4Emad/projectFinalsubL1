const express = require('express');
const sql = require('mssql/msnodesqlv8');
const path = require('path');
require("dotenv").config();

const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.json()); // For parsing JSON data

// Serve the index.html file at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html')); // Adjust path if necessary
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'user', 'MainPageStudent.html'));
});

app.get('/student/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'user', 'ProfilePageStudent.html'));
});


// Connection configuration for each database
const studentsConfig = {
    connectionString: `Driver={${process.env.DB_DRIVER}};Server=${process.env.DB_SERVER};Database=StudentsDB;Trusted_Connection=Yes;`,
    options: {
        trustServerCertificate: true
    }
};

const professorsConfig = {
    connectionString: `Driver={${process.env.DB_DRIVER}};Server=${process.env.DB_SERVER};Database=ProfessorsDB;Trusted_Connection=Yes;`,
    options: {
        trustServerCertificate: true
    }
};

// Route for handling the login
app.post('/login', async (req, res) => {
    const { email, password, userType } = req.body;

    let config, table, emailColumn, passwordColumn;

    if (userType === 'student') {
        config = studentsConfig;
        table = 'Students';
        emailColumn = 'AcademicEmail';
        passwordColumn = 'Password';
    } else if (userType === 'doctor') {
        config = professorsConfig;
        table = 'Professors';
        emailColumn = 'Email';
        passwordColumn = 'Password';
    }

    try {
        // Connect to the appropriate database
        await sql.connect(config);

        // Define the SQL query with parameters
        const query = `
            SELECT * FROM dbo.${table}
            WHERE ${emailColumn} = @Email AND ${passwordColumn} = @Password
        `;

        // Use the input method to define parameters
        const request = new sql.Request();
        request.input('Email', sql.NVarChar, email);
        request.input('Password', sql.NVarChar, password);

        // Execute the query with parameters
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            if (userType === 'student') {
                res.sendFile(path.join(__dirname, 'views', 'user', 'MainPageStudent.html'));
            } else if (userType === 'doctor') {
                res.sendFile(path.join(__dirname, 'views', 'user', 'mainForDoctor.html'));
            }
        } else {
            res.send('❌ Invalid credentials.');
        }
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send('Server error');
    } finally {
        // Close the connection
        await sql.close();
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
