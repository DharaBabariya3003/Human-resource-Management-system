function officeStartTimeFunc(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
    $("#startTime").html("" + thistime);
    $("#startTime").css({ color: "green", "font-weight": "bold" });

    let officeStartTime=document.getElementById('officeStartTime').value;
    let officeEndTime=document.getElementById('officeEndTime').value;
    if(officeStartTime && officeEndTime){
        let totalMinutes=getTotalTime();  
        let attendanceType = $("#attendanceTypeSelector").val();
        if(attendanceType == 'Card'){
          document.getElementById('totalMinutes').value=parseInt(totalMinutes);
        }else if(attendanceType == 'Tracker'){
          document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        }else{
          document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        }
        selectedLeaveCreditType();
    }
}
function officeEndTimeFunc(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
    $("#endTime").html("" + thistime);
    $("#endTime").css({ color: "green", "font-weight": "bold" });
    let officeStartTime=document.getElementById('officeStartTime').value;
    let officeEndTime=document.getElementById('officeEndTime').value;
    if(officeStartTime && officeEndTime){
        let totalMinutes=getTotalTime();
        let attendanceType = $("#attendanceTypeSelector").val();
        if(attendanceType == 'Card'){
          document.getElementById('totalMinutes').value=parseInt(totalMinutes);
        }else if(attendanceType == 'Tracker'){
          document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        }else{
          document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        }
        selectedLeaveCreditType();
    }
}
function getLeaveAndAttendance(){
  let attendanceType = $("#attendanceTypeSelector").val();     // here i change attendance type to selctiob
    let leaveCreditType = $("#leaveCreditSelector").val();
    let totalMinutes = getTotalTime();
    if(totalMinutes > 0){
      if(leaveCreditType === "Yearly" && attendanceType === "Card"){
        document.getElementById('totalMinutes').value=parseInt(totalMinutes);
        document.getElementById('leaveTotalMinutes').value = (parseInt(totalMinutes) * 12);
      }else if(leaveCreditType === "Yearly" && attendanceType === "Tracker"){
        document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        document.getElementById('leaveTotalMinutes').value = ((parseInt(totalMinutes)-60) * 12);
      }else if(leaveCreditType === "Yearly" && attendanceType === "Client Tracker"){
        document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        document.getElementById('leaveTotalMinutes').value = ((parseInt(totalMinutes)-60) * 12);
      }else if(leaveCreditType === "Monthly" && attendanceType === "Card"){
        document.getElementById('totalMinutes').value=parseInt(totalMinutes);
        document.getElementById('leaveTotalMinutes').value = parseInt(totalMinutes);
      }else if(leaveCreditType === "Monthly" && attendanceType === "Tracker"){
        document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        document.getElementById('leaveTotalMinutes').value =(parseInt(totalMinutes)-60);
      }else if(leaveCreditType === "Monthly" && attendanceType === "Client Tracker"){
        document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        document.getElementById('leaveTotalMinutes').value =(parseInt(totalMinutes)-60);
      }else if(leaveCreditType === "None" && attendanceType === "Card"){
        document.getElementById('totalMinutes').value=parseInt(totalMinutes);
        document.getElementById('leaveTotalMinutes').value =(parseInt(0));
      }else if(leaveCreditType === "None" && attendanceType === "Tracker"){
        document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        document.getElementById('leaveTotalMinutes').value =(parseInt(0));
      }else if(leaveCreditType === "None" && attendanceType === "Client Tracker"){
        document.getElementById('totalMinutes').value=(parseInt(totalMinutes)-60);
        document.getElementById('leaveTotalMinutes').value =(parseInt(0));
      }

    }
}
function selectedLeaveCreditType(){        
  getLeaveAndAttendance();
}
function selectedLeaveCreditTypeChange(){
  getLeaveAndAttendance();
}
function getTotalTime(){
  let officeStartTime=document.getElementById('officeStartTime').value;
  let officeEndTime=document.getElementById('officeEndTime').value;
  let st=moment.duration(officeStartTime,'HH:mm ');
    let et=moment.duration(officeEndTime,'HH:mm ');
    let diff=et.subtract(st);
    let diffH=diff.hours();
    let diffM=diff.minutes();
    let totalMinutes=(diffH*60)+diffM;
    return totalMinutes;
}
function lateTimeFunc(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  $("#lateTime").html("" + thistime);
  $("#lateTime").css({ color: "green", "font-weight": "bold" });
}
function overTimeMinuteFunc(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  $("#overTimeMinute").html("" + thistime);
  $("#overTimeMinute").css({ color: "green", "font-weight": "bold" });
  
}
