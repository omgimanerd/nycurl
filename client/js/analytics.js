/**
 * @fileoverview Client side JavaScript for rendering site analytics.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

require('chartist/dist/chartist.min.css');
require('ubuntu-fontface/ubuntu.min.css');

require('../scss/analytics.scss');

const SECTIONS = ['home', 'opinion', 'world', 'national', 'politics',
  'upshot', 'nyregion', 'business', 'technology', 'science', 'health',
  'sports', 'arts', 'books', 'movies', 'theater', 'sundayreview', 'fashion',
  'tmagazine', 'food', 'travel', 'magazine', 'realestate', 'automobiles',
  'obituaries', 'insider'];

const $ = require('jquery');
const Chartist = require('chartist');
const moment = require('moment');

var getTrafficData = function(data) {
  var hitsPerDay = {};
  data.map(function(entry) {
    var day = moment(entry.date).startOf('day');
    hitsPerDay[day] = hitsPerDay[day] ? hitsPerDay[day] + 1 : 1;
  });
  var series = [];
  for (var day in hitsPerDay) {
    series.push({ x: new Date(day), y: hitsPerDay[day] });
  }
  return series;
};

var getFrequencyData = function(data) {
  var sections = [];
  var frequencies = {};
  data.map(function(entry) {
    var matches = /[a-z]+/g.exec(entry.url);
    var url = 'home';
    if (matches) {
      url = matches[0];
    }
    if (frequencies[url]) {
      frequencies[url]++;
    } else {
      frequencies[url] = 1;
    }
    if (!sections.includes(url)) {
      sections.push(url);
    }
  });
  return {
    sections: sections,
    frequencies: sections.map((section) => frequencies[section])
  };
};

$(document).ready(function() {
  $.post('/analytics', function(data) {
    var points = getTrafficData(data);
    var scatterChart = new Chartist.Line('.traffic', {
      series: [points]
    }, {
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: 5,
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM D');
        }
      }
    });
    console.log(getFrequencyData(data));
    var sectionChart = new Chartist.Bar('.section-freq', {
      labels: [1, 2, 3, 4, 5, 6, 7],
      series: [
        [1, 3, 2, -5, -3, 1, -6],
        [-5, -2, -4, -1, 2, -3, 1]
      ]
    }, {
      seriesBarDistance: 12,
      low: -10,
      high: 10
    });
    var averageResponseChart = new Chartist.Bar('.response-time', {
      labels: [1, 2, 3, 4, 5, 6, 7],
      series: [
        [1, 3, 2, -5, -3, 1, -6],
        [-5, -2, -4, -1, 2, -3, 1]
      ]
    }, {
      seriesBarDistance: 12,
      low: -10,
      high: 10
    });
  });
});
