function incHandler(e) {
  document.location.href = `/admin/interview` + `?selectedDate=` + e.target.value;
}
function doneHandler(e) {
  document.location.href = `/admin/interview/done` + `?selectedDate=` + e.target.value;
}

$("#incrementDatePickerHandler").datepicker({
  format: "yyyy",
  viewMode: "years",  
  minViewMode: "years",
});
$("#incrementDatePickerHandlerUpdate").datepicker({
  format: "yyyy",
  viewMode: "years",  
  minViewMode: "years",
});
$("#incrementDatePicker").datepicker({
  format: "yyyy",
  viewMode: "years",  
  minViewMode: "years",
});


function setYear() {
  let getIncrementDate = $("#getIncrementDate").val();
  let newDate = getIncrementDate;
  if (getIncrementDate.length > 4) {
    newDate = getIncrementDate.substring(0, 7);
  }
  let incrementDatePickerHandler = $("#incrementDatePickerHandler").val();
  $("#getIncrementDate").val(newDate + incrementDatePickerHandler);
}

$(document).ready(function () {
  $("#incrementDatePickerHandler").change(function () {
    setYear();
  });
  $("#incrementDatePickerHandler").keyup(function () {
    setYear();
  });
  $("#incrementDatePickerHandler").blur(function () {
    let lengthI = $("#incrementDatePickerHandler").val().length;
    if (lengthI < 4) {
      $("#incrementDatePickerHandler").val("");
    }
  });
});

function interviewFullHoursTime(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  $("#amAndPm").html("" + thistime);
  $("#amAndPm").css({ color: "green", "font-weight": "bold" });
}
