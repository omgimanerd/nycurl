/**
 * @fileoverview This is the server app script.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Constants
const NYTIMES_API_KEY = process.env.NYTIMES_API_KEY;
const URL_SHORTENER_API_KEY = process.env.URL_SHORTENER_API_KEY;

/**
 * This API key is only used in production to email Alvin Lin (@omgimanerd)
 * when the production server goes down. Run the server in --dev mode during
 * development
 * @type {string}
 */
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const ALERT_EMAIL = process.env.ALERT_EMAIL;

const DEV_MODE = process.argv.includes('--dev');
const PORT = process.env.PORT || 5000;

const LOG_FILE = 'logs/server.log';
const ANALYTICS_FILE = 'logs/analytics.log';

// Dependencies.
const colors = require('colors');
const emailAlerts = require('email-alerts');
const express = require('express');
const fs = require('fs');
const http = require('http');
const morgan = require('morgan');
const path = require('path');

const logFile = path.join(__dirname, LOG_FILE);
const logFileStream = fs.createWriteStream(logFile, { flags: 'a' });
const analyticsFile = path.join(__dirname, ANALYTICS_FILE);
const analyticsFileStream = fs.createWriteStream(analyticsFile, { flags: 'a' });

const Analytics = require('./server/Analytics');
const ApiAccessor = require('./server/ApiAccessor');
const DataFormatter = require('./server/DataFormatter')

var analytics = Analytics.create(analyticsFile);
var apiAccessor = ApiAccessor.create({
  nytimes_api_key: NYTIMES_API_KEY,
  url_shortener_api_key: URL_SHORTENER_API_KEY
});
var app = express();
if (!DEV_MODE) {
  var alert = emailAlerts({
    fromEmail: 'alert@nycurl.sytes.net',
    toEmail: ALERT_EMAIL,
    apiKey: SENDGRID_API_KEY,
    subject: 'Error - nycurl'
  });
}
var server = http.Server(app);

app.set('port', PORT);
app.set('view engine', 'pug');

app.use('/dist', express.static(__dirname + '/dist'));
app.use('/robots.txt', express.static(__dirname + '/robots.txt'));
app.use('/favicon.ico',
    express.static(`${__dirname}/client/images/favicon.ico`));
app.use(function(request, response, next) {
  request.userAgent = request.headers['user-agent'] || '';
  request.isCurl = request.userAgent.includes('curl');
  next();
});

// Log general server information to the console.
app.use(morgan('dev'));
// Write more specific log information to the server log file.
app.use(morgan('combined', { stream: logFileStream }));
// Only write cURL requests to the analytics file.
app.use(morgan(function(tokens, request, response) {
  return JSON.stringify({
    date: (new Date()).toUTCString(),
    httpVersion: `${request.httpVersionMajor}.${request.httpVersionMinor}`,
    method: request.method,
    referrer: request.headers.referer || request.headers.referrer,
    ip: request.headers['x-forwarded-for'] || request.headers.ip,
    responseTime: tokens['response-time'](request, response),
    status: response.statusCode,
    url: request.url || request.originalUrl,
    path: request.path
  });
}, {
  skip: function(request, response) {
    return !request.isCurl;
  },
  stream: analyticsFileStream
}));

app.get('/help', function(request, response) {
  if (request.isCurl) {
    response.send(DataFormatter.formatSections(ApiAccessor.SECTIONS, false));
  } else {
    response.render('index', {
      header: 'Valid sections to query:',
      listSections: true,
      sections: ApiAccessor.SECTIONS
    });
  }
});

app.get('/:section?', function(request, response, next) {
  var section = request.params.section || 'home';
  if (!ApiAccessor.isValidSection(section)) {
    return next();
  }
  var callback = function(error, articles) {
    if (error) {
      if (DEV_MODE) {
        console.error(error);
      }
      if (request.isCurl) {
        response.status(500).send(
            'An error occurred. Please try again later. '.red +
            '(Most likely we hit our rate limit)\n'.red);
      } else {
        response.status(500).render('index', {
          header: 'An error occurred. Please try again later. ' +
            '(Most likely we hit our rate limit)'
        });
      }
    } else {
      if (request.isCurl) {
        response.send(DataFormatter.formatArticles(articles, request.query));
      } else {
        response.render('index', {
          header: `nycurl.sytes.net/${section}`,
          listSections: false,
          data: articles
        });
      }
    }
  };
  if (!DEV_MODE) {
    apiAccessor.fetch(section, alert.errorHandler(callback));
  } else {
    apiAccessor.fetch(section, callback);
  }
});

app.get('/analytics', function(request, response) {
  if (request.isCurl) {
    response.send(DataFormatter.formatSections(ApiAccessor.SECTIONS, false));
  } else {
    response.render('analytics');
  }
});

app.post('/analytics', function(request, response) {
  analytics.getAnalytics(function(error, data) {
    response.send(data);
  });
});

app.use(function(request, response) {
  if (request.isCurl) {
    response.send(DataFormatter.formatSections(ApiAccessor.SECTIONS, true));
  } else {
    response.render('index', {
      header: 'Invalid query! Valid sections to query:',
      listSections: true,
      sections: ApiAccessor.SECTIONS
    });
  }
});

// Starts the server.
server.listen(PORT, function() {
  console.log('STARTING SERVER ON PORT ' + PORT);
  if (DEV_MODE) {
    console.log('DEV_MODE ENABLED!');
  }
  if (!process.env.NYTIMES_API_KEY) {
    throw new Error('No NYTimes API key specified.');
  }
  if (!process.env.URL_SHORTENER_API_KEY) {
    throw new Error('No URL shortener API key specified.');
  }
  if (!DEV_MODE && !SENDGRID_API_KEY) {
    throw new Error('No SendGrid API key specified! Use --dev mode?');
  }
  if (!DEV_MODE && !ALERT_EMAIL) {
    throw new Error('No alert email specified! Use --dev mode?');
  }
});
