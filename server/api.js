/**
 * @fileoverview This class handles the fetching and formatting of data from
 *   the NYTimes API.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

const request = require('request-promise')

const NYTIMES_API_KEY = process.env.NYTIMES_API_KEY
if (!NYTIMES_API_KEY) {
  throw new Error('No NYTimes API key specified. Make sure you have \
      NYTIMES_API_KEY in your environment variables.')
}

const URL_SHORTENER_API_KEY = process.env.URL_SHORTENER_API_KEY
if (!URL_SHORTENER_API_KEY) {
  throw new Error('No URL Shortener API key specified. Make sure you have \
      URL_SHORTENER_API_KEY in your environment variables.')
}

/**
 * Base URL for the NYTimes API.
 * @type {string}
 */
const NYTIMES_URL = 'http://api.nytimes.com/svc/topstories/v2'

/**
 * Base URL for the URL Shortener API.
 * @type {type}
 */
const URL_SHORTENER_BASE_URL = 'https://www.googleapis.com/urlshortener/v1/url'

/**
 * Milliseconds in 10 minutes, the duration which results will be cached.
 * @type {number}
 */
const CACHE_KEEP_TIME = 600000

/**
 * The list of available sections one can query from.
 * @type {Array<string>}
 */
const SECTIONS = ['home', 'opinion', 'world', 'national', 'politics',
  'upshot', 'nyregion', 'business', 'technology', 'science', 'health',
  'sports', 'arts', 'books', 'movies', 'theater', 'sundayreview', 'fashion',
  'tmagazine', 'food', 'travel', 'magazine', 'realestate', 'automobiles',
  'obituaries', 'insider']

const cache = {}

/**
 * This method returns true if the given section is a valid section to query.
 * @param {?string=} section The NY Times section to query.
 * @return {boolean}
 */
const isValidSection = section => {
  return SECTIONS.indexOf(section) != -1
}

/**
 * This method sends a request to Google's URL Shortener API to get
 * a shortened URL and returns a Promise.
 * @param {string} url The URL to shorten.
 * @return {Promise}
 */
const shortenUrl = (url, callback) => {
  return request({
    uri: URL_SHORTENER_BASE_URL,
    method: 'POST',
    headers: {
      // The Referer field is necessary because of the referrer limitation set
      // on the production API key.
      'Referer': 'nycurl.sytes.net',
      'Content-Type': 'application/json'
    },
    body: { longUrl: url },
    qs: { key: URL_SHORTENER_API_KEY },
    json: true
  }).then(data => data.id)
    .catch(error => errorBuilder.promise('URLShortenerAPIError', error))
}

/**
 * This method fetches article data from the NY Times. It operates under the
 * assumption that the section being passed to it is a valid section to query
 * and that the isValidSection() check has passed.
 * @param {string} section The NY Times section to query.
 * @return {Promise}
 */
const fetchArticles = section => {
  /*
   * We first check if the section query has been cached within the last 10
   * minutes. If it has, then we return the cached data. If not, we then
   * fetch new data from the New York Times API.
   */
  const currentTime = Date.now()
  if (cache[section] && currentTime < cache[section].expires) {
    return Promise.resolve(cache[section].results)
  }

  /*
   * If the section being requested was not cached, then we need to fetch the
   * data from the New York Times. We will cache it before returning the
   * Promise.
   */
  return request({
    uri: `${NYTIMES_URL}/${section}.json`,
    qs: { 'api-key': NYTIMES_API_KEY },
    json: true
  }).then(data => {
    /*
     * Some articles won't have a NYTimes short_url field, so we will shorten
     * the article URL ourselves.
     */
    return Promise.all(data.results.map(article => {
      if (article.short_url) {
        return article
      }
      return shortenUrl(article.url).then(shortenedUrl => {
        article.short_url = shortenedUrl
        return article
      })
    }))
  }).then(data => {
    const results = data.sort((a, b) => a.section.localeCompare(b.section))
    /*
     * We cache the result and then return it through the Promise.
     */
    cache[section] = {
      results: results,
      expires: currentTime + CACHE_KEEP_TIME
    }
    return results
  }).catch(error => {
    return Promise.reject(new Error({
      message: 'NYTimes API Failure',
      error: error
    }))
  })
}

module.exports = exports = { SECTIONS, isValidSection, fetchArticles }
