wageCalculationApp.controller('TableController', function(CalculationService) {
  var self = this;
  self.rows = [];

  self.formatTableData = function() {
    self.rows = CalculationService.getOrderedData();

    //format each hour time as string with hours and minutes
    for (var i = 0; i < self.rows.length; i++) {
      for (var key in self.rows[i]) {
        if (key.indexOf('Hours') !== -1) {
          var hoursSplit = self.rows[i][key].toFixed(2).split('.');
          var hours = hoursSplit[0];
          var minutes = self.rows[i][key] * 60 % 60;

          self.rows[i][key] = hours + 'h ';
          if (minutes !== 0) {
            self.rows[i][key] += minutes + 'min';
          }
        }
      }
    }
  };
  
});
