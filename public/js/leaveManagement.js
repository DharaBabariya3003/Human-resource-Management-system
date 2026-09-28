$(document).ready(function(){
  $(".time").hide();
  $("#hide").click(function(){
  $(".show").hide();
  $(".hide").show();
});

$("#show").click(function(){
  $(".show").show();
  $(".hide").hide();  
  });
});

$("#Txt_Date").datepicker({
  format: 'd-M-yyyy',
  inline: false,
  lang: 'en', 
  step: 5,
  multidate: 15,
  closeOnDateSelect: true,
  startDate: new Date() 
});

$("#appt").datepicker({
  startDate: new Date() 

})

function load_month_content(month){
  var m=month.value;
  document.location.href = `/admin/searchMonthlyRecord`+'?month='+m;
} 

$("#leaveDatePicker").datepicker({
  format: "yyyy",
  viewMode: "years",  
  minViewMode: "years",
});
function loadLeaveYear(year){
  var y=year.value;
  let selectedData=document.getElementById('leaveSelectOption').value;
  if(y.length==4){
    document.location.href = `/admin/leaveRequests`+'?year='+y+'&option='+selectedData;
  }
  
} 
function loadLeaveChoice(choice){
  var c=choice.value;
  let selectedyear=document.getElementById('leaveDatePicker').value;
  if(selectedyear.length==4){
    document.location.href = `/admin/leaveRequests`+'?year='+selectedyear+'&option='+c;
  }
} 

$("#fromDate").datepicker({
  format: 'dd/mm/yyyy',
  multidate: false,
  closeOnDateSelect: true,
  startDate: new Date() 
})
$("#toDate").datepicker({
  format: 'dd/mm/yyyy',
  multidate: false,
  closeOnDateSelect: true,
  startDate: new Date() 
})
$("#halfDate").datepicker({
  format: 'dd/mm/yyyy',
  multidate: false,
  closeOnDateSelect: true,
  startDate: new Date() 
})

function leaveFullHoursTime1(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  $("#amAndPm").html("" + thistime);
  $("#amAndPm").css({ color: "green", "font-weight": "bold" });
  var toTime = moment(document.getElementById("halfDayToTime").value,"HH:mm");
  var fromTimeCheck = document.getElementById("halfDayFromTime").value;
  if(fromTimeCheck){
    var fromTime = moment(document.getElementById("halfDayFromTime").value,"HH:mm");
    var diff = fromTime.isBefore(toTime);
    if(diff){
      document.getElementById("submitLeaveRequest").disabled = false;
      $("#leaveDateError").html("");
    }else{
      document.getElementById("submitLeaveRequest").disabled = true;
      $("#leaveDateError").html("**Select valid time");
      $("#leaveDateError").css({ color: "red", "font-weight": "bold" });
    }
  }
}
function leaveFullHoursTime2(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  $("#fAndt").html("" + thistime);
  $("#fAndt").css({ color: "green", "font-weight": "bold" });

  var fromTime = moment(document.getElementById("halfDayFromTime").value,"HH:mm");
  var toTimeCheck = document.getElementById("halfDayToTime").value;
  if(toTimeCheck){
    var toTime = moment(document.getElementById("halfDayToTime").value,"HH:mm");
    var diff = fromTime.isBefore(toTime);
    if(diff){
      document.getElementById("submitLeaveRequest").disabled = false;
      $("#leaveDateError").html("");
    }else{
      document.getElementById("submitLeaveRequest").disabled = true;
      $("#leaveDateError").html("**Select valid time");
      $("#leaveDateError").css({ color: "red", "font-weight": "bold" });
    }
  }
}

function approveLeaveRequest(leaveId,status) {
  let leaveSelectOption = document.getElementById("leaveSelectOption").value;
  let leaveDatePicker = document.getElementById("leaveDatePicker").value;
  let msg,textMsg;
  if(status=='approve'){
    msg="To approve this request?"
    textMsg='Leave record is approved!'
  }else if(status=='decline'){
    msg="To decline this request ? "
    textMsg='Leave record is declined!'
  }
  else{
    msg="To delete this request? "
    textMsg='Leave record is deleted!';
  }
  swal({
    title: "Are you sure?",
    text: `${msg}`,
    icon: "warning",
    buttons: [
      'No, cancel it!',
      'Yes, I am sure!'
    ],
  }).then(function(isConfirm) {
    if (isConfirm) {
      window.location= `/admin/leaveRequests`+'?year='+leaveDatePicker+'&option='+leaveSelectOption+'&leaveId='+leaveId+'&status='+status  
    }
  })
}

