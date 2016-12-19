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
 * @type {string}
 */
ApiAccessor.BASE_URL = 'http://api.nytimes.com/svc/topstories/v2/';

/**
 * @const
 * @type {Array<string>}
 */
ApiAccessor.SECTIONS = ['home', 'opinion', 'world', 'national', 'politics',
  'upshot', 'nyregion', 'business', 'technology', 'science', 'health',
  'sports', 'arts', 'books', 'movies', 'theater', 'sundayreview', 'fashion',
  'tmagazine', 'food', 'travel', 'magazine', 'realestate', 'automobiles',
  'obituaries', 'insider'];

/**
 * @const
 * @type {Array<string>}
 */
ApiAccessor.SELECTED_FIELDS = ['section', 'title', 'abstract', 'url'];

/**
 * @const
 * @type {number}
 */
ApiAccessor.CACHE_KEEP_TIME = 60000;

/**
 * Factory method for an ApiAccessor.
 * @param {Object} options A JSON object containing the NYTimes API key and the
 *   the URL shortener API key.
 * @return {ApiAccessor}
 */
ApiAccessor.create = function(options) {
  if (!options.nytimes_api_key) {
    throw new Error('No NYTimes API key specified.');
  } else if (!options.url_shortener_api_key) {
    throw new Error('No URL shortener API key specified.');
  }
  return new ApiAccessor(
      options.nytimes_api_key,
      options.url_shortener_api_key
  );
};

/**
 * This method returns the base URL for a request to the NYTimes API.
 * @param {?string=} section The NY Times section to query.
 * @return {string}
 */
ApiAccessor.getNyTimesUrl = function(section) {
  if (!section) {
    section = 'home';
  }
  return ApiAccessor.BASE_URL + section + '.json';
};

/**
 * This method returns true if the given section is a valid section to query.
 * @param {?string=} section The NY Times section to query.
 * @return {boolean}
 */
ApiAccessor.isValidSection = function(section) {
  return ApiAccessor.SECTIONS.indexOf(section) != -1;
};

/**
 * This method sends a request to Google's URL Shortener API to get
 * a shortened URL. Any errors will also propagate upwards through the
 * callback.
 * @param {string} url The URL to shorten.
 * @param {function()} callback The callback function to which the shortened
 *   URL is passed along with any errors.
 */
ApiAccessor.prototype.shortenUrl = function(url, callback) {
  request({
    url: 'https://www.googleapis.com/urlshortener/v1/url',
    method: 'POST',
    body: { longUrl: url },
    qs: { key: this.url_shortener_api_key },
    json: true
  }, function(error, response, body) {
    if (error) {
      return callback(error);
    } else if (body && body.id) {
      return callback(error, body.id);
    } else {
      return callback('An error occurred! Please try again later.');
    }
  });
};

/**
 * This method fetches article data from the NY Times and passes it into
 * a callback. It operates under the assumption that the section being passed
 * to it is a valid section to query and that the isValidSection() check has
 * passed. Any errors will be passed to the callback.
 * @param {string} section The NY Times section to query.
 * @param {function()} callback The callback function to which the articles
 *   are passed, along with any errors.
 */
ApiAccessor.prototype.fetchArticles = function(section, callback) {
  var context = this;
  async.retry(10, function(innerCallback, results) {
    request({
      url: ApiAccessor.getNyTimesUrl(section),
      qs: { 'api-key': context.nytimes_api_key },
      json: true
    }, function(error, response, body) {
      if (error) {
        return innerCallback(error);
      } else if (response.statusCode === 403) {
        return innerCallback('API key error. Authorization failed.');
      } else if (!body || !body.results || response.statusCode !== 200) {
        return innerCallback('No results found! This is likely an error!');
      } else {
        return innerCallback(null, body.results);
      }
    });
  }, callback);
};

/**
 * This method fetches article data from the NY Times and and passes it into a
 * callback. It operates under the assumption that the section being passed to
 * it is a valid section to query and that the isValidSection() check has
 * passed. Any errors will be passed to the callback as well.
 * @param {string} section The NY Times section to query.
 * @param {function()} callback The callback function to which the articles are
 *   passed, along with any errors.
 * @return {?function()}
 */
ApiAccessor.prototype.fetch = function(section, callback) {
  var context = this;
  /**
   * We first check if the section query has been cached within the last 10
   * minutes. If it has, then we return the cached data. If not, we then
   * fetch new data from the New York Times API.
   */
  if (context.cache[section] &&
      (new Date()).getTime() < context.cache[section].expires) {
    return callback(null, context.cache[section].results);
  }

  /**
   * If the section being requested was not cached, then we need to fetch the
   * data from the New York Times.
   * This asynchronous series call first sends a request to the New York
   * Times API for a list of the top stories. It then iterates through
   * each article returned to generate a shortened version of each
   * article's URL. The resulting object is then cached and returned through
   * the callback.
   */
  async.waterfall([
    function(innerCallback) {
      /**
       * This first asynchronous function sends a request to the New York
       * Times API for the top stories, which we pass to the callback to
       * the next asynchronous function call.
       */
      context.fetchArticles(section, innerCallback);
    }, function(results, innerCallback) {
      /**
       * This inner asynchronous function iterates through
       * the list of results from the New York Times API to generate a
       * shortened URL for each.
       */
      async.map(results, function(result, mappingCallback) {
        context.shortenUrl(result.url, function(error, shortenedUrl) {
          if (error) {
            return mappingCallback(error);
          }
          result['url'] = shortenedUrl;
          mappingCallback(null, result);
        });
      }, function(error, data) {
        if (error) {
          return innerCallback(error);
        }
        innerCallback(null, data);
      });
    }
  ], function(error, results) {
    /**
     * When we are done, we cache the data and send it back through the
     * callback unless there was an error.
     */
    if (error) {
      return callback(error);
    }
    context.cache[section] = {
      results: results,
      expires: (new Date()).getTime() + ApiAccessor.CACHE_KEEP_TIME
    };
    return callback(null, results);
  });
};

/**
 * This line is needed on the server side since this is loaded as a module
 * into the node server.
 */
module.exports = ApiAccessor;
