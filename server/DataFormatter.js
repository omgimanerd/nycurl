/**
 * @fileoverview This is a module containing methods which will format the
 * data fetched from the NY Times API into a nice looking table.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

const colors = require('colors');
const Table = require('cli-table2');

const DEFAULT_DISPLAY_WIDTH = 72;
const WIDTH_WARNING_THRESHOLD = 45;
const HELP = '\nTo find a list of sections to query, use:\n'.red +
    'curl nycurl.sytes.net/help\n'.red;
const ERROR = 'An error occurred! Please try again later.\n'.red;
const WARNING = 'Warning: Using too small of a width will cause ' +
    'unpredictable behavior!';
const INVALID_SECTION = '\nYou queried an invalid section!\n'.bold.red;

/**
 * This method returns the table footer that is appended to every output
 * Table.
 * @return {Array<Object>}
 */
const getTableFooter = (colSpan) => {
  return [{
    colSpan: colSpan,
    content: 'Follow '.green + '@omgimanerd '.blue +
        'on Twitter and GitHub.\n'.green +
        'Open source contributions are welcome!\n'.green +
        'https://github.com/omgimanerd/nycurl'.underline.blue,
    hAlign: 'center'
  }];
};

/**
 * This method takes a string of text and separates it into lines of text
 * all of which are shorter than a given maximum line length.
 * @param {string} text The text to format.
 * @param {number} maxLineLength The maximum length of each line.
 * @return {string}
 */
const formatTextWrap = (text, maxLineLength) => {
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
 * This function takes the array of possible NY Times sections and formats
 * it into a table for display, appending help instructions and example usage
 * information to it.
 * @param {Array<string>} sections The sections to display.
 * @param {boolean} warning Whether or not to show the "invalid section"
 *   warning.
 * @return {string}
 */
const formatHelp = (sections, warning) => {
  var table = new Table();
  if (warning) {
    table.push([{
      colSpan: 2,
      content: INVALID_SECTION,
      hAlign: 'center'
    }]);
  }
  table.push([{
    content: 'Sections'.red.bold,
    hAlign: 'center'
  }, {
    content: 'Parameters'.red.bold,
    hAlign: 'center'
  }]);
  table.push([
    sections.join('\n').green,
    'Set output width:\n' + 'w='.blue + 'WIDTH\n\n'.green +
    'Set article #:\n' + 'i='.blue + 'INDEX\n\n'.green +
    'Limit number of articles:\n' + 'n='.blue + 'NUMBER\n\n'.green
  ]);
  table.push([{
    colSpan: 2,
    content: 'Example Usage:\n'.bold.red +
        'curl nycurl.sytes.net/technology\n' +
        'curl nycurl.sytes.net/world?w=95\n' +
        'curl nycurl.sytes.net/food?w=95\\&n=10'
  }])
  table.push(getTableFooter(2));
  return table.toString() + '\n';
};

/**
 * This function takes the array of article results returned from the NY
 * Times API and formats in into a table for display in your terminal.
 * It assumes that the data has the fields outlined in the documentation
 * on the NY Times developer documentation.
 * http://developer.nytimes.com/docs/top_stories_api/
 * @param {Array<Object>} articles The list of articles returned by a query to
 *   the NY Times API.
 * @param {?Object=} options A dictionary containing configuration options.
 *   Valid keys are:
 *   - w (width, defaults to DEFAULT_DISPLAY_WIDTH)
 *   - width (width, defaults to DEFAULT_DISPLAY_WIDTH)
 * @return {string}
 */
const formatArticles = (articles, options) => {
  var maxWidth = parseInt(options['w'] || options['width']);
  if (isNaN(maxWidth) || maxWidth <= 0) {
    maxWidth = DEFAULT_DISPLAY_WIDTH;
  }
  var index = parseInt(options['i'] || options['index']);
  if (isNaN(index) || index < 0) {
    index = 0;
  }
  var number = parseInt(options['n'] || options['number']);
  if (isNaN(number) || number <= 0) {
    number = articles.length;
  }

  articles = articles.slice(index, index + number);
  /**
   * We first calculate how wide the column containing the article numbers
   * will be, adding two to account for the cell padding.
   */
  var maxNumbersWidth = (index + number).toString().length + 2;
  /**
   * We then calculate the amount of space the section column will take up,
   * adding two to account for cell padding.
   */
  var maxSectionsWidth = Math.max.apply(null, articles.map((article) =>
      article.section.length).concat('Section'.length)) + 2;
  /*
   * The borders of the table take up 4 characters, so we allocate the rest of
   * the space to the details column.
   */
  var detailsWidth = maxWidth - maxNumbersWidth - maxSectionsWidth - 4;
  var table = new Table({
    colWidths: [maxNumbersWidth, maxSectionsWidth, detailsWidth]
  });
  table.push([{
    colSpan: 3,
    content: HELP,
    hAlign: 'center'
  }], ['#'.red, 'Section'.red, 'Details'.red]);
  for (var article of articles) {
    var section = new String(article.section).underline.cyan;
    /**
     * We subtract 2 when calculating the space formatting for the text to
     * account for the padding at the edges of the table.
     */
    var title = formatTextWrap(
        article.title, detailsWidth - 2).bold.cyan;
    var abstract = formatTextWrap(
        article.abstract, detailsWidth - 2);
    var url = new String(article.short_url).underline.green;
    table.push([
      (index++).toString().blue,
      section,
      [title, abstract, url].join('\n')
    ]);
  }
  table.push(getTableFooter(3));
  if (maxWidth < WIDTH_WARNING_THRESHOLD) {
    table.push([{
      colSpan: 3,
      content: formatTextWrap(WARNING,
          maxWidth - 4).red,
      hAlign: 'center'
    }]);
  }
  return table.toString() + '\n';
};

module.exports = exports = {
  ERROR: ERROR,
  formatHelp: formatHelp,
  formatArticles: formatArticles
};
