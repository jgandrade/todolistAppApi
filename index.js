require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require("cookie-parser");
const credentials = require('./middleware/credentials');
const corsOptions = require('./config/corsOptions');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

app.use(cookieParser());
app.use(credentials);
app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const DB_URL = process.env.DB_URL;
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Failed connecting to database."));
db.once("open", () => console.log("Successfully connected to database"));

// IMPORT ROUTES
const userRoutes = require('./routes/userRoutes');

// SETUP ROUTES
app.use('/', userRoutes);

//404 route
app.all("*", (req, res) => {
    console.error("Route Not Found");
    res.status(404).send("Route Not Found");
});

app.listen(port, () => console.log(`Port running at ${port}`));