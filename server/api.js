/**
 * @fileoverview This class handles the fetching and formatting of data from
 *   the NYTimes API.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

const request = require('request-promise');

const NYTIMES_API_KEY = process.env.NYTIMES_API_KEY;
if (!NYTIMES_API_KEY) {
  throw new Error('No NYTimes API key specified. Make sure you have \
      NYTIMES_API_KEY in your environment variables.');
}

/**
 * Base URL for the NYTimes API.
 * @type {string}
 */
const NYTIMES_URL = 'http://api.nytimes.com/svc/topstories/v2';

/**
 * Milliseconds in 10 minutes, the duration which results will be cached.
 * @type {number}
 */
const CACHE_KEEP_TIME = 600000;

/**
 * The list of available sections one can query from.
 * @type {Array<string>}
 */
const SECTIONS = ['home', 'opinion', 'world', 'national', 'politics',
    'upshot', 'nyregion', 'business', 'technology', 'science', 'health',
    'sports', 'arts', 'books', 'movies', 'theater', 'sundayreview', 'fashion',
    'tmagazine', 'food', 'travel', 'magazine', 'realestate', 'automobiles',
    'obituaries', 'insider'];

const cache = {};

/**
 * This method returns true if the given section is a valid section to query.
 * @param {?string=} section The NY Times section to query.
 * @return {boolean}
 */
const isValidSection = function(section) {
  return SECTIONS.indexOf(section) != -1;
};

/**
 * This method fetches article data from the NY Times. It operates under the
 * assumption that the section being passed to it is a valid section to query
 * and that the isValidSection() check has passed.
 * @param {string} section The NY Times section to query.
 * @return {Promise}
 */
const fetchArticles = function(section) {
  /**
   * We first check if the section query has been cached within the last 10
   * minutes. If it has, then we return the cached data. If not, we then
   * fetch new data from the New York Times API.
   */

  const currentTime = Date.now();
  if (cache[section] && currentTime < cache[section].expires) {
    return Promise.resolve(cache[section].results);
  }
  /**
   * If the section being requested was not cached, then we need to fetch the
   * data from the New York Times. We will cache it before returning the
   * Promise.
   */
  return request({
    uri: `${NYTIMES_URL}/${section}.json`,
    qs: { 'api-key': NYTIMES_API_KEY },
    json: true
  }).then(body => {
    var results = body.results.sort(function(a, b) {
      return a.section.localeCompare(b.section);
    });
    cache[section] = {
      results: results,
      expires: currentTime + CACHE_KEEP_TIME
    };
    return Promise.resolve(results);
  });
};

module.exports = exports = {
  SECTIONS: SECTIONS,
  isValidSection: isValidSection,
  fetchArticles: fetchArticles
};
