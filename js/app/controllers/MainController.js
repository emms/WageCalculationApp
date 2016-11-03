wageCalculationApp.controller('MainController', ['$http', 'CalculationService', function($http, CalculationService) {
  var self = this;
  self.data = [];
  self.showTable = false;

  self.readCSV = function() {
    // http get request to read CSV file content
    $http({
      method: 'GET',
      url: 'HourList201403.csv',
    }).then(function successCallback(response) {
      //console.log(response);
      CalculationService.initArray(response.data);
      self.showTable = true;
    }, function errorCallback(response) {
      console.log('CSV-tiedoston luku ei onnistunut!');
    });
  };


}]);
