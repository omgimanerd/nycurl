/**
 * @fileoverview The class handles the parsing of the server analytics log so
 *   that the client can render that data into graphs.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

const fs = require('fs');
const geoip = require('geoip-native');

const CACHE_KEEP_TIME = 3600000;

const cache = {};

/**
 * Fetches analytics on recent site traffic and returns a Promise.
 * @return {Promise}
 */
const getAnalytics = file => {
  /**
   * First check if we have analytics cached. If not, then we should fetch it
   * again.
   */
  var currentTime = Date.now();
  var entry = cache[file];
  if (entry && currentTime < entry.expires) {
    return Promise.resolve(entry.analytics);
  }
  return fs.readFile(path, 'utf8').then(data => {
    data = data.trim().split('\n').map(function(entry) {
      entry = JSON.parse(entry);
      entry.country = geoip.lookup(entry.ip).name;
      return entry;
    });
    cache[file].analytics = data;
    cache[file].expires = currentTime + Analytics.CACHE_KEEP_TIME;
    return data;
  });
};

module.exports = exports = {
  getAnalytics: getAnalytics
};
