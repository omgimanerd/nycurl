/**
 * @fileoverview This file exports loggers for the server.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */


const expressWinston = require('express-winston');
const winston = require('winston');

const dynamicMetaFunction = (request, response) => {
  return {
    ip: request.headers['x-forwarded-for'] || request.ip
  };
};

module.exports = exports = (analyticsFile, errorFile) => {
  return {
    analyticsLogger: expressWinston.logger({
      transports: [
        new winston.transports.File({
          json: true,
          filename: analyticsFile,
          showLevel: false,
          timestamp: true
        })
      ],
      skip: (request, response) => {
        return response.statusCode != 200;
      },
      dynamicMeta: dynamicMetaFunction
    }),
    devLogger: expressWinston.logger({
      transports: [
        new winston.transports.Console({ showLevel: false, timestamp: true })
      ],
      expressFormat: true,
      colorize: true,
      dynamicMeta: dynamicMetaFunction
    }),
    errorLogger: new winston.Logger({
      transports: [
        new winston.transports.Console({
          prettyPrint: true,
          timestamp: true
        }),
        new winston.transports.File({
          filename: errorFile,
          timestamp: true
        })
      ]
    })
  };
};
