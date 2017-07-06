/**
 * @fileoverview Client side JavaScript for rendering site analytics.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

require('c3/c3.min.css');
require('nouislider/distribute/nouislider.min.css');
require('ubuntu-fontface/_ubuntu-mono.scss')

require('../scss/analytics.scss');

const $ = require('jquery');
const c3 = require('c3');
const d3 = require('d3');
const moment = require('moment');
const noUiSlider = require('nouislider');

var trafficChart, responseTimeChart;

var curveDate = function(date) {
  return moment(date).startOf('day');
};

var iterDates = function(min, max, callback) {
  var tmp = moment(min);
  for (var day = tmp; day.diff(max, 'days') <= 0; day.add(1, 'days')) {
    callback(day);
  }
};

var min = function(l) {
  if (!l || l.length == 0) {
    return 0;
  }
  return Math.round(Math.min(...l));
};
var avg = function(l) {
  if (!l || l.length == 0) {
    return 0;
  }
  return Math.round(l.reduce((a, b) => a + b) / l.length);
};
var max = function(l) {
  if (!l || l.length == 0) {
    return 0;
  }
  return Math.round(Math.max(...l));
};

var getTrafficData = function(data) {
  var hitsPerDay = {};
  var curlPerDay = {};
  data.map(function(entry) {
    var day = curveDate(entry.date);
    hitsPerDay[day] = hitsPerDay[day] ? hitsPerDay[day] + 1 : 1;
    if ((entry.userAgent || '').includes('curl')) {
      curlPerDay[day] = curlPerDay[day] ? curlPerDay[day] + 1 : 1;
    }
  });
  var dateColumn = ['date'];
  var hitsPerDayColumn = ['total requests'];
  var curlPerDayColumn = ['curl requests '];
  var minDate = moment(data[0].date).startOf('day');
  var maxDate = moment(data[data.length - 1].date).endOf('day');
  iterDates(minDate, maxDate, function(day) {
    dateColumn.push(day.format('YYYY-MM-DD'));
    hitsPerDayColumn.push(hitsPerDay[day] || 0);
    curlPerDayColumn.push(curlPerDay[day] || 0);
  });
  return [dateColumn, hitsPerDayColumn, curlPerDayColumn];
};

var getResponseTimeData = function(data) {
  var timesByDay = {};
  data.map(function(entry) {
    var day = curveDate(entry.date);
    if (timesByDay[day]) {
      timesByDay[day].push(entry.responseTime || 0);
    } else {
      timesByDay[day] = [entry.responseTime || 0];
    }
  });
  var dateColumn = ['date'];
  var minColumn = ['min'];
  var avgColumn = ['avg'];
  var maxColumn = ['max'];
  var minDate = moment(data[0].date).startOf('day');
  var maxDate = moment(data[data.length - 1].date).endOf('day');
  iterDates(minDate, maxDate, function(day) {
    dateColumn.push(day.format('YYYY-MM-DD'));
    minColumn.push(min(timesByDay[day]));
    avgColumn.push(avg(timesByDay[day]));
    maxColumn.push(max(timesByDay[day]));
  });
  return [dateColumn, minColumn, avgColumn, maxColumn];
};

var getFrequencyData = function(data) {
  var frequencies = {};
  data.map(function(entry) {
    var matches = /[a-z]+/g.exec(entry.url);
    var url = 'home';
    if (matches) {
      url = matches[0];
    }
    frequencies[url] = frequencies[url] ? frequencies[url] + 1 : 1;
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

var updateGraphs = function(data) {
  if (data.length == 0) {
    console.error('No data!');
    return;
  }
  // var responseTimeData = getResponseTimeData(data);
  // var averageResponseChart = new Chartist.Line('.response-time', {
  //   series: responseTimeData
  // }, {
  //   axisX: {
  //     type: Chartist.FixedScaleAxis,
  //     divisor: 10,
  //     labelInterpolationFnc: function(value) {
  //       return moment(value).format('MMM D');
  //     }
  //   },
  //   showPoint: false,
  //   showArea: true
  // });
  //
  // var frequencyData = getFrequencyData(data);
  // var sectionChart = new Chartist.Bar('.section-freq', {
  //   labels: frequencyData.sections,
  //   series: frequencyData.frequencies
  // }, {
  //   distributeSeries: true
  // });
};

/**
 * Main jQuery script to initialize the page elements.
 */
$(document).ready(function() {
  var dateSlider = document.getElementById('date-slider');
  $.post('/analytics', function(data) {
    if (data.length == 0) {
      console.error('No data!');
    }
    var minDate = moment(data[0].date).startOf('day');
    var maxDate = moment(data[data.length - 1].date).endOf('day');
    var dateFormatter = {
      to: function(value) {
        return moment.unix(value).format("M/D/YYYY");
      }
    };
    noUiSlider.create(dateSlider, {
      start: [minDate.unix(), maxDate.unix()],
      tooltips: [dateFormatter, dateFormatter],
      connect: true,
      margin: moment.duration(15, 'days').asSeconds(),
      range: { min: minDate.unix(), max: maxDate.unix() }
    });

    trafficChart = c3.generate({
      bindto: '#traffic',
      axis: {
        x: { padding: 0, type: 'timeseries' },
        y: { label: 'Requests', min: 0, padding: 0 }
      },
      data: {
        x: 'date',
        columns: getTrafficData(data)
      },
      point: { show: false }
    });
    responseTimeChart = c3.generate({
      bindto: '#response-time',
      axis: {
        x: { padding: 0, type: 'timeseries' },
        y: { label: 'Milliseconds', min: 0, padding: 0 }
      },
      data: {
        x: 'date',
        columns: getResponseTimeData(data),
        types: 'area'
      },
      point: { show: false }
    });

    /**
     * Event handler for our slider so that the graphs are appropriately
     * updated.
     */
    dateSlider.noUiSlider.on('set', function() {
      var sliderRange = dateSlider.noUiSlider.get();
      var filteredData = data.filter(function(entry) {
        return moment(entry.date).isBetween(
            moment.unix(sliderRange[0]), moment.unix(sliderRange[1]));
      });
      trafficChart.load({
        columns: getTrafficData(filteredData),
        unload: true
      });
      responseTimeChart.load({
        columns: getResponseTimeData(filteredData),
        unload: true
      });
    });
  });
});
