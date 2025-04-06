const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

const { connectToDatabase } = require("../db/database");
const db = connectToDatabase();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));


// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Routes 
const startRoutes = require("./routes/main");
const authRoutes = require("./routes/auth");
const facilitiesRoutes = require("./routes/facilities");
const governmentRoutes = require("./routes/government");

// Use routes
app.use("/", startRoutes);
app.use("/auth", authRoutes);
app.use("/facilities", facilitiesRoutes);
app.use("/government", governmentRoutes);

// Route doesn't exist
app.use((req, res, next) => {
    res.status(404).json({ error: "Route not found" });
});

// Handle other errors 
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


