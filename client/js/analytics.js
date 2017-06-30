/**
 * @fileoverview Client side JavaScript for rendering site analytics.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

require('chartist/dist/chartist.min.css');
require('ubuntu-fontface/ubuntu.min.css');

require('../scss/analytics.scss');

const $ = require('jquery');
const Chartist = require('chartist');
const moment = require('moment');

var getTrafficSeries = function(data) {
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

$(document).ready(function() {
  $.post('/analytics', function(data) {
    var points = getTrafficSeries(data);
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
