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

// 1. Trust Proxy (Render ke liye zaroori)
app.set('trust proxy', 1); 

// 2. CORS Settings
app.use(cors({
    origin: ["http://localhost:3000", "https://your-frontend-link.vercel.app"], 
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// 3. FIXED SESSION SETTINGS (Only Use This One)
app.use(session({
    secret: 'ecommerce-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,      // Render pe HTTPS hai isliye TRUE
        sameSite: 'none',  // Cross-origin ke liye NONE
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;