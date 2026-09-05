console.log("Starting server process...");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const { sql, poolPromise } = require("./db");

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());
function auth(roles = []) {
    return (req, res, next) => {
        const header = req.headers["authorization"] || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) return res.status(401).json({ success: false, message: "No token provided" });

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            req.user = payload; // { id, username, role }
            if (roles.length && !roles.includes(payload.role)) {
                return res.status(403).json({ success: false, message: "Access denied for role: " + payload.role });
            }
            next();
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }
    };
}


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
    res.send("Student Management System Backend is Running!");
});

// ======================================================
// TEST DATABASE
// ======================================================

app.get("/test-db", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query("SELECT 1 AS Test");

        res.json(result.recordset);

    } catch (error) {

        console.error("Database Error:", error);

        res.status(500).json({
            error: "Database connection failed",
            details: error.message
        });

    }

});
// ======================================================
// LOGIN
// ======================================================

// ======================================================
// LOGIN
// ======================================================

const ROLE_CONFIG = {
    admin: { table: "Admin", idField: "Admin_id" },
    teacher: { table: "Teacher", idField: "Teacher_id" },
    student: { table: "Student", idField: "Student_id" },
};
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        const pool = await poolPromise;

        // ------------------------------------------
        // 1. CHECK ADMIN TABLE FIRST
        // ------------------------------------------
        const adminResult = await pool
            .request()
            .input("username", sql.VarChar, username)
            .input("password", sql.VarChar, password)
            .query(`
                SELECT * FROM Admin 
                WHERE Username = @username AND Password = @password
            `);

        if (adminResult.recordset.length > 0) {
            const admin = adminResult.recordset[0];
            return res.json({
                message: "Admin login successful",
                role: "admin",
                adminId: admin.Admin_id,
                user: admin
            });
        }

        // ------------------------------------------
        // 2. CHECK TEACHER TABLE SECOND
        // ------------------------------------------
        const teacherResult = await pool
            .request()
            .input("username", sql.VarChar, username)
            .input("password", sql.VarChar, password)
            .query(`
                SELECT * FROM Teacher 
                WHERE (Email = @username OR Username = @username) 
                  AND Password = @password
            `);

        if (teacherResult.recordset.length > 0) {
            const teacher = teacherResult.recordset[0];
            return res.json({
                message: "Teacher login successful",
                role: "teacher",
                teacherId: teacher.Teacher_id || teacher.id,
                user: teacher
            });
        }

        // ------------------------------------------
        // 3. CHECK STUDENT TABLE THIRD
        // ------------------------------------------
        const studentResult = await pool
            .request()
            .input("username", sql.VarChar, username)
            .input("password", sql.VarChar, password)
            .query(`
                SELECT *, (First_Name + ' ' + Last_Name) AS Name
                FROM Student
                WHERE (Username = @username OR Email = @username OR CAST(Roll_No AS VARCHAR) = @username) 
                  AND Password = @password
            `);

        if (studentResult.recordset.length > 0) {
            const student = studentResult.recordset[0];
            return res.json({
                message: "Student login successful",
                role: "student",
                studentId: student.Student_id,
                user: student
            });
        }

        // ------------------------------------------
        // IF NO MATCH FOUND IN ANY TABLE
        // ------------------------------------------
        return res.status(401).json({ error: "Invalid username/email or password." });

    } catch (error) {
        console.error("LOGIN ERROR DETAILS:", error);
        res.status(500).json({
            error: "Server error during login",
            details: error.message
        });
    }
});
// ======================================================
// STUDENTS
// ======================================================

// ======================================================
// GET ALL STUDENTS
// ======================================================

app.get("/students", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT *
                FROM Student
                ORDER BY Student_id
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Get Students Error:", error);

        res.status(500).json({
            error: "Unable to fetch students",
            details: error.message
        });

    }

});
// app.post("/ai-assistant", async (req, res) => {
//     try {
//         const { question } = req.body;

//         if (!question || !question.trim()) {
//             return res.status(400).json({
//                 error: "Question is required"
//             });
//         }

//         const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//         if (!GEMINI_API_KEY) {
//             return res.status(500).json({
//                 error: "Gemini API key is not configured on the server"
//             });
//         }

//         const response = await fetch(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${GEMINI_API_KEY}`,
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     contents: [
//                         {
//                             parts: [
//                                 {
//                                     text: `You are an AI Academic Assistant for a Student Management System built under UN SDG 4 (Quality Education).

// Your role:
// - Help students with study plans.
// - Help improve attendance.
// - Give exam preparation tips.
// - Explain academic concepts.
// - Provide career guidance.
// - Answer in a clear and student-friendly way.

// Question: ${question}`
//                                 }
//                             ]
//                         }
//                     ]
//                 })
//             }
//         );

//         const data = await response.json();

//         if (!response.ok) {
//             console.error("Gemini API Error:", data);

//             return res.status(response.status).json({
//                 error: data.error?.message || "Gemini API request failed"
//             });
//         }

//         const aiReply =
//             data.candidates?.[0]?.content?.parts?.[0]?.text ||
//             "Sorry, I couldn't generate a response.";

//         res.json({
//             reply: aiReply
//         });

//     } catch (error) {
//         console.error("AI Assistant Error:", error);

//         res.status(500).json({
//             error: "Unable to connect to AI Assistant",
//             details: error.message
//         });
//     }
// });
app.post("/ai-assistant", async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                error: "Question is required"
            });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Gemini API key is not configured on the server"
            });
        }

        const model = "gemini-3.7-flash";

        let response;
        let data;

        // Try up to 3 times if Gemini is temporarily busy
        for (let attempt = 1; attempt <= 3; attempt++) {

            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `You are an AI Academic Assistant for a Student Management System built under UN SDG 4 (Quality Education).

Your role:
- Help students with study plans.
- Help improve attendance.
- Give exam preparation tips.
- Explain academic concepts.
- Provide career guidance.
- Answer in a clear and student-friendly way.

Keep answers clear, useful, concise, and student-friendly.

Question: ${question}`
                                    }
                                ]
                            }
                        ]
                    })
                }
            );

            data = await response.json();

            // Success
            if (response.ok) {
                break;
            }

            console.error(
                `Gemini attempt ${attempt} failed:`,
                data.error?.message || data
            );

            // Retry only for temporary overload/rate-limit errors
            if (
                (response.status === 429 || response.status === 503) &&
                attempt < 3
            ) {
                const delay = attempt * 3000;

                console.log(
                    `Gemini is temporarily unavailable. Retrying in ${delay / 1000} seconds...`
                );

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );

                continue;
            }

            // Don't retry other errors
            break;
        }

        // Gemini still failed after retries
        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data.error?.message ||
                    "Gemini API request failed. Please try again later."
            });
        }

        const aiReply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't generate a response.";

        res.json({
            reply: aiReply
        });

    } catch (error) {
        console.error("AI Assistant Error:", error);

        res.status(500).json({
            error: "Unable to connect to AI Assistant",
            details: error.message
        });
    }
});

// ======================================================
// GET ONE STUDENT
// ======================================================

