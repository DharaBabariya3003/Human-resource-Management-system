const path = require("path");
const xlsx = require("xlsx");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const logger = require("morgan");
const database = require("./middlewares/database");
const error = require("./middlewares/error");
const { sendRender,sendJson } = require("./middlewares/generateResponse");
const express = require("express");
const app = express();
const session = require('express-session');
const passport=require('passport');
const moment = require("moment");
const redis = require('redis');
const connectRedis = require('connect-redis');
const { redisConfig } = require("./config");
const { sessionSecretKey }=require('./config');
const favicon = require('serve-favicon');
const compression = require('compression');
const httpContext = require('express-http-context');
const { airbrakeConfig } = require('./config');
const Airbrake = require('@airbrake/node');
const airbrakeExpress = require('@airbrake/node/dist/instrumentation/express');
database.connect();

//favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// //public path setup
app.use(express.static(path.join(__dirname, "public")));
app.use('/lib', express.static(path.join(__dirname, "node_modules")));

// view engine setup
app.set("views", path.join(__dirname, "views"));

// enable this if you run behind a proxy (e.g. nginx)
app.set('trust proxy', 1);

const RedisStore = connectRedis(session);

//Configure redis client
const redisClient = redis.createClient({
  host: redisConfig.redis_host,
  port: redisConfig.redis_port
})


redisClient.on('error', function (err) {
  console.log('Could not establish a connection with redis. ' + err);
});
redisClient.on('connect', function (err) {
  console.log('Connected to redis successfully');
});

//Bodyparser
app.use(express.urlencoded({extended:false}));
app.use(cors());
app.use(logger("dev"));
app.use(bodyParser.json());

// Set Http context middleware.
app.use(httpContext.middleware);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname));
app.response.sendRender = sendRender;
app.response.sendJson = sendJson;

//Express Sessions
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret:sessionSecretKey.secret,
  resave:false,
  saveUninitialized:false,
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000
  }
}));

// Air-brake integration
const airbrake = new Airbrake.Notifier({
  projectId: airbrakeConfig.projectId,
  projectKey: airbrakeConfig.projectKey,
});
// This middleware should be added before any routes are defined
app.use(airbrakeExpress.makeMiddleware(airbrake));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', '.ejs');
app.use(compression());
app.use('/', require('./routes/index.routes'));


// The error handler middleware for Airbrake
app.use(airbrakeExpress.makeErrorHandler(airbrake));

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);
// catch 404 and forward to error handler
app.use(error.notFound);
// error handler, send stacktrace only during development
app.use(error.handler);
// app.use(expressSession(session));


module.exports = app;
