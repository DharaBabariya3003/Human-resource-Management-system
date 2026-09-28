

function outButton() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  m = checkTime(m);
  document.getElementById("out-time").innerHTML = h + ":" + m;
  document.getElementById("outtimeButton").disabled = true;
  var st = document.getElementById("out-time").textContent;
  document.location.href = `/dashboard/attendance/endtime` + "?endtime=" + st;
}

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function attendanceDateHandler(e) {
  document.location.href =
    `/admin/attendance` + `?selectedDate=` + e.target.value;
} 

function attendanceDateHandlerShowupdate(e, id) {
  document.location.href =
    `/admin/attendance/` + id + `/edit/` + `?selectedDate=` + e;
}

function updateAttendnaceLogs(attendanceLogId){     
  document.location.href =
  `/admin/attendance/` + attendanceLogId + `/edit`;
}


function attendanceDateHandlerEmployeeShowupdate(attendanceLogId) {
  document.location.href =
    `/admin/attendance/` + attendanceLogId + `/edit`;
}

function showErrorMsg(){
  
  toastr.error("Invalid time selected!");    
}

function updateInTotalTime(e) {  

    let time = e.target.value.split(':');// here the time is like "16:14"
    let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
    $("#inTime").html("" + thistime);
    $("#inTime").css({ color: "green", "font-weight": "bold" });

    var endtime = document.getElementById("updatedEndTime").value;
    var starttime = document.getElementById("updatedStartTime").value;
    var dt1 = new Date("2019-1-8 " + starttime);
    var dt2 = new Date("2019-1-8 " + endtime);
    var diff = dt2.getTime() - dt1.getTime();
    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60); 
    const totalTime = hours + ":" + mins;
    if(hours < 0 || mins < 0) {
      var attendanceID = document.getElementById("attendanceID").value;
      document.location.href = `/admin/attendance/${attendanceID}/edit?error=true`;
    } 
    document.getElementById("updatedTotalTime").value = hours + ":" + mins;  
}
function getTimeDiffTotalMinutes(startTime,endTime){
  let result;
  let entryTime = moment.duration(startTime, "HH:mm ");
  let exitTime = moment.duration(endTime, "HH:mm ");
  let diff = exitTime.subtract(entryTime);
  let diffH = diff.hours();
  let diffM = diff.minutes();
  if(diffH > 0 || diffM > 0){
    result = 1;
  }else{
    result = 0;
  }
  return result;
}
function updateOutTotalTime(e) {  
  let time = e.target.value.split(':');// here the time is like "16:14"
  
  let outTimeFieldValue = e.target.value;
  let currentUtcTime = moment().format("HH:mm");
  let result = getTimeDiffTotalMinutes(currentUtcTime,outTimeFieldValue);
  let attendanceUpdateDate = document.getElementById("attendanceUpdateDate").value;
  let todaysDate = moment(attendanceUpdateDate).isSame(moment(), 'day');

  if(result == 1 && todaysDate){
    document.getElementById("submitUpdateAttendance").disabled = true;
    $("#invalidOutTimeError").html("**You can not select future out time.");
    $("#invalidOutTimeError").css({ color: "red", "font-weight": "bold" });
  }else{
  document.getElementById("submitUpdateAttendance").disabled = false;
  $("#invalidOutTimeError").html("");  
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  $("#outTime").html("" + thistime);
  $("#outTime").css({ color: "green", "font-weight": "bold" });

  var endtime = document.getElementById("updatedEndTime").value;
  var starttime = document.getElementById("updatedStartTime").value;
  var dt1 = new Date("2019-1-8 " + starttime);
  var dt2 = new Date("2019-1-8 " + endtime);
  var diff = dt2.getTime() - dt1.getTime();
  var hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  var mins = Math.floor(diff / (1000 * 60));
  diff -= mins * (1000 * 60); 
  const totalTime = hours + ":" + mins;
  
  if(hours < 0 || mins < 0) {     
    var attendanceID = document.getElementById("attendanceID").value;    
    document.location.href = `/admin/attendance/${attendanceID}/edit?error=true`;
  }
  document.getElementById("updatedTotalTime").value = hours + ":" + mins;
  }
}
$(".date-picker").datepicker({
  changeMonth: true,
  changeYear: true,
  showButtonPanel: true,
  dateFormat: "MM yy",
  onClose: function (dateText, inst) {
    var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
    var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
    $(this).datepicker("setDate", new Date(year, month, 1));
  },
}); 

