/**
 * @fileoverview This is a class of static methods which will format the
 * data fetched from the NY Times API into a nice looking table.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Dependencies
var colors = require('colors');
var Table = require('cli-table');

/**
 * Enpty constructor for a DataFormatter class.
 * @constructor
 */
function DataFormatter() {
  throw new Error('DataFormatter should not be instantiated!');
}

/**
 * This method takes a string of text and an array of colors.js attributes
 * and returns the text with all those attributes applied.
 * @param {string} text The text to which the styles should be applied.
 * @param {Array<string>} styles An array of styles to apply to the text.
 * @return {string}
 */
DataFormatter.applyStyles = function(text, styles) {
  styles.map(function(current, index, array) {
    text = text[current];
  });
  return text;
};

/**
 * This method takes a string of text and separates it into lines of text
 * all of which are shorter than a given maximum line length.
 * @param {string} text The text to format.
 * @param {number} maxLineLength The maximum length of each line.
 * @param {?Array<string>=} styles The styles to apply to the formatted text.
 * @return {string}
 */
DataFormatter.formatTextWrap = function(text, maxLineLength, styles) {
  if (!styles) {
    styles = [];
  }
  var words = text.split(' ');
  var lineLength = 0;
  var output = '';
  for (word of words) {
    if (lineLength + word.length >= maxLineLength) {
      output += '\n' + DataFormatter.applyStyles(word, styles) + ' ';
      lineLength = word.length + 1;
    } else {
      output += DataFormatter.applyStyles(word, styles) + ' ';
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
  var maxSectionWidth = Math.max.apply(
      null, articles.map(function(c, i, a) {
        return c.section.length + 2;
      }));
  var detailsWidth = 80 - (3 + maxSectionWidth);
  var table = new Table({
    head: ['Section', 'Details'],
    colWidths: [maxSectionWidth, detailsWidth]
  });

  for (var article of articles) {
    var section = DataFormatter.applyStyles(
        article.section, ['underline', 'cyan']);
    var title = DataFormatter.formatTextWrap(
        article.title, detailsWidth - 2, ['bold', 'cyan']);
    var abstractStyle = [];
    if (article.abstract.toLowerCase().indexOf('gay') != -1) {
      abstractStyle = ['rainbow'];
    }
    var abstract = DataFormatter.formatTextWrap(
        article.abstract, detailsWidth - 2, abstractStyle);
    var url = article.url.underline.green;
    table.push([
      section,
      [title, abstract, url].join('\n')
    ]);
  }
  return '\n' + table.toString() + '\n';
};

/**
 * This line is needed on the server side since this is loaded as a module
 * into the node server.
 */
module.exports = DataFormatter;
