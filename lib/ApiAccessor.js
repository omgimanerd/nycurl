/**
 * @fileoverview This class handles the fetching and formatting of data from
 *   the NYTimes API.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Dependencies
var async = require('async');
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
ApiAccessor.CACHE_KEEP_TIME = 60000;

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
 * This method clears the cached NY Times articles.
 * @param {?string=} section The cached section to clear.
 */
ApiAccessor.prototype.clearCache = function(section) {
  if (section) {
    delete this.cache[section];
  } else {
    this.cache = {};
  }
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
  var results = [];

  if (ApiAccessor.isValidSection(section)) {
    /**
     * We first check if the section query has been cached within the last 10
     * minutes. If it has, then we return the cached data. If not, then we
     * fetch new data from the New York Times API.
     */
    if (context.cache[section] &&
        (new Date()).getTime() < context.cache[section].expires) {
      callback(null, context.cache[section].results);
    } else {
      /**
       * This asynchronous series call first sends a request to the New York
       * Times API for a list of the top stories. It then iterates through
       * each article returned to generate a shortened version of each
       * article's URL. The resulting object is then cached and returned.
       */
      async.series([
        function(innerCallback) {
          /**
           * This first asynchronous function sends a request to the New York
           * Times API for the top stories, which we store in results.
           */
          request({
            url: ApiAccessor.getNyTimesUrl(section),
            qs: { 'api-key': context.nytimes_api_key },
            json: true
          }, function(error, response, body) {
            if (error) {
              innerCallback(error, null);
            } else {
              results = body.results.map(function(current, index, array) {
                return {
                  section: current.section,
                  title: current.title,
                  abstract: current.abstract,
                  url: current.url
                };
              });
              innerCallback(null, true);
            }
          });
        }, function(innerCallback) {
          /**
           * This second asynchronous function iterates asynchronously through
           * the list of results from the New York Times API to generate a
           * shortened URL for each.
           */
          async.map(results, function(result, mappingCallback) {
            context.shortenUrl(result.url, function(error, shortenedUrl) {
              if (error) {
                mappingCallback(error, null);
              } else {
                result.url = shortenedUrl;
                mappingCallback(null, result);
              }
            });
          }, function(error, data) {
            if (error) {
              innerCallback(error, null);
            } else {
              innerCallback(null, true);
            }
          });
        }
      ], function(error, data) {
        /**
         * When we are done, we cache the data and send it back through the
         * callback.
         */
        if (error) {
          callback(error, null);
        } else {
          context.cache[section] = {
            results: results,
            expires: (new Date()).getTime() + ApiAccessor.CACHE_KEEP_TIME
          };
          callback(null, results);
        }
      });
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
