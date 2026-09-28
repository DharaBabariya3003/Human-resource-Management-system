function officeStartTimeFunc(e) { 
  
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';

  $("#startTime").html("" + thistime);
  $("#startTime").css({ color: "green", "font-weight": "bold" });

  let officeStartTime=document.getElementById('officeStartTime').value;
  let officeEndTime=document.getElementById('officeEndTime').value;
  if(officeStartTime && officeEndTime){
      let code=document.getElementById('attendanceUser').value;
      if(code){
      $.ajax({
        url : `/admin/attendance/mode`+ `?code=` + code+ `&startTime=` + officeStartTime+ `&endTime=` + officeEndTime ,
        type:'GET',
        success: function (data, textStatus, xhr) {
          document.getElementById('totalMinutes').value=data.totalMinutes;   
      },  
    });}
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
      let code=document.getElementById('attendanceUser').value;
      if(code){
      $.ajax({
        url : `/admin/attendance/mode`+ `?code=` + code+ `&startTime=` + officeStartTime+ `&endTime=` + officeEndTime ,
        type:'GET',
        success: function (data, textStatus, xhr) {
          document.getElementById('totalMinutes').value=data.totalMinutes;   
      },  
    });}
  }
}
function getAttendanceCode(){
  let officeStartTime=document.getElementById('officeStartTime').value;
  let officeEndTime=document.getElementById('officeEndTime').value;
  if(officeStartTime && officeEndTime){
      let code=document.getElementById('attendanceUser').value;
      if(code){
      $.ajax({
        url : `/admin/attendance/mode`+ `?code=` + code+ `&startTime=` + officeStartTime+ `&endTime=` + officeEndTime ,
        type:'GET',
        success: function (data, textStatus, xhr) {
          document.getElementById('totalMinutes').value=data.totalMinutes;   
      },  
    });}
  }
}


