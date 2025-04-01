require("dotenv").config(); // Load environment variables

const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Fix for handling FormData
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Fix for CORS

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "12345",
    database: process.env.DB_NAME || "student_profiles",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    }
    console.log("✅ Connected to MySQL");
});

// Register User
app.post("/signup", upload.array("documents"), async (req, res) => {
    try {
        const { name, email, password, skills, academicYear, major, department, rollNumber, projects } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const documentPaths = req.files ? req.files.map(file => `/uploads/${file.filename}`).join(",") : null;

        const sql = `INSERT INTO users (name, email, password, skills, academic_year, major, department, roll_number, projects, documents) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [name, email, hashedPassword, skills, academicYear, major, department, rollNumber, projects, documentPaths], (err, result) => {
            if (err) {
                console.error("❌ Registration Error:", err);
                return res.status(500).json({ error: "Database error during registration" });
            }
            res.json({ message: "✅ User Registered Successfully" });
        });
    } catch (err) {
        console.error("❌ Registration Failed:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Login User
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("❌ Login Error:", err);
            return res.status(500).json({ error: "Database error during login" });
        }
        if (results.length === 0) return res.status(400).json({ error: "User not found" });

        const user = results[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "1h" }
        );

        // Respond with token and userId
        res.json({
            message: "✅ Login successful",
            token,
            userId: user.id // Include the userId
        });
    });
});

// Middleware for Authentication
// const authenticate = (req, res, next) => {
//     const token = req.header("Authorization");
//     if (!token) return res.status(401).json({ error: "Access Denied. No Token Provided." });

//     try {
//         const bearerToken = token.split(" ")[1]; // Extract actual token
//         if (!bearerToken) return res.status(401).json({ error: "Invalid Token Format" });

//         const verified = jwt.verify(bearerToken, process.env.JWT_SECRET || "default_secret");
//         req.user = verified;
//         console.log("✅ Authenticated User:", req.user); // Debug log
//         next();
//     } catch (err) {
//         return res.status(400).json({ error: "Invalid Token" });
//     }
// };

// 🛠️ Profile Route (Get user profile by ID)
app.get("/profile/:userId", (req, res) => {
    const { userId } = req.params;

    console.log(`Fetching profile for user ID: ${userId}`); // Log userId on backend

    const sql = "SELECT * FROM users WHERE id = ?";

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("❌ Profile Fetch Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            console.log("❌ No user found with that ID.");
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Profile data retrieved", user: results[0] });
    });
});

// Get all users (For debugging)
app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.error("❌ Fetch Users Error:", err);
            return res.status(500).json({ error: "Database error while fetching users" });
        }
        res.json(results);
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
