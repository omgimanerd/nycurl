/**
 * @fileoverview This is the server app script.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Constants
const IP = process.env.IP || 'localhost';
const PORT_NUMBER = process.env.PORT || 5000;

// Dependencies.
var assert = require('assert');
var chalk = require('chalk');
var express = require('express');
var http = require('http');
var swig = require('swig');
var winston = require('winston');

var ApiAccessor = require('./lib/ApiAccessor');
var DataFormatter = require('./lib/DataFormatter')

// Initialization.
var app = express();
var server = http.Server(app);
var errorLogger = new winston.Logger({
  transports: [
    new (winston.transports.File)({ filename: './logs/error.log' })
  ]
});
var serverLogger = new winston.Logger({
  transports: [
    new (winston.transports.File)({ filename: './logs/server.log' })
  ]
});
var apiAccessor = ApiAccessor.create(process.env.NYTIMES_API_KEY,
                                     process.env.URL_SHORTENER_API_KEY);

var alert = require('./lib/alert')(process.env.SENDGRID_API_KEY);

app.engine('html', swig.renderFile);

app.set('port', PORT_NUMBER);

app.set('view engine', 'html');

app.use('/public', express.static(__dirname + '/public'));
app.use('/robots.txt', express.static(__dirname + '/robots.txt'));
app.use('/favicon.ico', express.static(
    __dirname + '/public/images/favicon.ico'));

app.get('/:section?', function(request, response) {
  var userAgent = request.headers['user-agent'] || '';
  var section = request.params.section || 'home';
  var isCurl = userAgent.indexOf('curl') != -1;

  serverLogger.info({
    userAgent: userAgent,
    method: request.method,
    path: request.path,
    ip: request.ip
  });

  if (!ApiAccessor.isValidSection(section)) {
    if (isCurl) {
      response.status(404);
      response.send(chalk.red(
          'Not a valid section to query! Valid queries:\n' + (
          ApiAccessor.SECTIONS.join('\n') + '\n')));
    } else {
      response.render('index.html', {
        error: 'Not a valid section to query! Valid queries:<br />' + (
          ApiAccessor.SECTIONS.join('<br />'))
      });
    }
  } else {
    apiAccessor.fetch(section, function(error, results) {
      if (error) {
        errorLogger.error(error);
        alert('nycurl.sytes.net - Error', error, function(error, results) {
          if (isCurl) {
            response.status(500).send(chalk.red(
                "An error occurred. Please try again later. " +
                "(Most likely we hit our rate limit)\n"));
          } else {
            response.status(500).render('index.html', {
              error: 'An error occurred. Please try again later. ' +
                '(Most likely we hit our rate limit)'
            });
          }
        });
      } else {
        if (isCurl) {
          response.send(DataFormatter.format(results) +
                        DataFormatter.TWITTER_LINK);
        } else {
          response.render('index.html', {
            error: null,
            data: results
          });
        }
      }
    });
  }
});

// Starts the server.
server.listen(PORT_NUMBER, function() {
  if (!process.env.NYTIMES_API_KEY) {
    throw new Error('No NYTIMES API key specified.');
  }
  if (!process.env.URL_SHORTENER_API_KEY) {
    throw new Error('No URL shortener API key specified.');
  }
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('No SendGrid API key specified!');
  }
  console.log('STARTING SERVER ON PORT ' + PORT_NUMBER);
});