app.get("/students/:id", async (req, res) => {

    try {

        const studentId = parseInt(req.params.id, 10);

        if (isNaN(studentId)) {

            return res.status(400).json({
                error: "Invalid Student ID"
            });

        }

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input(
                "Student_id",
                sql.Int,
                studentId
            )
            .query(`
                SELECT *
                FROM Student
                WHERE Student_id = @Student_id
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                error: "Student not found"
            });

        }

        // Get student record
        const student = result.recordset[0];

        // ==================================================
        // FORMAT DATE OF BIRTH
        // ==================================================

        if (student.DOB) {

            student.DOB = new Date(student.DOB)
                .toISOString()
                .split("T")[0]
                .split("-")
                .reverse()
                .join("-");

        }

        // ==================================================
        // FORMAT ADMISSION DATE
        // ==================================================

        if (student.Admission_Date) {

            student.Admission_Date = new Date(student.Admission_Date)
                .toISOString()
                .split("T")[0]
                .split("-")
                .reverse()
                .join("-");

        }

        // ==================================================
        // SEND STUDENT DATA
        // ==================================================

        res.json(student);

    } catch (error) {

        console.error("Get Student Error:", error);

        res.status(500).json({
            error: "Unable to get student",
            details: error.message
        });

    }

});
// ==========================================
// GET SINGLE STUDENT PROFILE BY ID
// ==========================================
// ==========================================
// UPDATE STUDENT RECORD BY ID
// ==========================================
app.put("/students/:id", async (req, res) => {
    try {
        const studentId = parseInt(req.params.id, 10);
        if (isNaN(studentId)) {
            return res.status(400).json({ error: "Invalid Student ID format." });
        }

        const {
            Roll_No,
            First_Name,
            Last_Name,
            Class,
            Section,
            Gender,
            Email,
            Phone_No,
            DOB,
            Admission_Date,
            Username
        } = req.body;

        const pool = await poolPromise;

        // Agar Username nahi bheja ya NULL hai, toh Roll_No ko hi Username bana do
        const finalUsername = (Username && Username.trim() !== "") ? Username : Roll_No;

        const result = await pool
            .request()
            .input("Student_id", sql.Int, studentId)
            .input("Roll_No", sql.VarChar(20), Roll_No)
            .input("First_Name", sql.VarChar(50), First_Name)
            .input("Last_Name", sql.VarChar(50), Last_Name)
            .input("Class", sql.VarChar(20), Class)
            .input("Section", sql.VarChar(10), Section)
            .input("Gender", sql.VarChar(10), Gender)
            .input("Email", sql.VarChar(100), Email)
            .input("Phone_No", sql.VarChar(20), Phone_No)
            .input("DOB", sql.Date, DOB ? DOB : null)
            .input("Admission_Date", sql.Date, Admission_Date ? Admission_Date : null)
            .input("Username", sql.VarChar(50), finalUsername)
            .query(`
                UPDATE Student
                SET
                    Roll_No = @Roll_No,
                    First_Name = @First_Name,
                    Last_Name = @Last_Name,
                    Class = @Class,
                    Section = @Section,
                    Gender = @Gender,
                    Email = @Email,
                    Phone_No = @Phone_No,
                    DOB = @DOB,
                    Admission_Date = @Admission_Date,
                    Username = @Username
                WHERE Student_id = @Student_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Student not found." });
        }

        res.json({ message: "Student record updated successfully!" });
    } catch (error) {
        console.error("Update Student Error:", error);
        res.status(500).json({
            error: "Failed to update student details.",
            details: error.message
        });
    }
});

// ======================================================
// ADD STUDENT
// ======================================================

app.post("/students", async (req, res) => {
    try {
        const {
            Roll_No,
            First_Name,
            Last_Name,
            Class,
            Section,
            Gender,
            DOB,
            Phone_No,
            Email,
            Address,
            Admission_Date
        } = req.body;

        // Validation check (Removed strict First_Name requirement if your form only has Last Name)
        if (
            !Roll_No ||
            !Last_Name ||
            !Class ||
            !Section ||
            !Gender ||
            !Phone_No ||
            !Email
        ) {
            return res.status(400).json({
                error: "Please provide all required student fields"
            });
        }

        // Ensure First_Name is string or empty string if missing from form
        const safeFirstName = First_Name || "";

        // Ensure Username is a valid string derived from Roll_No
        const Username = String(Roll_No).trim();
        const Password = "student123";

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("Roll_No", sql.VarChar(20), String(Roll_No))
            .input("First_Name", sql.VarChar(50), safeFirstName)
            .input("Last_Name", sql.VarChar(50), Last_Name)
            .input("Class", sql.VarChar(20), Class)
            .input("Section", sql.VarChar(10), Section)
            .input("Gender", sql.VarChar(10), Gender)
            .input("DOB", sql.Date, DOB || null)
            .input("Phone_No", sql.VarChar(15), Phone_No)
            .input("Email", sql.VarChar(100), Email)
            .input("Address", sql.VarChar(255), Address || null)
            .input("Admission_Date", sql.Date, Admission_Date || null)
            .input("Username", sql.VarChar(50), Username)
            .input("Password", sql.VarChar(255), Password)
            .query(`
                INSERT INTO Student
                (
                    Roll_No,
                    First_Name,
                    Last_Name,
                    Class,
                    Section,
                    Gender,
                    DOB,
                    Phone_No,
                    Email,
                    Address,
                    Admission_Date,
                    Username,
                    Password
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @Roll_No,
                    @First_Name,
                    @Last_Name,
                    @Class,
                    @Section,
                    @Gender,
                    @DOB,
                    @Phone_No,
                    @Email,
                    @Address,
                    @Admission_Date,
                    @Username,
                    @Password
                )
            `);

        res.status(201).json({
            message: "Student added successfully",
            student: result.recordset[0]
        });

    } catch (error) {
        console.error("Add Student Error:", error);

        res.status(500).json({
            error: "Unable to add student",
            details: error.message
        });
    }
});

