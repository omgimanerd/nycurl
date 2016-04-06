/**
 * @fileoverview This class handles the fetching and formatting of data from
 *   the NYTimes API.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Dependencies
var request = require('request');

/**
 * Constructor for an ApiAccessor.
 * @constructor
 * @param {string} nytimes_api_key The API key for the NY Times API.
 * @param {string} url_shortener_api_key The API key for Google's URL
 *   Shortener API.
 */
function ApiAccessor(nytimes_api_key, url_shortener_api_key) {
  this.nytimes_api_key = nytimes_api_key;
  this.url_shortener_api_key = url_shortener_api_key;

  this.cache = {};
}

/**
 * @const
 * @type {Array<string>}
 */
ApiAccessor.SECTIONS = ['home', 'world', 'national', 'politics', 'nyregion',
  'business', 'opinion', 'technology', 'science', 'health', 'sports', 'arts',
  'fashion', 'dining', 'travel', 'magazine', 'realestate'];

/**
 * @const
 * @type {number}
 */
ApiAccessor.CACHE_EXPIRATION_TIME = 60000;

/**
 * Factory method for an ApiAccessor.
 * @param {string} nytimes_api_key The API key for the NY Times API.
 * @param {string} url_shortener_api_key The API key for Google's URL
 *   Shortener API.
 * @return {ApiAccessor}
 */
ApiAccessor.create = function(nytimes_api_key, url_shortener_api_key) {
  return new ApiAccessor(nytimes_api_key, url_shortener_api_key);
};

/**
 * This method returns the base URL for a request to the NYTimes API.
 * @param {string} section The NY Times section to query.
 * @return {string}
 */
ApiAccessor.getNyTimesUrl = function(section) {
  if (!section) {
    section = 'home';
  }
  return 'http://api.nytimes.com/svc/topstories/v1/' + section + '.json';
};

/**
 * This method returns true if the given section is a valid section to query.
 * @param {string} section The NY Times section to query.
 * @return {boolean}
 */
ApiAccessor.isValidSection = function(section) {
  return ApiAccessor.SECTIONS.indexOf(section) != -1;
};

/**
 * This method sends a request to Google's URL Shortener API to get
 * a shortened URL.
 * @param {string} url The URL to shorten.
 * @param {function()} callback The callback function to which the shortened
 *   URL is passed.
 */
ApiAccessor.prototype.shortenUrl = function(url, callback) {
  try {
    request({
      url: 'https://www.googleapis.com/urlshortener/v1/url',
      method: 'POST',
      body: { longUrl: url },
      qs: { key: this.url_shortener_api_key },
      json: true
    }, function(error, response, body) {
      if (error) {
        callback(error, null);
      } else {
        callback(null, body.id);
      }
    });
  } catch (error) {
    callback(error, null);
  }
};

/**
 * This method fetches article data from the NY Times and and passes it into a
 * callback.
 * @param {string} section The NY Times section to query.
 * @param {function()} callback The callback function for the data.
 */
ApiAccessor.prototype.fetch = function(section, callback) {
  var context = this;

  if (!section) {
    section = 'home';
  }

  if (ApiAccessor.isValidSection(section)) {
    if (context.cache[section] &&
        (new Date()).getTime() < context.cache[section].expires) {
      callback(null, context.cache[section].results);
    } else {
      try {
        request({
          url: ApiAccessor.getNyTimesUrl(section),
          qs: { 'api-key': this.nytimes_api_key },
          json: true
        }, function(error, response, body) {
          if (error) {
            callback(error, null);
          } else {
            context.cache[section] = {
              results: body.results,
              expires: (new Date()).getTime() +
                  ApiAccessor.CACHE_EXPIRATION_TIME
            };
            callback(null, body.results);
          }
        });
      } catch (error) {
        callback(error, null);
      }
    }
  } else {
    callback(
        'Not a valid section to query! Valid queries:\n' + (
        ApiAccessor.SECTIONS.join('\n') + '\n'), null);
  }
};

/**
 * This line is needed on the server side since this is loaded as a module
 * into the node server.
 */
module.exports = ApiAccessor;
