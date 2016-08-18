/**
 * @fileoverview This is the server app script.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Constants
var IP = process.env.IP || 'localhost';
var PORT_NUMBER = process.env.PORT || 5000;
var NYTIMES_API_KEY = process.env.NYTIMES_API_KEY;
var URL_SHORTENER_API_KEY = process.env.URL_SHORTENER_API_KEY;

// Dependencies.
var assert = require('assert');
var colors = require('colors');
var express = require('express');
var http = require('http');
var swig = require('swig');
var winston = require('winston');

var ApiAccessor = require('./lib/ApiAccessor');
var DataFormatter = require('./lib/DataFormatter')

// Initialization.
var app = express();
var server = http.Server(app);
var errorLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({ filename: './logs/error.log' })
  ]
});
var serverLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({ filename: './logs/server.log' })
  ]
});
var apiAccessor = ApiAccessor.create(NYTIMES_API_KEY, URL_SHORTENER_API_KEY);

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
      response.send(('Not a valid section to query! Valid queries:\n' + (
        ApiAccessor.SECTIONS.join('\n') + '\n')).red);
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
        response.status(500);
        if (isCurl) {
          response.send("An error occurred. Please try again later. ".red +
                        "(Most likely we hit our rate limit)\n".red);
        } else {
          response.render('index.html', {
            error: 'An error occurred. Please try again later. ' +
              '(Most likely we hit our rate limit)'
          });
        }
      } else {
        try {
          if (isCurl) {
            response.send(DataFormatter.format(results) +
                          DataFormatter.INCOGNITO_SUGGESTION +
                          DataFormatter.TWITTER_LINK);
          } else {
            response.render('index.html', {
              error: null,
              data: results
            });
          }
        } catch (error) {
          errorLogger.error(error);
          errorLogger.error(error.message);
          response.render(
            'Sorry I screwed up! Please contact me at alvin.lin.dev@gmail.com');
        }
      }
    });
  }
});

// Starts the server.
server.listen(PORT_NUMBER, function() {
  if (!NYTIMES_API_KEY || !URL_SHORTENER_API_KEY) {
    throw new Error('Cannot access API keys.')
  }
  console.log('STARTING SERVER ON PORT ' + PORT_NUMBER);
});