// ======================================================
// UPDATE STUDENT
// ======================================================
// ==========================================
// UPDATE STUDENT RECORD BY ID
// ==========================================
// ==========================================
// UPDATE STUDENT RECORD BY ID
// ==========================================
app.put("/students/:id", async (req, res) => {
    try {
        const studentId = parseInt(req.params.id, 10);
        if (isNaN(studentId)) {
            return res.status(400).json({ error: "Invalid Student ID format." });
        }

        const {
            Roll_No,
            First_Name,
            Last_Name,
            Class,
            Section,
            Gender,
            Email,
            Phone_No,
            DOB,
            Admission_Date
        } = req.body;

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("Student_id", sql.Int, studentId)
            .input("Roll_No", sql.VarChar(20), Roll_No)
            .input("First_Name", sql.VarChar(50), First_Name)
            .input("Last_Name", sql.VarChar(50), Last_Name)
            .input("Class", sql.VarChar(20), Class)
            .input("Section", sql.VarChar(10), Section)
            .input("Gender", sql.VarChar(10), Gender)
            .input("Email", sql.VarChar(100), Email)
            .input("Phone_No", sql.VarChar(20), Phone_No)
            .input("DOB", sql.Date, DOB ? DOB : null)
            .input("Admission_Date", sql.Date, Admission_Date ? Admission_Date : null)
            .query(`
                UPDATE Student
                SET
                    Roll_No = @Roll_No,
                    First_Name = @First_Name,
                    Last_Name = @Last_Name,
                    Class = @Class,
                    Section = @Section,
                    Gender = @Gender,
                    Email = @Email,
                    Phone_No = @Phone_No,
                    DOB = @DOB,
                    Admission_Date = @Admission_Date
                WHERE Student_id = @Student_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Student not found." });
        }

        res.json({ message: "Student record updated successfully!" });
    } catch (error) {
        console.error("Update Student Error:", error);
        res.status(500).json({
            error: "Failed to update student details.",
            details: error.message
        });
    }
});

// ======================================================
// DELETE STUDENT
// ======================================================

app.delete("/students/:id", async (req, res) => {

    try {

        const studentId = parseInt(req.params.id, 10);

        if (isNaN(studentId)) {
            return res.status(400).json({
                error: "Invalid Student ID"
            });
        }

        const pool = await poolPromise;

        // Delete child records first

        await pool.request()
            .input("Student_id", sql.Int, studentId)
            .query(`
                DELETE FROM Marks
                WHERE Student_id = @Student_id
            `);

        await pool.request()
            .input("Student_id", sql.Int, studentId)
            .query(`
                DELETE FROM Attendence
                WHERE Student_id = @Student_id
            `);

        await pool.request()
            .input("Student_id", sql.Int, studentId)
            .query(`
                DELETE FROM Fees
                WHERE Student_id = @Student_id
            `);

        // Now delete student

        const result = await pool.request()
            .input("Student_id", sql.Int, studentId)
            .query(`
                DELETE FROM Student
                WHERE Student_id = @Student_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        res.json({
            message: "Student deleted successfully"
        });

    } catch (error) {

        console.error("Delete Student Error:", error);

        res.status(500).json({
            error: "Unable to delete student",
            details: error.message
        });

    }

});

// ======================================================
// TEACHERS
// ======================================================

// ======================================================
// GET ALL TEACHERS
// ======================================================

// app.get("/teachers", async (req, res) => {

//     try {

//         const pool = await poolPromise;

//         const result = await pool
//             .request()
//             .query(`
//                 SELECT *
//                 FROM Teacher
//                 ORDER BY Teacher_id
//             `);

//         res.json(result.recordset);

//     } catch (error) {

//         console.error("Get Teachers Error:", error);

//         res.status(500).json({
//             error: "Unable to fetch teachers",
//             details: error.message
//         });

//     }

// });
app.get("/teachers", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT *
                FROM Teacher
                WHERE IsActive = 1
                ORDER BY Teacher_id
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error("Get Teachers Error:", error);

        res.status(500).json({
            error: "Unable to fetch teachers",
            details: error.message
        });
    }
});
// ======================================================
// GET ONE TEACHER
// ======================================================

