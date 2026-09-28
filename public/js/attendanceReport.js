$('#attendanceMonth').datepicker( {
  format: "MM-yyyy",
  startView: "months", 
  minViewMode: "months",
  endDate: new Date() 
});

function attendanceReportMonth(e) {
  //Remove all appended tr and td.
  $('#empMonthlyReportDates > th').remove();
  $('#empMonthlyReport tbody > tr').remove();

  let selectedValue = moment(new Date(e.target.value)).format('YYYY-MM');
  $.fn.getAttendanceReport(selectedValue);
}

$(document).ready(function(){
  let selectedValue = $('#attendanceMonth').val();
  selectedValue = moment(new Date(selectedValue)).format('YYYY-MM');
  $.fn.getAttendanceReport(selectedValue);
});

//Tooltip
$(document).on('mouseover', 'a.trigger', function() {
  $( '.trigger[title]' ).tooltip();
});

$.fn.getAttendanceReport = function(selectedValue){
  const todays_Date = moment().format("YYYY-MM-DD");
  $.ajax({
    url: `/admin/attendance/report?selectedDate=${selectedValue}`,
    type: 'GET',
    success: function (data, textStatus, xhr) {
      let month_holidays = data.monthHolidays;
      let month_sundays = data.monthSundays;
      
      if(data.totalDaysOfMonth){
        $('#empMonthlyReportDates').append( $('<th />', {text : 'Employee Name'}) )
        for(let i=1; i<=data.totalDaysOfMonth; i++){
          $('#empMonthlyReportDates').append( $('<th />', {text : i}) )
        }
      }
      if(data.employees){
        for (const employee of data.employees) {
          let employeeName = employee.firstName + " " +employee.middleName+ " "+ employee.lastName;
          let trId = `${Math.floor(Math.random() * 1000000000)}`;
          $("#empMonthlyReport tbody").append(
            `<tr id=${trId}>
                <td>${employeeName}</td>
             </tr>
          `)
          $.ajax({
            url: `/admin/attendance/report?selectedDate=${selectedValue}&userId=${employee._id}`,
            type: 'GET',
            success: function (data, textStatus, xhr) {
              let monthly_attendance = data.monthlyAttendance;
              let startingDate = new Date(data.startOfMonth);
              let endingDate = new Date(data.endOfMonth);
              //Iterate upto months starting to ending date.
              while (startingDate <= endingDate) {
                let toDateString = startingDate.toDateString()
                let attendance = monthly_attendance.filter(function (element) { return element.date === toDateString });
                attendance = attendance[0];
                //If employees attendance available
                if (attendance) {
                  let totalTime = attendance.totalTime;
                  let totalTimeArray = totalTime.split(":");
                  tempMinutes = +totalTimeArray[0] * 60 + +totalTimeArray[1];
                  // full day
                  if(tempMinutes >= attendance.totalMinutes){ 
                    $(`#${trId}`).append(`
                    <td class="presentDay">
                      <a class="trigger" title='${totalTimeArray[0]} Hours ${totalTimeArray[1]} Minutes'><i class="fas fa-check"></i></a>
                    </td>`);
                  }
                  //If end time not exist
                  else if (tempMinutes == 0) {
                    $(`#${trId}`).append(`<td class="exitTimeNotAvailable"><i class="fas fa-check"></i></td>`);
                  }
                  //half day
                  else {
                    $(`#${trId}`).append(`<td class="halfDay">
                    <a class="trigger" title='${totalTimeArray[0]} Hours ${totalTimeArray[1]} Minutes'><i class="fas fa-check"></i></a>
                    </td>`);
                  }
                }else{
                  // If attendance not available then check for leave.
                  let leaveDate = moment(startingDate).format('YYYY-MM-DD').toString();
                  let isHoliday = month_holidays.includes(leaveDate)

                  // Check date is of holiday or not.
                  if(isHoliday) {
                    $(`#${trId}`).append(`<td><i class="fas fa-times"></i></td>`);
                  } else {
                    // Check date is of sunday or not.
                    let isSunday = month_sundays.includes(leaveDate)
                    if(isSunday) $(`#${trId}`).append(`<td class="leaveFont">S</td>`);
                    else {
                      if(moment(startingDate).isAfter(todays_Date)) {
                        $(`#${trId}`).append(`<td class="leaveFont">-</td>`);
                      } else {
                        $(`#${trId}`).append(`<td class="leaveFont">A</td>`);
                      }
                    }
                  }
                }
                startingDate.setDate(startingDate.getDate() + 1);
              }
            }
          });
        }
      }
    }
  });  
}