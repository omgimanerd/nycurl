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
 * This method takes a string of text and separates it into lines of text
 * all of which are shorter than a given maximum line length.
 * It also has an Easter egg where if the word gay is found, it will turn
 * the text rainbow :D
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
      output += '\n' + word + ' ';
      lineLength = word.length + 1;
    } else {
      output += word + ' ';
      lineLength += word.length + 1;
    }
  }
  if (output.toLowerCase().indexOf('gay') != -1) {
    return output.rainbow;
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
  var table = new Table({
    head: ['Section', 'Details'],
    colWidths: [maxSectionWidth, 120]
  });
  for (var article of articles) {
    table.push([
      article.section.underline.cyan,
      DataFormatter.formatTextWrap(article.title, 118).bold.cyan + (
          '\n'.reset + DataFormatter.formatTextWrap(article.abstract, 118) +
          '\n' + article.url.underline.green
      )
    ]);
  }
  return '\n' + table.toString() + '\n';
};

/**
 * This line is needed on the server side since this is loaded as a module
 * into the node server.
 */
module.exports = DataFormatter;