function attendanceMonthHandler(e, user) {  
  document.location.href = `/admin/attendance/` + user + `/show?selectedDate=` + e.target.value;
}

function attendanceDateChangeHandler(e) {  
  document.location.href = `/admin/attendance/?selectedDate=` + e.target.value;
}

function leaveMonthHandlerEmployee(e, user) {
  document.location.href =`/dashboard/leaveDetails?selectedDate=` + e.target.value;
} 

function overtimeCheck(e,user) {    
  var date = document.getElementById("attendanceMonth").value;
  if ($(e).is(":checked")) {          
    document.location.href = `/admin/attendance/` + user + `/overtimeCheck?selectedDate=` + date + `&overtimeCheck=true`;
  } else {
    document.location.href = `/admin/attendance/` + user + `/overtimeCheck?selectedDate=` + date + `&overtimeCheck=false`;
  }
} 

function perDateOvertimeCheck(e,user) {  
  let date = document.getElementById("attendanceDate").value;
  let selectedOption = document.getElementById("selectedOption").value;
  if($("#overtimeCheckout"+user).is(":checked")){
    document.location.href = `/admin/attendance/` + user + `/overtimeCheck?selectedDate=` + date + `&overtimeCheck=true&perDateOvertimeCheck=true&selectedOption=`+ selectedOption;
  } else {
  
    document.location.href = `/admin/attendance/` + user + `/overtimeCheck?selectedDate=` + date + `&overtimeCheck=false&perDateOvertimeCheck=true&selectedOption=` + selectedOption;
  }
} 



$(function() {
  $('input[name="daterange"]').daterangepicker({
    opens: 'left',
    maxDate: new Date()
  }, function(start, end, label) {    
    let newBrwoser= document.getElementById("newBrwoser").value;  
    let userid= document.querySelector("#allEmployee1"  + " option[value='" + newBrwoser+ "']").dataset.value;        
    userid = $.trim(userid);    
    if(!userid){
      userid = document.getElementById('userid').value;      
    }          
    document.location.href = `/admin/attendance/` + userid + `/salary?startDate=` + start.format('YYYY-MM-DD') + `&endDate=` + end.format('YYYY-MM-DD');       
  });
});
  
function changeNetAmount() {
  
  let netAmount,specialAllowance,bonus,petrolAllowance,shift;
  
  netAmount = document.getElementById("hiddenNetAmount").value;
  if(!netAmount){ netAmount =0 ;}
  specialAllowance = document.getElementById("specialAllowance").value;
  if(!specialAllowance){ specialAllowance =0;}
  bonus = document.getElementById("bonus").value;
  if(!bonus){ bonus = 0;}
  petrolAllowance = document.getElementById("petrolAllowance").value;
  if(!petrolAllowance){ petrolAllowance = 0;}
  shift = document.getElementById("shift").value;
  if(!shift){ shift = 0;}


  netAmount = Number(netAmount);
  specialAllowance = Number(specialAllowance);
  bonus = Number(bonus);
  petrolAllowance = Number(petrolAllowance);
  shift = Number(shift);
  
  let earings = (netAmount+specialAllowance+bonus+petrolAllowance+shift);
  
  let professionalTax = document.getElementById("professionalTax").value;
  if(!professionalTax){professionalTax = 0;}
  let esic = document.getElementById("esic").value;
  if(!esic){ esic = 0; }
  let securityDeposit = document.getElementById("securityDeposit").value;
  if(!securityDeposit){ securityDeposit = 0 ;}
  let tds = document.getElementById("tds").value;
  if(!tds){ tds = 0;}
  let pf = document.getElementById("pf").value;
  if(!pf){ pf = 0 ;}
  let other = document.getElementById("other").value;
  if(!other){ other = 0 ;}
  

  professionalTax = Number(professionalTax);
  esic = Number(esic);
  securityDeposit = Number(securityDeposit);
  tds = Number(tds);
  pf = Number(pf);
  other = Number(other);
  
  let deduction = (professionalTax + esic + securityDeposit + tds + pf + other);
  

  let total = (earings - deduction);
  document.getElementById("netAmount").value = total;  
}