app.get("/teachers/:id", async (req, res) => {

    try {

        const teacherId =
            parseInt(req.params.id, 10);

        if (isNaN(teacherId)) {

            return res.status(400).json({
                error: "Invalid Teacher ID"
            });

        }

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input(
                "Teacher_id",
                sql.Int,
                teacherId
            )
            .query(`
                SELECT *
                FROM Teacher
                WHERE Teacher_id = @Teacher_id
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                error: "Teacher not found"
            });

        }

        res.json(result.recordset[0]);

    } catch (error) {

        console.error("Get Teacher Error:", error);

        res.status(500).json({
            error: "Unable to get teacher",
            details: error.message
        });

    }

});

// ======================================================
// ADD TEACHER
// ======================================================

// app.post("/teachers", async (req, res) => {

//     console.log("POST /teachers received");
//     console.log("Teacher data:", req.body);

//     try {

//         const {
//             First_Name,
//             Last_Name,
//             Subject,
//             Phone_No,
//             Email,
//             Qualification,
//             Joining_Date,
//             Address
//         } = req.body;
//         if (!First_Name || !Last_Name) {

//             return res.status(400).json({
//                 error: "First Name and Last Name are required"
//             });

//         }

//         const pool = await poolPromise;

//         const result = await pool
//             .request()

//             .input(
//                 "First_Name",
//                 sql.VarChar(100),
//                 First_Name
//             )

//             .input(
//                 "Last_Name",
//                 sql.VarChar(100),
//                 Last_Name
//             )

//             .input(
//                 "Subject",
//                 sql.VarChar(100),
//                 Subject || null
//             )

//             .input(
//                 "Phone_No",
//                 sql.VarChar(20),
//                 Phone_No || null
//             )

//             .input(
//                 "Email",
//                 sql.VarChar(150),
//                 Email || null
//             )

//             .input(
//                 "Qualification",
//                 sql.VarChar(200),
//                 Qualification || null
//             )

//             .input(
//                 "Joining_Date",
//                 sql.Date,
//                 Joining_Date || null
//             )

//             .input(
//                 "Address",
//                 sql.VarChar(255),
//                 Address || null
//             )

//             .query(`
//                 INSERT INTO Teacher
//                 (
//                     First_Name,
//                     Last_Name,
//                     Subject,
//                     Phone_No,
//                     Email,
//                     Qualification,
//                     Joining_Date,
//                     Address
//                 )

//                 OUTPUT INSERTED.*

//                 VALUES
//                 (
//                     @First_Name,
//                     @Last_Name,
//                     @Subject,
//                     @Phone_No,
//                     @Email,
//                     @Qualification,
//                     @Joining_Date,
//                     @Address
//                 )
//             `);

//         res.status(201).json({

//             message: "Teacher added successfully",

//             teacher: result.recordset[0]

//         });

//     } catch (error) {

//         console.error("Add Teacher Error:", error);

//         res.status(500).json({

//             error: "Unable to add teacher",

//             details: error.message

//         });

//     }

// });


app.post("/teachers", async (req, res) => {

    console.log("POST /teachers received");
    console.log("Teacher data:", req.body);

    try {

        const {
            First_Name,
            Last_Name,
            Subject,
            Phone_No,
            Email,
            Qualification,
            Joining_Date,
            Address
        } = req.body;

        if (!First_Name || !Last_Name) {

            return res.status(400).json({
                error: "First Name and Last Name are required"
            });

        }

        const pool = await poolPromise;

        // Generate username automatically
        const Username =
            (First_Name + Last_Name)
                .toLowerCase()
                .replace(/\s+/g, "") +
            Math.floor(Math.random() * 1000);

        // Default password
        const Password = "teacher123";

        const result = await pool
            .request()

            .input(
                "First_Name",
                sql.VarChar(100),
                First_Name
            )

            .input(
                "Last_Name",
                sql.VarChar(100),
                Last_Name
            )

            .input(
                "Subject",
                sql.VarChar(100),
                Subject || null
            )

            .input(
                "Phone_No",
                sql.VarChar(20),
                Phone_No || null
            )

            .input(
                "Email",
                sql.VarChar(150),
                Email || null
            )

            .input(
                "Qualification",
                sql.VarChar(200),
                Qualification || null
            )

            .input(
                "Joining_Date",
                sql.Date,
                Joining_Date || null
            )

            .input(
                "Username",
                sql.VarChar(50),
                Username
            )

            .input(
                "Password",
                sql.VarChar(255),
                Password
            )

            .input(
                "Address",
                sql.VarChar(255),
                Address || null
            )

            .query(`
                INSERT INTO Teacher
                (
                    First_Name,
                    Last_Name,
                    Subject,
                    Phone_No,
                    Email,
                    Qualification,
                    Joining_Date,
                    Username,
                    Password,
                    Address
                )

                OUTPUT INSERTED.*

                VALUES
                (
                    @First_Name,
                    @Last_Name,
                    @Subject,
                    @Phone_No,
                    @Email,
                    @Qualification,
                    @Joining_Date,
                    @Username,
                    @Password,
                    @Address
                )
            `);

        res.status(201).json({

            message: "Teacher added successfully",

            username: Username,

            password: Password,

            teacher: result.recordset[0]

        });

    } catch (error) {

        console.error("Add Teacher Error:", error);

        res.status(500).json({

            error: "Unable to add teacher",

            details: error.message

        });

    }

});
// ======================================================
// UPDATE TEACHER
// ======================================================

app.put("/teachers/:id", async (req, res) => {

    try {

        const teacherId =
            parseInt(req.params.id, 10);

        if (isNaN(teacherId)) {

            return res.status(400).json({
                error: "Invalid Teacher ID"
            });

        }

        const {
            First_Name,
            Last_Name,
            Subject,
            Phone_No,
            Email,
            Qualification,
            Joining_Date,
            Address
        } = req.body;

        const pool = await poolPromise;

        const result = await pool
            .request()

            .input(
                "Teacher_id",
                sql.Int,
                teacherId
            )

            .input(
                "First_Name",
                sql.VarChar(100),
                First_Name
            )

            .input(
                "Last_Name",
                sql.VarChar(100),
                Last_Name
            )

            .input(
                "Subject",
                sql.VarChar(100),
                Subject || null
            )

            .input(
                "Phone_No",
                sql.VarChar(20),
                Phone_No || null
            )

            .input(
                "Email",
                sql.VarChar(150),
                Email || null
            )

            .input(
                "Qualification",
                sql.VarChar(200),
                Qualification || null
            )

            .input(
                "Joining_Date",
                sql.Date,
                Joining_Date || null
            )

            .input(
                "Address",
                sql.VarChar(255),
                Address || null
            )

            .query(`
                UPDATE Teacher

                SET
                    First_Name = @First_Name,
                    Last_Name = @Last_Name,
                    Subject = @Subject,
                    Phone_No = @Phone_No,
                    Email = @Email,
                    Qualification = @Qualification,
                    Joining_Date = @Joining_Date,
                    Address = @Address

                WHERE Teacher_id = @Teacher_id
            `);

        if (result.rowsAffected[0] === 0) {

            return res.status(404).json({
                error: "Teacher not found"
            });

        }

        res.json({
            message: "Teacher updated successfully"
        });

    } catch (error) {

        console.error("Update Teacher Error:", error);

        res.status(500).json({
            error: "Unable to update teacher",
            details: error.message
        });

    }

});


// ======================================================
// DELETE TEACHER
// ======================================================

// app.delete("/teachers/:id", async (req, res) => {

//     try {

//         const teacherId =
//             parseInt(req.params.id, 10);

//         if (isNaN(teacherId)) {

//             return res.status(400).json({
//                 error: "Invalid Teacher ID"
//             });

//         }

//         const pool = await poolPromise;

//         const result = await pool
//             .request()
//             .input(
//                 "Teacher_id",
//                 sql.Int,
//                 teacherId
//             )
//             .query(`
//                 DELETE FROM Teacher
//                 WHERE Teacher_id = @Teacher_id
//             `);

//         if (result.rowsAffected[0] === 0) {

//             return res.status(404).json({
//                 error: "Teacher not found"
//             });

//         }

//         res.json({
//             message: "Teacher deleted successfully"
//         });

//     } catch (error) {

//         console.error("Delete Teacher Error:", error);

//         res.status(500).json({
//             error: "Unable to delete teacher",
//             details: error.message
//         });

//     }

// });
app.delete("/teachers/:id", async (req, res) => {
    try {
        const teacherId = parseInt(req.params.id, 10);

        if (isNaN(teacherId)) {
            return res.status(400).json({
                error: "Invalid Teacher ID"
            });
        }

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("Teacher_id", sql.Int, teacherId)
            .query(`
                UPDATE Teacher
                SET IsActive = 0
                WHERE Teacher_id = @Teacher_id
                  AND IsActive = 1
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                error: "Teacher not found or already deleted"
            });
        }

        res.json({
            message: "Teacher deleted successfully"
        });

    } catch (error) {
        console.error("Delete Teacher Error:", error);

        res.status(500).json({
            error: "Unable to delete teacher",
            details: error.message
        });
    }
});

// ======================================================
// ATTENDENCE
// ======================================================

app.get("/attendence", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT *
                FROM Attendence
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Attendence Error:", error);

        res.status(500).json({
            error: "Unable to fetch attendence",
            details: error.message
        });

    }

});

// ======================================================
// MARKS
// ======================================================

// GET ALL MARKS

app.get("/marks", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT *
                FROM Marks
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Marks Error:", error);

        res.status(500).json({
            error: "Unable to fetch marks",
            details: error.message
        });

    }

});
// ======================================================
// GET MARKS FOR ONE STUDENT
// ======================================================

app.get("/students/:id/marks", async (req, res) => {

    try {

        const studentId = parseInt(req.params.id, 10);

        if (isNaN(studentId)) {
            return res.status(400).json({
                error: "Invalid Student ID"
            });
        }

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("Student_id", sql.Int, studentId)
            .query(`
                SELECT
                    m.Marks_id,
                    m.Student_id,
                    m.Teacher_id,
                    m.Subject,
                    m.Marks,
                    m.Exam_Type,
                    t.First_Name + ' ' + t.Last_Name AS Teacher_Name
                FROM Marks m
                LEFT JOIN Teacher t
                    ON m.Teacher_id = t.Teacher_id
                WHERE m.Student_id = @Student_id
                ORDER BY m.Subject, m.Exam_Type
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Student Marks Error:", error);

        res.status(500).json({
            error: "Unable to fetch student marks",
            details: error.message
        });

    }

});
app.post("/marks", async (req, res) => {

    try {

        const {
            Student_id,
            Teacher_id,
            Subject,
            Marks,
            Exam_Type
        } = req.body;

        const pool = await poolPromise;

        await pool
            .request()
            .input("Student_id", sql.Int, Student_id)
            .input("Teacher_id", sql.Int, Teacher_id)
            .input("Subject", sql.VarChar(50), Subject)
            .input("Marks", sql.Int, Marks)
            .input("Exam_Type", sql.VarChar(30), Exam_Type)
            .query(`
                INSERT INTO Marks
                (
                    Student_id,
                    Teacher_id,
                    Subject,
                    Marks,
                    Exam_Type
                )
                VALUES
                (
                    @Student_id,
                    @Teacher_id,
                    @Subject,
                    @Marks,
                    @Exam_Type
                )
            `);

        res.json({
            message: "Marks added successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});
// ======================================================
// DELETE MARKS
// ======================================================

app.delete("/marks/:id", async (req, res) => {

    try {

        const marksId = parseInt(req.params.id, 10);

        if (isNaN(marksId)) {
            return res.status(400).json({
                error: "Invalid Marks ID"
            });
        }

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("Marks_id", sql.Int, marksId)
            .query(`
                DELETE FROM Marks
                WHERE Marks_id = @Marks_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                error: "Marks record not found"
            });
        }

        res.json({
            message: "Marks record deleted successfully"
        });

    } catch (error) {

        console.error("Delete Marks Error:", error);

        res.status(500).json({
            error: "Unable to delete marks record",
            details: error.message
        });

    }

});
// UPDATE MARKS
app.put("/marks/:id", async (req, res) => {
    try {
        const marksId = parseInt(req.params.id, 10);

        if (isNaN(marksId)) {
            return res.status(400).json({
                error: "Invalid Marks ID"
            });
        }

        const {
            Student_id,
            Teacher_id,
            Subject,
            Marks,
            Exam_Type
        } = req.body;

        if (
            !Student_id ||
            !Teacher_id ||
            !Subject ||
            Marks === undefined ||
            !Exam_Type
        ) {
            return res.status(400).json({
                error: "All marks fields are required"
            });
        }

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("Marks_id", sql.Int, marksId)
            .input("Student_id", sql.Int, parseInt(Student_id, 10))
            .input("Teacher_id", sql.Int, parseInt(Teacher_id, 10))
            .input("Subject", sql.VarChar(50), Subject)
            .input("Marks", sql.Int, parseInt(Marks, 10))
            .input("Exam_Type", sql.VarChar(30), Exam_Type)
            .query(`
                UPDATE Marks
                SET
                    Student_id = @Student_id,
                    Teacher_id = @Teacher_id,
                    Subject = @Subject,
                    Marks = @Marks,
                    Exam_Type = @Exam_Type
                WHERE Marks_id = @Marks_id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                error: "Marks record not found"
            });
        }

        res.json({
            message: "Marks record updated successfully"
        });

    } catch (error) {
        console.error("Update Marks Error:", error);

        res.status(500).json({
            error: "Unable to update marks record",
            details: error.message
        });
    }
});
// ======================================================
// FEES (SYNCED WITH FRONTEND & DB SCHEMA)
// ======================================================

// GET ALL FEES
app.get("/fees", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .query(`
                SELECT 
    f.Fee_id,
    f.Student_id,
    f.Paid_Fee AS Amount,
    f.Total_Fee,
    f.Pending_Fee,
    f.Payment_Date,
    f.Payment_Method,
    CASE 
        WHEN f.Paid_Fee >= f.Total_Fee THEN 'Paid'
        WHEN f.Paid_Fee > 0 THEN 'Pending'
        ELSE 'Overdue'
    END AS Status
FROM Fees f
ORDER BY f.Fee_id DESC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error("Get Fees Error:", error);
        res.status(500).json({
            error: "Unable to fetch fees records",
            details: error.message
        });
    }
});

// ADD NEW FEE RECORD
app.post("/fees", async (req, res) => {
    try {
        const { Student_id, Total_Fee, Paid_Fee, Payment_Date, Payment_Method } = req.body;

        if (!Student_id || Total_Fee === undefined) {
            return res.status(400).json({ error: "Student_id and Total_Fee are required" });
        }

        const paid = Paid_Fee || 0;

        const pool = await poolPromise;
        await pool
            .request()
            .input("Student_id", sql.Int, Student_id)
            .input("Total_Fee", sql.Decimal(10, 2), Total_Fee)
            .input("Paid_Fee", sql.Decimal(10, 2), paid)
            .input("Payment_Date", sql.Date, Payment_Date || new Date())
            .input("Payment_Method", sql.VarChar(50), Payment_Method || null)
            .query(`
                INSERT INTO Fees (Student_id, Total_Fee, Paid_Fee, Payment_Date, Payment_Method)
                VALUES (@Student_id, @Total_Fee, @Paid_Fee, @Payment_Date, @Payment_Method)
            `);

        res.status(201).json({ message: "Fee record added successfully" });
    } catch (error) {
        console.error("Add Fee Error:", error);
        res.status(500).json({ error: "Unable to add fee record", details: error.message });
    }
});

// DELETE FEE RECORD
app.delete("/fees/:id", async (req, res) => {
    try {
        const feeId = parseInt(req.params.id, 10);
        if (isNaN(feeId)) {
            return res.status(400).json({ error: "Invalid Fee ID" });
        }

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("Fee_id", sql.Int, feeId)
            .query(`DELETE FROM Fees WHERE Fee_id = @Fee_id`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Fee record not found" });
        }

        res.json({ message: "Fee record deleted successfully" });
    } catch (error) {
        console.error("Delete Fee Error:", error);
        res.status(500).json({
            error: "Unable to delete fee record",
            details: error.message
        });
    }
});

// ======================================================
// UPDATE FEE RECORD
// ======================================================
app.put("/fees/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { Total_Fee, Paid_Fee, Payment_Date, Payment_Method } = req.body;

        const pool = await poolPromise;

        await pool
            .request()
            .input("Fee_id", id)
            .input("Total_Fee", Total_Fee)
            .input("Paid_Fee", Paid_Fee)
            .input("Payment_Date", Payment_Date || null)
            .input("Payment_Method", Payment_Method || null)
            .query(`
                UPDATE Fees
                SET Total_Fee = @Total_Fee,
                    Paid_Fee = @Paid_Fee,
                    Payment_Date = @Payment_Date,
                    Payment_Method = @Payment_Method
                WHERE Fee_id = @Fee_id
            `);

        res.json({ message: "Fee record updated successfully!" });
    } catch (error) {
        console.error("Update Fee Error:", error);
        res.status(500).json({
            error: "Unable to update fee record",
            details: error.message
        });
    }
});
// ======================================================
// DASHBOARD
// ======================================================

app.get("/dashboard", async (req, res) => {

    try {

        const pool = await poolPromise;

        const students = await pool
            .request()
            .query(`
                SELECT COUNT(*) AS TotalStudents
                FROM Student
            `);

        const teachers = await pool
            .request()
            .query(`
                SELECT COUNT(*) AS TotalTeachers
                FROM Teacher
            `);

        const classes = await pool
            .request()
            .query(`
                SELECT COUNT(DISTINCT Class) AS TotalClasses
                FROM Student
            `);

        res.json({

            totalStudents:
                students.recordset[0].TotalStudents,

            totalTeachers:
                teachers.recordset[0].TotalTeachers,

            totalClasses:
                classes.recordset[0].TotalClasses

        });

    } catch (error) {

        console.error("Dashboard Error:", error);

        res.status(500).json({

            error: "Unable to fetch dashboard data",

            details: error.message

        });

    }

});

// ======================================================
// TOTAL STUDENTS
// ======================================================

app.get("/total-students", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT COUNT(*) AS TotalStudents
                FROM Student
            `);

        res.json(result.recordset[0]);

    } catch (error) {

        res.status(500).json({

            error: "Unable to get total students",

            details: error.message

        });

    }

});

// ======================================================
// TOTAL TEACHERS
// ======================================================

app.get("/total-teachers", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT COUNT(*) AS TotalTeachers
                FROM Teacher
            `);

        res.json(result.recordset[0]);

    } catch (error) {

        res.status(500).json({

            error: "Unable to get total teachers",

            details: error.message

        });

    }

});

// ======================================================
// TOTAL CLASSES
// ======================================================

app.get("/total-classes", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT COUNT(DISTINCT Class) AS TotalClasses
                FROM Student
            `);

        res.json(result.recordset[0]);

    } catch (error) {

        res.status(500).json({

            error: "Unable to get total classes",

            details: error.message

        });

    }

});

// ======================================================
// STUDENTS BY CLASS
// ======================================================

app.get("/students-by-class", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT
                    Class,
                    COUNT(*) AS TotalStudents

                FROM Student

                GROUP BY Class

                ORDER BY Class
            `);

        res.json(result.recordset);

    } catch (error) {

        res.status(500).json({

            error: "Unable to get students by class",

            details: error.message

        });

    }

});

// ======================================================
// STUDENTS BY GENDER
// ======================================================

app.get("/students-by-gender", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT
                    Gender,
                    COUNT(*) AS TotalStudents

                FROM Student

                GROUP BY Gender
            `);

        res.json(result.recordset);

    } catch (error) {

        res.status(500).json({

            error: "Unable to get students by gender",

            details: error.message

        });

    }

});

