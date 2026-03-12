var cors = require('cors');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// --- FIXED CORS SETTINGS ---
app.use(cors({
    origin: ["http://localhost:3000"], // Apne frontend ka URL yahan dalein
    credentials: true, // Ye cookies/session allow karne ke liye zaroori hai
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// --- FIXED SESSION SETTINGS ---
app.use(session({
    secret: 'ecommerce-secret',
    resave: false,
    saveUninitialized: false, // Isko false rakhein taaki faltu sessions create na hon
    cookie: {
        secure: false, // Localhost pe false rakhein, agar Render pe deploy hai aur HTTPS hai toh true karein
        httpOnly: true,
        sameSite: 'lax', // Local development ke liye 'lax' sahi hai
        maxAge: 1000 * 60 * 60 * 24 // 24 ghante
    }
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;