function editchangeNetAmount(salary) {
  var salary = JSON.parse(salary);    
  let preEarning = parseInt(salary.specialAllowance) + parseInt(salary.bonus) + parseInt(salary.petrolAllowance) + parseInt(salary.shift);
  let preDeduction = parseInt(salary.professionalTax) + parseInt(salary.securityDeposit) + parseInt(salary.tds) + parseInt(salary.pf) + parseInt(salary.esic);

  let netAmount = +document.getElementById("editprenetAmount").value;

  netAmount = (netAmount - preEarning) + preDeduction;

  let specialAllowance = +document.getElementById("editspecialAllowance").value;
  let bonus = +document.getElementById("editbonus").value;
  let petrolAllowance = +document.getElementById("editpetrolAllowance").value;
  let shift = +document.getElementById("editshift").value;
  
  if(!specialAllowance){
    specialAllowance = 0;
  }
  if(!bonus){
    bonus = 0;
  }
  if(!petrolAllowance){
    petrolAllowance = 0;
  }
  if(!shift){
    shift = 0;
  }

  let totalEarning = netAmount + specialAllowance + bonus + petrolAllowance + shift;

  let professionalTax = +document.getElementById("editprofessionalTax").value;
  let securityDeposit = +document.getElementById("editsecurityDeposit").value;
  let tds = +document.getElementById("edittds").value;
  let pf = +document.getElementById("editpf").value;
  let esic = +document.getElementById("editesic").value;

  if(!professionalTax){
    professionalTax = 0;
  }
  if(!securityDeposit){
    securityDeposit = 0;
  }
  if(!tds){
    tds = 0;
  }
  if(!pf){
    pf = 0;
  }
  if(!esic){
    esic = 0;
  }

  let totalDeduction = professionalTax + securityDeposit + tds + pf + esic;

  let totalnetAmount = totalEarning - totalDeduction;
  document.getElementById("editnetAmount").value = totalnetAmount;  
}

function salaryMonthChange(e){
  let id = document.getElementById("salaryUserID").value;
  document.location.href = `/admin/view/` + `salarySlip/` +  id +`?salaryMonth=` +e.target.value;
}

function showAttendanceAlert() {      
  toastr.success("Attendance is done!");
} 

function showAlertMessage(msg) {  
  toastr.success("Mail is send!");
} 

function downloadExcel(e){  
  $("#form").submit();
}

function checkAttendanceDate(e){  
  let selecteddate= new Date(e.target.value); 
  let test = new Date(selecteddate.toDateString()) <= new Date(new Date().toDateString());
  if(!test){    
    document.location.href = `/admin/attendance/create?invalidDate=true`;
  }
}
function showInvalidDateAlert(){
  toastr.error("Invalid date selected!");    
}

function invalidOutTimeAlert(){
  toastr.error("Invalid data Selected!");    
}
function attAlreadyDone(){
  toastr.error("Attendance already done !!");    
}


$(function() {
  $('#isSpace').on('keypress', function(e) {
      if (e.which == 32){
          console.log('Space Detected');
          return false;
      }
  });
});

function loadAttendanceRecords(event){  
  let selectOption = event.value;
  let date = document.getElementById("attendanceDate").value;
  console.log(selectOption);
  document.location.href = `/admin/attendance/?selectedOption=` + selectOption +`&selectedDate=` + date;
}
function attendanceMonthHandlerEmployee(e) {
  var selectedValue = e.target.value;
  document.location.href =`/dashboard/attendanceDetails?selectedDate=` + selectedValue;
}
function formatTotalTime(time) {
  let hours,minutes,totalTime;
  if(time !== "-"){
    time=time.split(":");
    if(time[0].length==1){
      hours = format_two_digits(parseInt(time[0]));
    }else{
      hours = time[0];
    }
    if(time[1].length==1){
      minutes = format_two_digits(parseInt(time[1]));
    }else{
      minutes = time[1];
    }
    totalTime = hours+":"+minutes;
  }else{
    totalTime = "-";
  }
  return totalTime;
}