// ======================================================
// REPORTS
// ======================================================

// ======================================================
// REPORTS SUMMARY
// ======================================================

app.get("/reports/summary", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    (SELECT COUNT(*)
                     FROM Student)
                    AS TotalStudents,

                    (SELECT COUNT(*)
                     FROM Teacher)
                    AS TotalTeachers,

                    (SELECT COUNT(*)
                     FROM Attendence)
                    AS TotalAttendanceRecords,

                    (SELECT COUNT(*)
                     FROM Marks)
                    AS TotalMarksRecords,

                    (SELECT ISNULL(SUM(Total_Fee), 0)
                     FROM Fees)
                    AS TotalFees,

                    (SELECT ISNULL(SUM(Paid_Fee), 0)
                     FROM Fees)
                    AS TotalPaidFees,

                    (SELECT ISNULL(SUM(Pending_Fee), 0)
                     FROM Fees)
                    AS TotalPendingFees
            `);

        res.json(result.recordset[0]);

    } catch (error) {

        console.error("Reports Summary Error:", error);

        res.status(500).json({

            error: "Unable to fetch reports summary",

            details: error.message

        });

    }

});

// ======================================================
// STUDENT REPORT
// ======================================================

app.get("/reports/students", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    Student_id,
                    Roll_No,
                    First_Name,
                    Last_Name,
                    Class,
                    Section,
                    Gender,
                    DOB,
                    Phone_No,
                    Email,
                    Address,
                    Admission_Date

                FROM Student

                ORDER BY
                    Class,
                    Section,
                    Roll_No
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Student Report Error:", error);

        res.status(500).json({

            error: "Unable to fetch student report",

            details: error.message

        });

    }

});

// ======================================================
// STUDENTS BY CLASS REPORT
// ======================================================

app.get("/reports/students-by-class", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    Class,
                    Section,
                    COUNT(*) AS TotalStudents

                FROM Student

                GROUP BY
                    Class,
                    Section

                ORDER BY
                    Class,
                    Section
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error(
            "Students By Class Report Error:",
            error
        );

        res.status(500).json({

            error: "Unable to fetch students by class",

            details: error.message

        });

    }

});

// ======================================================
// ATTENDANCE REPORT
// ======================================================

app.get("/reports/attendance", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    s.Student_id,

                    s.Roll_No,

                    s.First_Name + ' ' + s.Last_Name
                        AS Student_Name,

                    s.Class,

                    s.Section,

                    COUNT(a.Attendence_id)
                        AS Total_Days,

                    SUM(
                        CASE
                            WHEN a.Status = 'Present'
                            THEN 1
                            ELSE 0
                        END
                    ) AS Present_Days,

                    SUM(
                        CASE
                            WHEN a.Status = 'Absent'
                            THEN 1
                            ELSE 0
                        END
                    ) AS Absent_Days,

                    CAST(

                        SUM(
                            CASE
                                WHEN a.Status = 'Present'
                                THEN 1
                                ELSE 0
                            END
                        ) * 100.0

                        /

                        NULLIF(
                            COUNT(a.Attendence_id),
                            0
                        )

                        AS DECIMAL(5,2)

                    ) AS Attendance_Percentage

                FROM Student s

                LEFT JOIN Attendence a
                    ON s.Student_id = a.Student_id

                GROUP BY

                    s.Student_id,
                    s.Roll_No,
                    s.First_Name,
                    s.Last_Name,
                    s.Class,
                    s.Section

                ORDER BY
                    Attendance_Percentage
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error(
            "Attendance Report Error:",
            error
        );

        res.status(500).json({

            error: "Unable to fetch attendance report",

            details: error.message

        });

    }

});

// ======================================================
// ACADEMIC REPORT
// ======================================================

app.get("/reports/academic", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    s.Roll_No,

                    s.First_Name + ' ' + s.Last_Name
                        AS Student_Name,

                    s.Class,

                    s.Section,

                    m.Subject,

                    m.Marks,

                    m.Exam_Type

                FROM Student s

                INNER JOIN Marks m
                    ON s.Student_id = m.Student_id

                ORDER BY
                    s.Class,
                    s.Section,
                    s.Roll_No
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error(
            "Academic Report Error:",
            error
        );

        res.status(500).json({

            error: "Unable to fetch academic report",

            details: error.message

        });

    }

});

// ======================================================
// SUBJECT PERFORMANCE REPORT
// ======================================================

app.get("/reports/subject-performance", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    Subject,

                    COUNT(Marks_id)
                        AS Number_of_Students,

                    CAST(
                        AVG(
                            CAST(
                                Marks AS DECIMAL(5,2)
                            )
                        )
                        AS DECIMAL(5,2)
                    ) AS Average_Marks,

                    MAX(Marks)
                        AS Highest_Marks,

                    MIN(Marks)
                        AS Lowest_Marks

                FROM Marks

                GROUP BY Subject

                ORDER BY Average_Marks DESC
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error(
            "Subject Performance Report Error:",
            error
        );

        res.status(500).json({

            error: "Unable to fetch subject performance",

            details: error.message

        });

    }

});

// ======================================================
// FEE REPORT
// ======================================================

app.get("/reports/fees", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    s.Roll_No,

                    s.First_Name + ' ' + s.Last_Name
                        AS Student_Name,

                    s.Class,

                    s.Section,

                    f.Total_Fee,

                    f.Paid_Fee,

                    f.Pending_Fee,

                    f.Payment_Date

                FROM Student s

                INNER JOIN Fees f
                    ON s.Student_id = f.Student_id

                ORDER BY
                    f.Pending_Fee DESC
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error(
            "Fee Report Error:",
            error
        );

        res.status(500).json({

            error: "Unable to fetch fee report",

            details: error.message

        });

    }

});

// ======================================================
// FEE SUMMARY
// ======================================================

app.get("/reports/fee-summary", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    ISNULL(
                        SUM(Total_Fee),
                        0
                    ) AS Total_Fees,

                    ISNULL(
                        SUM(Paid_Fee),
                        0
                    ) AS Total_Paid,

                    ISNULL(
                        SUM(Pending_Fee),
                        0
                    ) AS Total_Pending

                FROM Fees
            `);

        res.json(result.recordset[0]);

    } catch (error) {

        console.error(
            "Fee Summary Error:",
            error
        );

        res.status(500).json({

            error: "Unable to fetch fee summary",

            details: error.message

        });

    }

});

