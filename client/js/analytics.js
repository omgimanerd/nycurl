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

var iterByDay = function(min, max, callback) {
  var tmp = moment(min);
  for (var day = tmp; day.isBefore(max); day.add(1, 'day')) {
    callback(day);
  }
};

var getDateRange = function(data) {
  if (data.length < 2) {
    return null;
  }
  return {
    min: moment(data[0].date).startOf('day'),
    max: moment(data[data.length - 1].date).endOf('day')
  };
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
    var day = moment(entry.date).startOf('day');
    hitsPerDay[day] = hitsPerDay[day] ? hitsPerDay[day] + 1 : 1;
    if ((entry.userAgent || '').includes('curl')) {
      curlPerDay[day] = curlPerDay[day] ? curlPerDay[day] + 1 : 1;
    }
  });
  var dateColumn = ['date'];
  var hitsPerDayColumn = ['total requests'];
  var curlPerDayColumn = ['curl requests'];
  var range = getDateRange(data);
  iterByDay(range.min, range.max, function(day) {
    dateColumn.push(day.format('YYYY-MM-DD'));
    hitsPerDayColumn.push(hitsPerDay[day] || 0);
    curlPerDayColumn.push(curlPerDay[day] || 0);
  });
  return [dateColumn, hitsPerDayColumn, curlPerDayColumn];
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
  var dateColumn = ['date'];
  var minColumn = ['min'];
  var avgColumn = ['avg'];
  var maxColumn = ['max'];
  var range = getDateRange(data);
  iterByDay(range.min, range.max, function(day) {
    dateColumn.push(day.format('YYYY-MM-DD'));
    minColumn.push(min(timesByDay[day]));
    avgColumn.push(avg(timesByDay[day]));
    maxColumn.push(max(timesByDay[day]));
  });
  return [dateColumn, minColumn, avgColumn, maxColumn];
};

var getSectionFrequencyData = function(data) {
  var frequencies = {};
  data.map(function(entry) {
    var matches = /[a-z]+/g.exec(entry.url);
    var url = 'home';
    if (matches) {
      url = matches[0];
    }
    frequencies[url] = frequencies[url] ? frequencies[url] + 1 : 1;
  });
  var items = Object.keys(frequencies).map(function(section) {
    return [section, frequencies[section]];
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).slice(0, 15);
  return [
    ['sections'].concat(items.map(item => item[0])),
    ['frequency'].concat(items.map(item => item[1]))
  ];
};

/**
 * Main jQuery script to initialize the page elements.
 */
$(document).ready(function() {
  var dateSlider = document.getElementById('date-slider');
  $.post('/analytics', function(data) {
    if (data.length == 0) {
      window.alert('No data!');
    }
    /**
     * Initialize the c3 charts on the page with the analytics data.
     */
    var trafficChart = c3.generate({
      bindto: '#traffic',
      axis: {
        x: { padding: 0, type: 'timeseries' },
        y: { label: 'Requests', min: 0, padding: 0 }
      },
      data: {
        x: 'date',
        columns: getTrafficData(data)
      },
      point: { show: false },
      padding: {
        right: 25
      }
    });
    var responseTimeChart = c3.generate({
      bindto: '#response-time',
      axis: {
        x: { padding: 0, type: 'timeseries' },
        y: { label: 'Milliseconds', min: 0, padding: 0 }
      },
      data: {
        x: 'date',
        columns: getResponseTimeData(data),
        type: 'area',
        groups: [['min', 'avg', 'max']]
      },
      point: { show: false }
    });
    var sectionFrequencyChart = c3.generate({
      bindto: '#section-frequency',
      axis: {
        x: { type: 'category', tick: { multiline: true } }
      },
      data: {
        x: 'sections',
        columns: getSectionFrequencyData(data),
        type: 'bar'
      }
    });

    /**
     * Initialize the slider with the proper parameters.
     */
    var range = getDateRange(data);
    var dateFormatter = {
      to: function(value) {
        return moment.unix(value).format("M/D/YYYY");
      }
    };
    noUiSlider.create(dateSlider, {
      start: [range.min.unix(), range.max.unix()],
      tooltips: [dateFormatter, dateFormatter],
      connect: true,
      margin: moment.duration(15, 'days').asSeconds(),
      range: { min: range.min.unix(), max: range.max.unix() },
      step: moment.duration(1, 'day').asSeconds()
    });

    /**
     * Event handler for our slider so that the c3 charts are updated.
     */
    dateSlider.noUiSlider.on('set', function() {
      var sliderRange = dateSlider.noUiSlider.get().map((d) => moment.unix(d));
      var filteredData = data.filter(function(entry) {
        return moment(entry.date).isBetween(sliderRange[0], sliderRange[1]);
      });
      if (filteredData.length == 0) {
        window.alert('This time segment has no data!');
        return;
      }
      trafficChart.load({
        columns: getTrafficData(filteredData),
        unload: true
      });
      responseTimeChart.load({
        columns: getResponseTimeData(filteredData),
        unload: true
      });
      sectionFrequencyChart.load({
        columns: getSectionFrequencyData(filteredData),
        unload: true
      });
    });
  });
});
