$(document).ready(function () {
  if ($("#statusSelector").val() === "Single") {
    $("#MarriageDateSelection").hide();
  } else {
    $("#MarriageDateSelection").show();
  }
});

$("#statusSelector").on("change", function () {
  if (this.value === "Married") {
    $("#MarriageDateSelection").show();
  } else {
    $("#MarriageDateSelection").hide();
  }
});

function setColor(tag) {
  if (tag == "employee") {
    document.location.href = `/admin` + "?tab=" + tag;
  } else if (tag === "left") {
    document.location.href = `/admin/leftEmployees` + "?tab=" + tag;
  } else if (tag === "notification") {
    document.location.href = `/admin/notification` + "?tab=" + tag;
  } else if (tag === "leave") {
    document.location.href = `/admin/leaveRequests` + "?tab=" + tag;
  } else if (tag === "interview") {
    document.location.href = `/admin/interview` + "?tab=" + tag;
  } else if (tag === "interviewNotification") {
    document.location.href = `/admin/interview/notification` + "?tab=" + tag;
  } else if (tag === "search") {
    document.location.href = `/admin/searchMonthlyRecord` + "?tab=" + tag;
  } else if (tag === "done") {
    document.location.href = `/admin/interview/done` + "?tab=" + tag;
  } else if (tag === "xls") {
    document.location.href = `/admin/paySalary/xlsxUpload` + "?tab=" + tag;
  }
}

function ShowHideDiv() {
  var overTimeCheckOutVal = document.getElementById("overTimeCheckOut");
  var overTimeMinuteVal = document.getElementById("overTimeMinuteValue");
  overTimeMinuteVal.style.display = overTimeCheckOutVal.value== "true" ? "block" : "none";
}

function ShowHideDivPayroll() {
  var bondCheckOutVal = document.getElementsByClassName("bondCheckOut");

  var bondDurationHeader = document.getElementsByClassName("bondDurationHeader");
  var bondDuration = document.getElementsByClassName("bondDuration");
  var bondCompletedDateHeader = document.getElementsByClassName("bondCompletedDateHeader");
  var bondCompletedDate = document.getElementsByClassName("bondCompletedDate");
  
  bondDurationHeader[0].style.display = bondCheckOutVal[0].value== "Yes" ? "block" : "none";
  bondDuration[0].style.display = bondCheckOutVal[0].value== "Yes" ? "block" : "none";
  bondCompletedDateHeader[0].style.display = bondCheckOutVal[0].value== "Yes" ? "block" : "none";
  bondCompletedDate[0].style.display = bondCheckOutVal[0].value== "Yes" ? "block" : "none";
}

function ShowHideDivPayrollUpdate() {
  var bondCheckOutVal = document.getElementsByClassName("bondCheckOut");
  var bondDurationHeader = document.getElementById("bondDurationHeaderUpdate");
  var bondDuration = document.getElementById("bondDuration");
  var bondCompletedDateHeader = document.getElementById("bondCompletedDateHeaderUpdate");
  var bondCompletedDate = document.getElementById("myBondComplete");
  
  bondDurationHeader.style.display = bondCheckOutVal[0].value== "Yes" ? "block" : "none";
  bondDuration.style.display = bondCheckOutVal[0].value== "Yes" ? "block" : "none";
  bondCompletedDateHeader.style.display = bondCheckOutVal[0].value== "Yes" ? "block" : "none";
  bondCompletedDate.style.display = bondCheckOutVal[0].value== "Yes" ? "block" : "none";
}
