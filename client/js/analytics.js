/**
 * @fileoverview Client side JavaScript for rendering site analytics.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

require('chartist/dist/chartist.min.css');
require('ubuntu-fontface/ubuntu.min.css');

require('../scss/analytics.scss');

/**
 * Also defined in ApiAccessor on server side. Maybe do something about this?
 * TODO
 * @type {Array}
 */
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

var getResponseTimeData = function(data) {
  var timesByDay = {};
  data.map(function(entry) {
    var day = moment(entry.date).startOf('day');
    if (timesByDay[day]) {
      timesByDay[day].push(entry.responseTime || 0);
    } else {
      timesByDay[day] = [entry.responseTime || 0];
    }
  });
  var series = [];
  for (var day in timesByDay) {
    series.push({
      x: new Date(day),
      y: timesByDay[day].reduce((a, b) => a+b) / timesByDay[day].length
    });
  }
  return series;
};

var getFrequencyData = function(data) {
  var frequencies = {};
  data.map(function(entry) {
    var matches = /[a-z]+/g.exec(entry.url);
    var url = 'home';
    if (matches) {
      url = matches[0];
    }
    if (SECTIONS.includes(url)) {
      frequencies[url] = frequencies[url] ? frequencies[url] + 1 : 1;
    }
  });
  var items = Object.keys(frequencies).map(function(key) {
    return [key, frequencies[key]];
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).slice(0, 15);
  return {
    sections: items.map((item) => item[0]),
    frequencies: items.map((item) => item[1])
  };
};

$(document).ready(function() {
  $.post('/analytics', function(data) {
    var trafficData = getTrafficData(data);
    var scatterChart = new Chartist.Line('.traffic', {
      series: [trafficData]
    }, {
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: 10,
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM D');
        }
      },
      showPoint: false
    });

    var responseTimeData = getResponseTimeData(data);
    console.log(responseTimeData);
    var averageResponseChart = new Chartist.Line('.response-time', {
      series: [responseTimeData]
    }, {
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: 10,
        labelInterpolationFnc: function(value) {
          return moment(value).format('MMM D');
        }
      },
      showPoint: true
    });

    var frequencyData = getFrequencyData(data);
    var sectionChart = new Chartist.Bar('.section-freq', {
      labels: frequencyData.sections,
      series: frequencyData.frequencies
    }, {
      distributeSeries: true
    });
  });
});
