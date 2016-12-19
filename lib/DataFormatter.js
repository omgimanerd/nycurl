/**
 * @fileoverview This is a class of static methods which will format the
 * data fetched from the NY Times API into a nice looking table.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Dependencies
var chalk = require('chalk');
var Table = require('cli-table');

/**
 * Enpty constructor for a DataFormatter class.
 * @constructor
 */
function DataFormatter() {
  throw new Error('DataFormatter should not be instantiated!');
}

/**
 * @const
 * @type {string}
 */
DataFormatter.CURL_HELP = '\nTo find a list of sections to query, use: ' +
    chalk.red('curl nycurl.sytes.net/help\n');

/**
 * @const
 * @type {string}
 */
DataFormatter.CURL_TWITTER_LINK = chalk.green(
    'If you like this tool, please follow ') + chalk.blue('@omgimanerd ') +
    chalk.green('on Twitter and GitHub.\n');

/**
 * @const
 * @type {string}
 */
DataFormatter.CURL_GITHUB_LINK = chalk.green(
    'If you\'re interested in the source code, check out:\n') +
    chalk.blue('https://github.com/omgimanerd/nycurl') + '\n\n';

/**
 * This method takes a string of text and separates it into lines of text
 * all of which are shorter than a given maximum line length.
 * @param {string} text The text to format.
 * @param {number} maxLineLength The maximum length of each line.
 * @param {?function()=} chalkStyle The text style to apply.
 * @return {string}
 */
DataFormatter.formatTextWrap = function(text, maxLineLength, chalkStyle) {
  if (!chalkStyle) {
    /**
     * If a chalkStyle function was not specified, then we should just
     * return the word itself when the function is called.
     * @param {string} style The word to style.
     * @return {string}
     */
    chalkStyle = (style) => style;
  }
  var words = text.split(' ');
  var lineLength = 0;
  var output = '';
  for (word of words) {
    if (lineLength + word.length >= maxLineLength) {
      output += '\n' + chalkStyle(word) + ' ';
      lineLength = word.length + 1;
    } else {
      output += chalkStyle(word) + ' ';
      lineLength += word.length + 1;
    }
  }
  return output;
};

/**
 * This function takes the array of article results returned from the NY
 * Times API and formats in into a table for display in your terminal.
 * It assumes that the data has the fields outlined in the documentation
 * on the NY Times developer documentation.
 * http://developer.nytimes.com/docs/top_stories_api/
 * @param {Array<Object>} data The list of results returned by a query to the
 *   NY Times API.
 * @return {string}
 */
DataFormatter.format = function(data) {
  var articles = data.sort(function(a, b) {
    return a.section.localeCompare(b.section);
  });
  /**
   * We add two to the max width of any section to account for the ANSI
   * metacharacters that color the text.
   */
  var maxSectionWidth = Math.max.apply(null, articles.map((article) =>
      article.section.length)) + 2;
  /**
   * We'll assume the user's terminal is 80 characters wide. The borders and
   * margins of the table take up 5 characters, so the details section can
   * take up (75 - max width of any section) characters.
   */
  var detailsWidth = 75 - maxSectionWidth;
  var table = new Table({
    head: ['Section', 'Details'],
    colWidths: [maxSectionWidth, detailsWidth]
  });
  for (var article of articles) {
    var section = chalk.underline.cyan(article.section);
    /**
     * We subtract 2 when calculating the space formatting for the text to
     * account for the ANSI metacharacters.
     */
    var title = DataFormatter.formatTextWrap(
        article.title, detailsWidth - 2, chalk.bold.cyan);
    var abstract = DataFormatter.formatTextWrap(
        article.abstract, detailsWidth - 2);
    var url = chalk.green.underline(article.url);
    table.push([
      section,
      [title, abstract, url].join('\n')
    ]);
  }
  return table.toString() + '\n';
};

/**
 * This line is needed on the server side since this is loaded as a module
 * into the node server.
 */
module.exports = DataFormatter;
