/**
 * @fileoverview Client side JavaScript for rendering site analytics.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(function() {
  $.post('/analytics', function(data) {
    console.log(data);
  });
});
