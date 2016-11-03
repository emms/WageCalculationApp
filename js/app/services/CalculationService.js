wageCalculationApp.factory('CalculationService', function() {
  var allData = [];
  var hourlyWage = 3.75;

  return {

    //first parses CSV file into array and saves it into array rawData
    //then saves info about each person into array allData based on the person ID
    initArray: function(allText) {
      var rawData = [];

      var allTextLines = allText.split(/\r\n|\n/);
      var headers = allTextLines[0].split(',');

      for (var i = 0; i < allTextLines.length; i++) {
        // split content based on comma
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {
          var tarr = [];
          for (var j = 0; j < headers.length; j++) {
            tarr.push(data[j]);
          }
          rawData.push(tarr);
        }
      }

      var ids = [];

      //get all person id's from csv file and save them into array ids
      //save initial person data into array allData
      for (var k = 1; k < rawData.length; k++) {
        var id = parseInt(rawData[k][1]);
        var personName = rawData[k][0];
        if (ids.indexOf(id) === -1) {
          ids.push(id);
          var personData = { 'id': id, 'personName': personName, 'totalWage': 0, 'totalHours': 0, 'overtimeHours': 0, 'overtimePercent': 0, 'overtimePay': 0, 'eveningHours': 0, 'eveningPercent': 0, 'eveningPay': 0 };
          allData.push(personData);
        }
      }

      //go through all rows of the data and add hours/wages to appropriate places in the allData array
      for (var m = 1; m < rawData.length; m++) {
        var dataRow = rawData[m];
        var personId = dataRow[1];

        var dateInfo = this.getDateInfo(dataRow);
        for (var n = 0; n < allData.length; n++) {
          if (parseInt(allData[n].id) === parseInt(personId)) {
            var dayTotals = this.calculateDayTotals(dateInfo.date, dateInfo.startTime, dateInfo.endTime);
            allData[n].totalWage += dayTotals.totalDayWage;
            allData[n].totalHours += dayTotals.totalDayHours;
            allData[n].overtimeHours += this.getOvertimeHours(dayTotals.totalDayHours);
            allData[n].overtimePay += this.calculateOvertimePay(dayTotals.totalDayHours);
            allData[n].eveningHours += this.getEveningHours(dateInfo.date, dateInfo.startTime, dateInfo.endTime);
            allData[n].eveningPay += this.calculateEveningPay(this.getEveningHours(dateInfo.date, dateInfo.startTime, dateInfo.endTime));
          }
        }
      }

      for (var l = 0; l < allData.length; l++) {
        allData[l].overtimePercent = allData[l].overtimeHours / allData[l].totalHours;
        allData[l].eveningPercent = allData[l].eveningHours / allData[l].totalHours;
      }
    },

    //returns the information on date, start time and end time as moment objects
    getDateInfo: function(dataRow) {
      var rawDate = dataRow[2];
      var rawStartTime = dataRow[3];
      var rawEndTime = dataRow[4];

      //make moments of each piece of data (with moment.js)
      var date = this.getDate(rawDate);
      var startTime = this.getStartTime(date, rawStartTime);
      var endTime = this.getEndTime(date, startTime, rawEndTime);

      var converted = {
        'date': date,
        'startTime': startTime,
        'endTime': endTime,
      };

      return converted;
    },

    getDate: function(rawDate) {
      var date = moment(rawDate, 'DD-MM-YYYY');
      return date;
    },

    getStartTime: function(date, rawStartTime) {
      var startTimeData = rawStartTime.split(':'),
        startHour = parseInt(startTimeData[0]),
        startMinutes = parseInt(startTimeData[1]);

      var startTime = date.clone().hour(startHour).minute(startMinutes);

      return startTime;
    },

    getEndTime: function(date, startTime, rawEndTime) {
      var endTimeData = rawEndTime.split(':'),
        endHour = parseInt(endTimeData[0]),
        endMinutes = parseInt(endTimeData[1]);

      var endTime;

      if (endHour < startTime.hour()) {
        //endTime is on next day
        endTime = date.clone().add(1, 'day').hour(endHour).minute(endMinutes);
      } else {
        endTime = date.clone().hour(endHour).minute(endMinutes);
      }

      return endTime;
    },

    //calculates total hours and total pay of a given date
    calculateDayTotals: function(date, startTime, endTime) {
      var dayWage = 0;
      //calculate minutes done during the day with moment.js function diff
      var totalDayMinutes = endTime.diff(startTime, 'minutes');

      //convert minutes to hours, round to make sure the number has no more than 2 decimals
      var totalDayHours = Math.round((totalDayMinutes / 60) * 100) / 100;

      //calculate basic day wage, round dollar amounts to cents
      dayWage += Math.round((totalDayHours * hourlyWage) * 100) / 100;

      //add overtime pay to day wage, round dollar amounts to cents
      dayWage += Math.round(this.calculateOvertimePay(totalDayHours) * 100) / 100;

      //add evening pay to day wage, round dollar amounts to cents
      dayWage += Math.round(this.calculateEveningPay(this.getEveningHours(date, startTime, endTime)) * 100) / 100;

      var totals = { 'totalDayHours': totalDayHours, 'totalDayWage': dayWage };

      return totals;
    },

    //returns how many hours were overtime on a given day. Returns only positive values
    getOvertimeHours: function(totalDayHours) {
      var normalHours = 8;
      var overtime = totalDayHours - normalHours;

      if (overtime < 0) overtime = 0;

      return overtime;
    },

    calculateOvertimePay: function(totalDayHours) {
      var overtime = this.getOvertimeHours(totalDayHours);
      var overtimePay = 0;

      //for hours that exceed 8+4, add 100% pay
      if (overtime > 4) {
        overtimePay += (overtime - 4) * hourlyWage;
        overtime = 4;
      }
      //for hours that are between 2 and 4 more than 8, add 50% pay
      if (overtime > 2) {
        overtimePay += (overtime - 2) * 0.5 * hourlyWage;
        overtime = 2;
      }
      //for hours that are between 0 and 2 more than 8, add 25% pay
      if (overtime > 0) {
        overtimePay += overtime * 0.25 * hourlyWage;
      }

      overtimePay = Math.round(overtimePay * 100) / 100;

      return overtimePay;
    },

    getEveningHours: function(date, startTime, endTime) {
      var startHour = 18;
      var endHour = 6;

      //evening starts same day at 18
      var eveningStart = date.clone().hour(startHour);
      //evening ends next day at 6
      var eveningEnd = date.clone().add(1, 'day').hour(endHour);

      var eveningMinutes = 0;

      //check if startTime is between evening hours (eveningStart and eveningEnd included)
      if (startTime.isBetween(eveningStart, eveningEnd, '[]')) {
        if (endTime.isBetween(eveningStart, eveningEnd, '[]')) {
          eveningMinutes = endTime.diff(startTime, 'minutes');
        } else {
          eveningMinutes = eveningEnd.diff(startTime, 'minutes');
        }
      } else if (endTime.isBetween(eveningStart, eveningEnd, '[]')) {
        //startTime is not between evening hours start and end
        eveningMinutes = endTime.diff(eveningStart, 'minutes');
      }

      var eveningHours = Math.round((eveningMinutes / 60) * 100) / 100;

      return eveningHours;
    },

    calculateEveningPay: function(eveningHours) {
      var eveningPay = eveningHours * 1.15;
      return eveningPay;
    },

    getOrderedData: function() {
      return allData;
    },
  };

});