function loadLeaveYearHistory(year){
  var y=year.value;
  let selectedData=document.getElementById('leaveSelectOption').value;
  if(y.length==4){
    document.location.href = `/admin/leaveRequests/history`+'?year='+y+'&option='+selectedData;
  }
  
} 

function loadLeaveChoiceHistory(choice){
  var c=choice.value;
  let selectedyear=document.getElementById('leaveDatePicker').value;
  if(selectedyear.length==4){
    document.location.href = `/admin/leaveRequests/history`+'?year='+selectedyear+'&option='+c;
  }
} 

function loadLeaveYearHistoryEmployee(year){
  var y=year.value;
  let selectedData=document.getElementById('leaveSelectOption').value;
  if(y.length==4){
    document.location.href = `/dashboard/leaveRequest/history`+'?year='+y+'&option='+selectedData;
  }
  
} 
function loadLeaveChoiceHistoryEmp(choice){
  var c=choice.value;
  let selectedyear=document.getElementById('leaveDatePicker').value;
  if(selectedyear.length==4){
    document.location.href = `/dashboard/leaveRequest/history`+'?year='+selectedyear+'&option='+c;
  }
}
function fromDateSelection(){
  var fromDate = document.getElementById("fromDate").value;
  var fromDatedateArr = fromDate.split("/");
  var editedFromDate = moment(new Date(fromDatedateArr[2]+"-"+fromDatedateArr[1]+"-"+fromDatedateArr[0])).format("YYYY-MM-DD");

  var toDate = document.getElementById("toDate").value;
  if(toDate){
  var toDatedateArr = toDate.split("/");
  var editedToDate = moment(new Date(toDatedateArr[2]+"-"+toDatedateArr[1]+"-"+toDatedateArr[0])).format("YYYY-MM-DD");
  if((moment(new Date(editedToDate)).isSame(moment(new Date(editedFromDate)), 'day')) || (moment(new Date(editedToDate)).isAfter(moment(new Date(editedFromDate)), 'day'))){
    document.getElementById("submitLeaveRequest").disabled = false;
    $("#leaveDateError").html("");
  }else{
    document.getElementById("submitLeaveRequest").disabled = true;
    $("#leaveDateError").html("**Select valid date");
    $("#leaveDateError").css({ color: "red", "font-weight": "bold" });
  }
  }
}
function toDateSelection(){
  var toDate = document.getElementById("toDate").value;
  var toDatedateArr = toDate.split("/");
  var editedToDate = moment(new Date(toDatedateArr[2]+"-"+toDatedateArr[1]+"-"+toDatedateArr[0])).format("YYYY-MM-DD");
  
  var fromDate = document.getElementById("fromDate").value;
  if(fromDate){
    var fromDatedateArr = fromDate.split("/");
    var editedFromDate = moment(new Date(fromDatedateArr[2]+"-"+fromDatedateArr[1]+"-"+fromDatedateArr[0])).format("YYYY-MM-DD");
    if((moment(new Date(editedToDate)).isSame(moment(new Date(editedFromDate)), 'day')) || (moment(new Date(editedToDate)).isAfter(moment(new Date(editedFromDate)), 'day'))){
    document.getElementById("submitLeaveRequest").disabled = false;
    $("#leaveDateError").html("");
    }else{
      document.getElementById("submitLeaveRequest").disabled = true;
      $("#leaveDateError").html("**Select valid date");
      $("#leaveDateError").css({ color: "red", "font-weight": "bold" });
    }
  }
} 

$('#submitLeaveRequest').one('click', function (event) {  
  event.preventDefault();
  $( "#empLeaveRequestForm" ).submit();
  $(this).prop('disabled', true);
});