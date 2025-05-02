const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const app = express();
const i18n = require('i18n');
const PORT = 3000;

const { connectToDatabase } = require("../db/database");
const db = connectToDatabase();
i18n.configure({
    locales: ['en', 'sw'],
    directory: path.join(__dirname, 'locales'),
    defaultLocale: 'en',
    queryParameter: 'lang',
    cookie: 'lang',
    autoReload: true,
    updateFiles: false
  });
  
  app.use(i18n.init);
  
  // Make i18n available in all EJS templates
  app.use((req, res, next) => {
    res.locals.__ = res.__.bind(req); 
    next();
  });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(session({
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: true
}));


// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Routes 
const startRoutes = require("./routes/main");
const authRoutes = require("./routes/auth");
const facilitiesRoutes = require("./routes/facilities");
const governmentRoutes = require("./routes/government");
const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);



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


