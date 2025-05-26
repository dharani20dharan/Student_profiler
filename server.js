require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ------------------ Middleware Setup ------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use("/uploads", express.static("uploads"));

// ------------------ Multer Setup ------------------
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    },
});
const upload = multer({ storage });
const uploadFields = upload.fields([
    { name: "documents", maxCount: 10 },
    { name: "profilePicture", maxCount: 1 }
]);

// ------------------ MySQL Connection ------------------
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: fs.readFileSync(path.join(__dirname, "certs", "ca.pem")),
        rejectUnauthorized: false
    }
});

connection.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    } else {
        console.log("✅ Connected to Aiven MySQL successfully!");
    }
});

// ------------------ Routes ------------------

// -------- Signup Route --------
app.post("/signup", uploadFields, async (req, res) => {
    try {
        const {
            name, email, password, rollNumber,
            department, yearOfStudy, phoneNumber
        } = req.body;

        if (!name || !email || !password || !rollNumber) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const profilePicFile = req.files?.profilePicture?.[0];
        const profilePicturePath = profilePicFile ? `/uploads/${profilePicFile.filename}` : null;
        const documentFiles = req.files?.documents || [];

        let skills = [], projects = [];

        try {
            skills = typeof req.body.skills === "string" ? JSON.parse(req.body.skills) : req.body.skills || [];
            projects = typeof req.body.projects === "string" ? JSON.parse(req.body.projects) : req.body.projects || [];
        } catch {
            return res.status(400).json({ error: "Invalid JSON in skills or projects" });
        }

        connection.beginTransaction((err) => {
            if (err) return res.status(500).json({ error: "Transaction start failed" });

            const insertUserSql = `
                INSERT INTO users 
                (name, email, password, roll_number, department, year_of_study, phone_number, profile_picture) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            const userValues = [name, email, hashedPassword, rollNumber, department, yearOfStudy, phoneNumber, profilePicturePath];

            connection.query(insertUserSql, userValues, (err, result) => {
                if (err) return connection.rollback(() => res.status(500).json({ error: "User insert failed", detail: err.message }));

                const userId = result.insertId;
                const totalInserts = skills.length + projects.length + documentFiles.length;

                if (totalInserts === 0) {
                    return connection.commit(err => {
                        if (err) return connection.rollback(() => res.status(500).json({ error: "Commit failed" }));
                        return res.json({ message: "✅ User Registered Successfully" });
                    });
                }

                let completed = 0, hasError = false;
                const checkDone = () => {
                    completed++;
                    if (completed === totalInserts && !hasError) {
                        connection.commit(err => {
                            if (err) return connection.rollback(() => res.status(500).json({ error: "Commit failed" }));
                            return res.json({ message: "✅ User Registered Successfully" });
                        });
                    }
                };

                skills.forEach(skill => {
                    connection.query(`INSERT INTO skills (user_id, skill_name) VALUES (?, ?)`, [userId, skill], (err) => {
                        if (err && !hasError) {
                            hasError = true;
                            return connection.rollback(() => res.status(500).json({ error: "Skill insert failed" }));
                        }
                        if (!hasError) checkDone();
                    });
                });

                projects.forEach(({ project_name, project_description, links }) => {
                    connection.query(`INSERT INTO projects (user_id, project_name, project_description, links) VALUES (?, ?, ?, ?)`,
                        [userId, project_name, project_description, links], (err) => {
                            if (err && !hasError) {
                                hasError = true;
                                return connection.rollback(() => res.status(500).json({ error: "Project insert failed" }));
                            }
                            if (!hasError) checkDone();
                        });
                });

                documentFiles.forEach(doc => {
                    connection.query(`INSERT INTO documents (user_id, document_name, file_path) VALUES (?, ?, ?)`,
                        [userId, doc.originalname, `/uploads/${doc.filename}`], (err) => {
                            if (err && !hasError) {
                                hasError = true;
                                return connection.rollback(() => res.status(500).json({ error: "Document insert failed" }));
                            }
                            if (!hasError) checkDone();
                        });
                });
            });
        });
    } catch (err) {
        console.error("❌ Signup Failure:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// -------- Login Route --------
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    connection.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error during login" });
        if (results.length === 0) return res.status(400).json({ error: "User not found" });

        const user = results[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "1h" }
        );

        res.json({ message: "✅ Login successful", token, userId: user.id });
    });
});

// -------- Fetch User Profile --------
app.get("/profile/:userId", (req, res) => {
    const { userId } = req.params;

    const getUserSql = `
        SELECT id, name, email, phone_number, department, year_of_study, 
               roll_number, profile_picture 
        FROM users 
        WHERE id = ?`;

    const getProjectsSql = `SELECT project_name, project_description, links FROM projects WHERE user_id = ?`;
    const getSkillsSql = `SELECT skill_name FROM skills WHERE user_id = ?`;
    const getDocumentsSql = `SELECT document_name AS name, file_path AS file FROM documents WHERE user_id = ?`;

    connection.query(getUserSql, [userId], (err, userResults) => {
        if (err) return res.status(500).json({ error: "Error fetching user" });
        if (userResults.length === 0) return res.status(404).json({ error: "User not found" });

        const user = userResults[0];

        connection.query(getProjectsSql, [userId], (err, projectResults) => {
            if (err) return res.status(500).json({ error: "Error fetching projects" });

            connection.query(getSkillsSql, [userId], (err, skillResults) => {
                if (err) return res.status(500).json({ error: "Error fetching skills" });

                connection.query(getDocumentsSql, [userId], (err, documentResults) => {
                    if (err) return res.status(500).json({ error: "Error fetching documents" });

                    const fullProfile = {
                        ...user,
                        projects: projectResults,
                        skills: skillResults.map(s => s.skill_name),
                        documents: documentResults,
                    };

                    res.json({ message: "Profile data retrieved", user: fullProfile });
                });
            });
        });
    });
});

// -------- Fetch All Users (Dev Test) --------
// -------- Fetch All Users (Dev Test) --------
app.get("/users", (req, res) => {
    console.log("📥 Incoming GET /users request");

    connection.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.error("❌ Error fetching users:", err.message);
            return res.status(500).json({ error: "Database error while fetching users", detail: err.message });
        }

        res.json(results);
    });
});

// -------- Test DB Connection Route --------
app.get("/test-db", (req, res) => {
    connection.query("SELECT 1 + 1 AS result", (err, result) => {
        if (err) {
            console.error("❌ DB Test Failed:", err.message);
            return res.status(500).json({ error: "DB connection test failed", detail: err.message });
        }
        res.json({ message: "✅ DB is working", result });
    });
});


// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
