let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let cookieSession = require('cookie-session');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let agentRouter = require('./routes/agent');
let testRouter = require('./routes/test');
const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', 1) // trust first proxy

 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
  name: 'session',
  keys: ['Endeleza_key'],
  sameSite: "M-Weza",
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(function (req, res, next) {
  //req.session = null;
  next();
})


app.use('/test', testRouter);
app.use('/', indexRouter);
//app.use('/agent', agentRouter);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
