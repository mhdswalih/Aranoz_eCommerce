require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nocache = require('nocache');
const uploads = require('./config/uploads');
const passport = require('./config/passport');
const session = require('express-session');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch((err) => {
        console.log('Failed to connect to MongoDB', err);
    });

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());
app.use(morgan('dev'));

app.use((req, res, next) => {
    console.log(req.body);
    next();
});

// Session Secret Handling
if (!process.env.SESSION_SECRET) {
    const SESSION_SECRET = uuidv4();
    console.log("Session Secret:", SESSION_SECRET);
    fs.appendFileSync('.env', `\nSESSION_SECRET=${SESSION_SECRET}`);
    require('dotenv').config();
}

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route Setup
const userRoute = require('./router/userRoute');
const adminRouter = require('./router/adminRoute');
const authRoute = require('./router/Auth');

app.use('/', userRoute);
app.use('/admin', adminRouter);
app.use('/auth', authRoute);

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
