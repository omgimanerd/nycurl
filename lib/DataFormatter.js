/**
 * @fileoverview This is a class of static methods which will format the
 * data fetched from the NY Times API into a nice looking table.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

const colors = require('colors');
const Table = require('cli-table2');

/**
 * Enpty constructor for a DataFormatter class.
 * @constructor
 */
function DataFormatter() {
  throw new Error('DataFormatter should not be instantiated!');
}

/**
 * @const
 * @type {number}
 */
DataFormatter.DISPLAY_WIDTH = 72;

/**
 * @const
 * @type {string}
 */
DataFormatter.HELP = '\nTo find a list of sections to query, use: '.red +
    'curl nycurl.sytes.net/help\n'.red;

/**
 * @const
 * @type {string}
 */
DataFormatter.TWITTER_LINK = 'If you like this tool, please follow '.green +
    '@omgimanerd '.blue + 'on Twitter and GitHub.\n'.green;

/**
 * @const
 * @type {string}
 */
DataFormatter.GITHUB_LINK = 'If you would like to improve this tool, '.green +
    'check out:\n'.green +
    'https://github.com/omgimanerd/nycurl\n\n'.underline.blue;

/**
 * This method takes a string of text and separates it into lines of text
 * all of which are shorter than a given maximum line length.
 * @param {string} text The text to format.
 * @param {number} maxLineLength The maximum length of each line.
 * @return {string}
 */
DataFormatter.formatTextWrap = function(text, maxLineLength) {
  var words = text.split(' ');
  var lineLength = 0;
  var output = '';
  for (word of words) {
    if (lineLength + word.length >= maxLineLength) {
      output += `\n${word} `;
      lineLength = word.length + 1;
    } else {
      output += `${word} `;
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
  var maxSectionWidth = Math.max.apply(null, articles.map((article) =>
      article.section.length));
  /**
   * This tool's output should be at most 72 characters in length. The borders
   * of the table take up 3 characters, so the details section can take up
   * (DISPLAY_WIDTH - widest section) characters.
   */
  var detailsWidth = (DataFormatter.DISPLAY_WIDTH - 3) - maxSectionWidth;
  var table = new Table({
    colWidths: [maxSectionWidth, detailsWidth]
  });
  table.push([{
    colSpan: 2,
    content: DataFormatter.HELP
  }], ['Section'.red, 'Details'.red]);
  for (var article of articles) {
    var section = new String(article.section).underline.cyan;
    /**
     * We subtract 2 when calculating the space formatting for the text to
     * account for the padding at the edges of the table.
     */
    var title = DataFormatter.formatTextWrap(
        article.title, detailsWidth - 2).bold.cyan;
    var abstract = DataFormatter.formatTextWrap(
        article.abstract, detailsWidth - 2);
    var url = new String(article.url).underline.green;
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
