/**
 * @fileoverview The class handles the parsing of the server log file so that
 *   the client can render that data into graphs.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

const fs = require('fs');

/**
 * Constructor for an Analytics object.
 * @constructor
 * @param {string} logFile The path to the server log file
 */
function Analytics(logFile) {
  this.logFile = logFile;
  this.cache = {};
}

/**
 * Milliseconds in a day
 * @const
 * @type {number}
 */
Analytics.CACHE_KEEP_TIME = 86400000;

/**
 * Factory method for an Analytics object.
 * @param {string} logFile The path to the server log file
 * @return {Analytics}
 */
Analytics.create = function(logFile) {
  return new Analytics(logFile);
};


Analytics.prototype.getAnalytics = function(callback) {
  /**
   * First check if we have analytics cached. If not, then we should fetch it
   * again.
   */
  var currentTime = (new Date()).getTime();
  if (this.cache.analytics && currentTime < this.cache.expires) {
    return callback(null, this.cache.analytics);
  }
  fs.readFile(this.logFile, 'utf-8', function(error, data) {
    if (error) {
      return callback(error);
    }
    try {
      data = data.trim().split('\n').map(JSON.parse).map(function(entry) {
        entry.date = new Date(entry.date);
        return entry;
      });
    } catch (error) {
      return callback(error);
    }
    callback(error, data);
  });
};

var a = Analytics.create('../logs/server.log');
a.getAnalytics(function(error, data) {
  console.log(error);
  console.log(data);
});
