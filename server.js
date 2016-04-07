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
var morgan = require('morgan');
var swig = require('swig');
var winston = require('winston');

var ApiAccessor = require('./lib/ApiAccessor');
var DataFormatter = require('./lib/DataFormatter')

// Initialization.
var app = express();
var server = http.Server(app);
var apiAccessor = ApiAccessor.create(NYTIMES_API_KEY, URL_SHORTENER_API_KEY);
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({ filename: 'logfile.log' })
  ]
});

app.engine('html', swig.renderFile);

app.set('port', PORT_NUMBER);

app.set('view engine', 'html');

app.use(morgan(':date[web] :method :url :req[header] :remote-addr :status'));

app.use('/public', express.static(__dirname + '/public'));

app.use('/:section?', function(request, response) {
  var userAgent = request.headers['user-agent'];
  var section = request.params.section || 'home';

  logger.info(userAgent + ' ' + request.method + ' ' + request.path + ' ' +
	      request.ip);

  apiAccessor.fetch(section, function(error, results) {
    var isCurl = userAgent.indexOf('curl') != -1;
    if (error) {
      logger.info('ERROR: ' + error);
      if (isCurl) {
        response.send("An error occurred. Please try again later. ".red +
                      "(Most likely we hit our rate limit)\n".red);
      } else {
        response.render('index.html', {
          error: true,
          data: null
        });
      }
    } else {
      if (isCurl) {
        response.send(DataFormatter.format(results) +
                      DataFormatter.INCOGNITO_SUGGESTION);
      } else {
        response.render('index.html', {
          error: null,
          data: results
        });
      }
    }
  })
});

// Starts the server.
server.listen(PORT_NUMBER, function() {
  if (!NYTIMES_API_KEY || !URL_SHORTENER_API_KEY) {
    throw new Error('Cannot access API keys.')
  }
  console.log('STARTING SERVER ON PORT ' + PORT_NUMBER);
});
