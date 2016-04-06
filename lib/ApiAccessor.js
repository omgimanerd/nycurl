/**
 * @fileoverview This class handles the fetching and formatting of data from
 *   the NYTimes API.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Dependencies
var colors = require('colors');
var request = require('request');

var DataFormatter = require('./DataFormatter');

/**
 * Constructor for an ApiAccessor.
 * @constructor
 * @param {string} api_key The API key to use.
 */
function ApiAccessor(api_key) {
  this.api_key = api_key;
}

/**
 * @const
 * @type {Array<string>}
 */
ApiAccessor.SECTIONS = ['home', 'world', 'national', 'politics', 'nyregion',
  'business', 'opinion', 'technology', 'science', 'health', 'sports', 'arts',
  'fashion', 'dining', 'travel', 'magazine', 'realestate'];


/**
 * Factory method for an ApiAccessor.
 * @param {string} api_key The API key to use.
 * @return {ApiAccessor}
 */
ApiAccessor.create = function(api_key) {
  return new ApiAccessor(api_key);
};

/**
 * This method returns the base URL for a request to the NYTimes API.
 * @param {string} section The NY Times section to query.
 * @return {string}
 */
ApiAccessor.getBaseUrl = function(section) {
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
 * This method fetches the appropriate article data from the NY Times and
 * and returns the formatted data as a string.
 * @param {string} section The NY Times section to query.
 * @param {function()} callback The callback function for the formatted data.
 */
ApiAccessor.prototype.fetch = function(section, callback) {
  if (!section) {
    section = 'home';
  }

  if (ApiAccessor.isValidSection(section)) {
    try {
      request({
        url: ApiAccessor.getBaseUrl(section),
        qs: { 'api-key': this.api_key},
        json: true
      }, function(error, response, body) {
        if (error) {
          callback(error);
        }
        callback(DataFormatter.format(body.results));
      });
    } catch (error) {
      callback(error);
    }
  } else {
    callback('Not a valid section to query!\n'.red);
  }
};

/**
 * This line is needed on the server side since this is loaded as a module
 * into the node server.
 */
module.exports = ApiAccessor;