// ======================================================
// LOW ATTENDANCE REPORT
// ======================================================

app.get("/reports/low-attendance", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT

                    s.Roll_No,

                    s.First_Name + ' ' + s.Last_Name
                        AS Student_Name,

                    s.Class,

                    s.Section,

                    COUNT(a.Attendence_id)
                        AS Total_Days,

                    SUM(
                        CASE
                            WHEN a.Status = 'Present'
                            THEN 1
                            ELSE 0
                        END
                    ) AS Present_Days,

                    SUM(
                        CASE
                            WHEN a.Status = 'Absent'
                            THEN 1
                            ELSE 0
                        END
                    ) AS Absent_Days,

                    CAST(

                        SUM(
                            CASE
                                WHEN a.Status = 'Present'
                                THEN 1
                                ELSE 0
                            END
                        ) * 100.0

                        /

                        NULLIF(
                            COUNT(a.Attendence_id),
                            0
                        )

                        AS DECIMAL(5,2)

                    ) AS Attendance_Percentage

                FROM Student s

                INNER JOIN Attendence a
                    ON s.Student_id = a.Student_id

                GROUP BY

                    s.Roll_No,
                    s.First_Name,
                    s.Last_Name,
                    s.Class,
                    s.Section

                HAVING

                    CAST(

                        SUM(
                            CASE
                                WHEN a.Status = 'Present'
                                THEN 1
                                ELSE 0
                            END
                        ) * 100.0

                        /

                        NULLIF(
                            COUNT(a.Attendence_id),
                            0
                        )

                        AS DECIMAL(5,2)

                    ) < 75

                ORDER BY
                    Attendance_Percentage
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error(
            "Low Attendance Report Error:",
            error
        );

        res.status(500).json({

            error: "Unable to fetch low attendance report",

            details: error.message

        });

    }

});

