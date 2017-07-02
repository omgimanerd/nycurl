/**
 * @fileoverview Client side JavaScript for rendering site analytics.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

require('chartist/dist/chartist.min.css');
require('nouislider/distribute/nouislider.min.css');
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

/**
 * @const
 * @type {number}
 */
const TEN_DAYS_SECONDS = 60 * 60 * 24 * 10;

const $ = require('jquery');
const Chartist = require('chartist');
const moment = require('moment');
const noUiSlider = require('nouislider');

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

/**
 * Given the array of analytics data fetched from the /analytics endpoint,
 * this method returns the average response time per day as a series of
 * points to plot on a Chartist.Line graph.
 * @param {Array<Object>} data The raw analytics data.
 * @return {Array<Object>}
 */
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

/**
 * Given the array of analytics data fetched from the /analytics endpoint,
 * this method returns the endpoint frequency data as an object containing
 * the top 15 sections and their frequencies to plot on a Chartist.Bar graph.
 * @param {Array<Object>} data The raw analytics data.
 * @return {Object}
 */
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

/**
 * Given the array of analytics data fetched from the /analytics endpoint,
 * this function updates all the graphs on the page using the data.
 * @param {Array<Object>} data The raw analytics data.
 */
var updateGraphs = function(data) {
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
};

/**
 * Main jQuery script to initialize the page elements.
 */
$(document).ready(function() {
  var dateSlider = document.getElementById('date-slider');
  $.post('/analytics', function(data) {
    var minDate = moment(data[0].date).unix();
    var maxDate = moment(data[data.length - 1].date).unix();
    var dateFormatter = {
      to: function(value) {
        return moment.unix(value).format("MMM D YYYY");
      }
    };

    noUiSlider.create(dateSlider, {
      start: [minDate, maxDate],
      tooltips: [dateFormatter, dateFormatter],
      connect: true,
      margin: TEN_DAYS_SECONDS,
      range: { min: minDate, max: maxDate },
    });

    /**
     * Event handler for our slider so that the graphs are appropriately
     * updated.
     */
    dateSlider.noUiSlider.on('set', function() {
      var sliderRange = dateSlider.noUiSlider.get();
      updateGraphs(data.filter(function(entry) {
        return moment(entry.date).isBetween(
            moment.unix(sliderRange[0]), moment.unix(sliderRange[1]))
      }));
    });
    updateGraphs(data);
  });
});