// ======================================================
// TEST REPORT ROUTE
// ======================================================

app.get("/test-report", (req, res) => {

    res.send("REPORT ROUTE WORKING");

});

app.post("/attendence", async (req, res) => {

    console.log("======================================");
    console.log("POST /attendence RECEIVED");
    console.log("Request Body:", req.body);

    try {

        const {
            student_id,
            teacher_id,
            date,
            status
        } = req.body;

        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------

        if (!student_id || !teacher_id || !date || !status) {

            console.log("Missing attendance fields");

            return res.status(400).json({
                error: "Student ID, Teacher ID, date and status are required"
            });

        }

        if (!["Present", "Absent", "Late"].includes(status)) {

            console.log("Invalid status:", status);

            return res.status(400).json({
                error: "Invalid attendance status"
            });

        }

        const studentId = parseInt(student_id, 10);

        if (isNaN(studentId)) {

            return res.status(400).json({
                error: "Invalid Student ID"
            });

        }
        const teacherId = parseInt(teacher_id, 10);

        if (isNaN(teacherId)) {

            return res.status(400).json({
                error: "Invalid Teacher ID"
            });

        }

        const pool = await poolPromise;

        // ----------------------------------------------
        // CHECK STUDENT EXISTS
        // ----------------------------------------------

        const studentCheck = await pool
            .request()
            .input("Student_id", sql.Int, studentId)
            .query(`
                SELECT Student_id
                FROM Student
                WHERE Student_id = @Student_id
            `);

        if (studentCheck.recordset.length === 0) {

            console.log("Student not found:", studentId);

            return res.status(404).json({
                error: "Student not found"
            });

        }
        const teacherCheck = await pool
            .request()
            .input("Teacher_id", sql.Int, teacherId)
            .query(`
        SELECT Teacher_id
        FROM Teacher
        WHERE Teacher_id = @Teacher_id
    `);

        if (teacherCheck.recordset.length === 0) {

            console.log("Teacher not found:", teacherId);

            return res.status(404).json({
                error: "Teacher not found"
            });

        }

        // ----------------------------------------------
        // CHECK WHETHER ATTENDANCE ALREADY EXISTS
        // ----------------------------------------------

        const attendanceCheck = await pool
            .request()
            .input("Student_id", sql.Int, studentId)
            .input("Attendence_Date", sql.Date, date)
            .query(`
                SELECT Attendence_id
                FROM Attendence
                WHERE Student_id = @Student_id
                AND Attendence_Date = @Attendence_Date
            `);

        // ----------------------------------------------
        // UPDATE EXISTING RECORD
        // ----------------------------------------------

        if (attendanceCheck.recordset.length > 0) {

            const attendanceId =
                attendanceCheck.recordset[0].Attendence_id;

            console.log(
                "Updating attendance ID:",
                attendanceId
            );

            await pool
                .request()
                .input(
                    "Attendence_id",
                    sql.Int,
                    attendanceId
                )
                .input(
                    "Teacher_id",
                    sql.Int,
                    teacherId
                )
                .input(
                    "Status",
                    sql.VarChar(20),
                    status
                )
                .query(`
        UPDATE Attendence

        SET
            Teacher_id = @Teacher_id,
            Status = @Status

        WHERE Attendence_id = @Attendence_id
    `);

            console.log("Attendance updated successfully");

            return res.status(200).json({
                message: "Attendance updated successfully"
            });
        }

        // ----------------------------------------------
        // INSERT NEW RECORD
        // ----------------------------------------------

        console.log(
            "Creating new attendance record..."
        );

        const result = await pool
            .request()
            .input(
                "Student_id",
                sql.Int,
                studentId
            )
            .input(
                "Teacher_id",
                sql.Int,
                teacherId
            )
            .input(
                "Attendence_Date",
                sql.Date,
                date
            )
            .input(
                "Status",
                sql.VarChar(20),
                status
            )
            .query(`
                INSERT INTO Attendence
                (
                    Student_id,
                    Teacher_id,
                    Attendence_Date,
                    Status
                )

                OUTPUT INSERTED.*

                VALUES
                (
                    @Student_id,
                    @Teacher_id,
                    @Attendence_Date,
                    @Status
                )
            `);

        console.log(
            "Attendance inserted successfully"
        );

        console.log(
            "Inserted record:",
            result.recordset[0]
        );

        res.status(201).json({
            message: "Attendance marked successfully",
            attendance: result.recordset[0]
        });

    } catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "ATTENDANCE ERROR:"
        );

        console.error(error);

        console.error(
            "======================================"
        );

        res.status(500).json({
            error: "Failed to update attendance",
            details: error.message
        });
    }
});
app.get("/attendance/metrics", async (req, res) => {

    try {

        const studentId = parseInt(req.query.student_id, 10);

        if (isNaN(studentId)) {
            return res.status(400).json({
                error: "Valid Student ID is required"
            });
        }

        const pool = await poolPromise;

        // ---------------------------------------------
        // 1. GET TOTAL WORKING DAYS
        // ---------------------------------------------

        const workingDaysResult = await pool
            .request()
            .query(`
                SELECT COUNT(DISTINCT Attendence_Date) AS TotalWorkingDays
                FROM Attendence
            `);

        const totalWorkingDays =
            Number(workingDaysResult.recordset[0].TotalWorkingDays) || 0;


        // ---------------------------------------------
        // 2. GET THIS STUDENT'S ATTENDANCE
        // ---------------------------------------------

        const studentResult = await pool
            .request()
            .input("Student_id", sql.Int, studentId)
            .query(`
                SELECT
                    SUM(
                        CASE
                            WHEN Status = 'Present'
                            THEN 1
                            ELSE 0
                        END
                    ) AS DaysPresent,

                    SUM(
                        CASE
                            WHEN Status = 'Absent'
                            THEN 1
                            ELSE 0
                        END
                    ) AS DaysAbsent

                FROM Attendence

                WHERE Student_id = @Student_id
            `);

        const daysPresent =
            Number(studentResult.recordset[0].DaysPresent) || 0;

        const daysAbsent =
            Number(studentResult.recordset[0].DaysAbsent) || 0;


        // ---------------------------------------------
        // 3. CALCULATE ATTENDANCE PERCENTAGE
        // ---------------------------------------------

        let attendancePercentage = 0;

        if (totalWorkingDays > 0) {

            attendancePercentage =
                (daysPresent / totalWorkingDays) * 100;

        }

        attendancePercentage =
            Number(attendancePercentage.toFixed(2));


        // ---------------------------------------------
        // 4. SEND RESPONSE
        // ---------------------------------------------

        res.json({

            totalWorkingDays: totalWorkingDays,

            daysPresent: daysPresent,

            daysAbsent: daysAbsent,

            attendancePercentage: attendancePercentage

        });

    } catch (error) {

        console.error(
            "Student Attendance Metrics Error:",
            error
        );

        res.status(500).json({

            error: "Failed to fetch attendance metrics",

            details: error.message

        });

    }

});
// ======================================================
// ADMIN PROFILE / SETTINGS
// ======================================================

// GET ADMIN PROFILE
app.get("/admin/profile", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query(`
                SELECT
                    Admin_id,
                    Username,
                    Name,
                    Email
                FROM Admin
                WHERE Admin_id = 1
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                error: "Admin profile not found"
            });

        }

        res.json(result.recordset[0]);

    } catch (error) {

        console.error("Get Admin Profile Error:", error);

        res.status(500).json({
            error: "Unable to fetch admin profile",
            details: error.message
        });

    }

});


// UPDATE ADMIN PROFILE
app.put("/admin/profile", async (req, res) => {

    console.log("======================================");
    console.log("PUT /admin/profile RECEIVED");
    console.log("Profile data:", req.body);

    try {

        const {
            Username,
            Name,
            Email
        } = req.body;

        if (!Username || !Name || !Email) {

            return res.status(400).json({
                error: "Username, Name and Email are required"
            });

        }

        const pool = await poolPromise;

        const result = await pool
            .request()

            .input(
                "Username",
                sql.VarChar(50),
                Username
            )

            .input(
                "Name",
                sql.VarChar(100),
                Name
            )

            .input(
                "Email",
                sql.VarChar(100),
                Email
            )

            .query(`
                UPDATE Admin

                SET
                    Username = @Username,
                    Name = @Name,
                    Email = @Email

                WHERE Admin_id = 1
            `);

        if (result.rowsAffected[0] === 0) {

            return res.status(404).json({
                error: "Admin profile not found"
            });

        }

        // Return the UPDATED profile
        const updatedProfile = await pool
            .request()
            .query(`
                SELECT
                    Admin_id,
                    Username,
                    Name,
                    Email
                FROM Admin
                WHERE Admin_id = 1
            `);

        console.log(
            "Admin profile updated successfully"
        );

        res.json({
            message: "Profile updated successfully",
            profile: updatedProfile.recordset[0]
        });

    } catch (error) {

        console.error(
            "Update Admin Profile Error:",
            error
        );

        res.status(500).json({
            error: "Unable to update admin profile",
            details: error.message
        });

    }

});
// ======================================================
// ADMIN PROFILE / SETTINGS
// ======================================================

// GET ADMIN PROFILE
app.get("/profile", async (req, res) => {

    try {

        const adminId = 1;

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("Admin_id", sql.Int, adminId)
            .query(`
                SELECT
                    Admin_id,
                    Username,
                    Name,
                    Email
                FROM Admin
                WHERE Admin_id = @Admin_id
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                error: "Admin profile not found"
            });

        }

        res.json(result.recordset[0]);

    } catch (error) {

        console.error("Get Profile Error:", error);

        res.status(500).json({
            error: "Unable to fetch profile",
            details: error.message
        });

    }

});


// UPDATE ADMIN PROFILE
app.put("/profile", async (req, res) => {

    console.log("======================================");
    console.log("PUT /profile RECEIVED");
    console.log("Request Body:", req.body);

    try {

        const adminId = 1;

        const {
            Name,
            Email
        } = req.body;

        if (!Name || !Email) {

            return res.status(400).json({
                error: "Name and Email are required"
            });

        }

        const pool = await poolPromise;

        const result = await pool
            .request()

            .input(
                "Admin_id",
                sql.Int,
                adminId
            )

            .input(
                "Name",
                sql.VarChar(100),
                Name
            )

            .input(
                "Email",
                sql.VarChar(100),
                Email
            )

            .query(`
                UPDATE Admin

                SET
                    Name = @Name,
                    Email = @Email

                WHERE Admin_id = @Admin_id
            `);

        if (result.rowsAffected[0] === 0) {

            return res.status(404).json({
                error: "Admin profile not found"
            });

        }

        console.log("Admin profile updated successfully");

        res.json({
            message: "Profile updated successfully",
            profile: {
                Name: Name,
                Email: Email
            }
        });

    } catch (error) {

        console.error("Update Profile Error:", error);

        res.status(500).json({
            error: "Unable to update profile",
            details: error.message
        });

    }

});
// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;
// ==========================================
// GET SINGLE STUDENT PROFILE BY ID
// ==========================================
app.get("/students/:id", async (req, res) => {
    try {
        const studentId = parseInt(req.params.id, 10);
        if (isNaN(studentId)) {
            return res.status(400).json({ error: "Invalid Student ID format." });
        }

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("Student_id", sql.Int, studentId)
            .query(`
                SELECT 
                    Student_id,
                    Roll_No,
                    First_Name,
                    Last_Name,
                    (First_Name + ' ' + Last_Name) AS Name,
                    Class,
                    Section,
                    Gender,
                    Email,
                    Phone_Number
                FROM Student
                WHERE Student_id = @Student_id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Student profile not found." });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Fetch Student Profile Error:", error);
        res.status(500).json({ error: "Failed to retrieve student details.", details: error.message });
    }
});

app.listen(PORT, () => {

    console.log("--------------------------------------");

    console.log(
        "Student Management System Backend"
    );

    console.log(
        `Server running at http://localhost:${PORT}`
    );

    console.log("--------------------------------------");

    console.log(
        "Teacher POST route: /teachers"
    );

    console.log(
        "Marks GET route: /marks"
    );

    console.log(
        "Reports Summary route: /reports/summary"
    );

});