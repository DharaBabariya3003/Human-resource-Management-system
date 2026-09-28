function officeStartTimeFunc(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
    $("#startTime").html("" + thistime);
    $("#startTime").css({ color: "green", "font-weight": "bold" });

    let officeStartTime=document.getElementById('officeStartTime').value;
    let officeEndTime=document.getElementById('officeEndTime').value;
    if(officeStartTime && officeEndTime){
        let st=moment.duration(officeStartTime,'HH:mm ');
        let et=moment.duration(officeEndTime,'HH:mm ');
        let diff=et.subtract(st);
        let diffH=diff.hours();
        let diffM=diff.minutes();
        let totalMinutes=(diffH*60)+diffM;  
        document.getElementById('totalMinutes').value=totalMinutes;
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
        let st=moment.duration(officeStartTime,'HH:mm ');
        let et=moment.duration(officeEndTime,'HH:mm ');
        let diff=et.subtract(st);
        let diffH=diff.hours();
        let diffM=diff.minutes();
        let totalMinutes=(diffH*60)+diffM;
        document.getElementById('totalMinutes').value=totalMinutes;   
        selectedLeaveCreditType();
    }
}
function updateLeaveCreditMinute(e){
  let changeAttendanceType = $("#attendanceType").val();      
  let totalLeaveMinutes = $("#tempLeaveMinute").val();
  let tempAttendanceType = $("#tempAttendanceType").val();
  let leaveCreditType = $("#leaveCreditSelector").val();
  let totalMinutes = $("#totalMinutes").val();

  if(tempAttendanceType == "Tracker") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) + 60); 
  if(changeAttendanceType == "Tracker") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) - 60);

  if(tempAttendanceType == "Client Tracker") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) + 60); 
  if(changeAttendanceType == "Client Tracker") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) - 60);

  if(tempAttendanceType == "Card") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) - 60); 
  if(changeAttendanceType == "Card") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) + 60); 


  tempAttendanceType = tempAttendanceType.trim();
  changeAttendanceType = changeAttendanceType.trim();

  if((tempAttendanceType !== changeAttendanceType) && (totalLeaveMinutes != 0) && (leaveCreditType == "Yearly")){    
    let leaveMonthlyMinute ;
    let targetLeaveMonthlyMinute ; 
    if(tempAttendanceType == "Tracker") {
      leaveMonthlyMinute = 480;
      targetLeaveMonthlyMinute = 540;
    }else if(tempAttendanceType == "Client Tracker") {
      leaveMonthlyMinute = 480;
      targetLeaveMonthlyMinute = 540;
    }else{
      leaveMonthlyMinute = 540;
      targetLeaveMonthlyMinute = 480;
    }    
    let updatedTotalLeaveMinutes = parseInt((targetLeaveMonthlyMinute * totalLeaveMinutes)/leaveMonthlyMinute);
    document.getElementById("leaveTotalMinutes").value = updatedTotalLeaveMinutes;
  }else if(tempAttendanceType == changeAttendanceType && (leaveCreditType == "Yearly")){    
    document.getElementById("leaveTotalMinutes").value = totalLeaveMinutes;
  }
}
function officeStartTimeFuncUpdate(e) { 
  
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  $("#startTime").html("" + thistime);
  $("#startTime").css({ color: "green", "font-weight": "bold" });

  let officeStartTime=document.getElementById('officeStartTime').value;
  let officeEndTime=document.getElementById('officeEndTime').value;
  if(officeStartTime && officeEndTime){
      let st=moment.duration(officeStartTime,'HH:mm ');
      let et=moment.duration(officeEndTime,'HH:mm ');
      let diff=et.subtract(st);
      let diffH=diff.hours();
      let diffM=diff.minutes();
      let totalMinutes=(diffH*60)+diffM;  
      document.getElementById('totalMinutes').value=totalMinutes;      
  }        
}
function officeEndTimeFuncUpdate(e) {
  let time = e.target.value.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  $("#endTime").html("" + thistime);
  $("#endTime").css({ color: "green", "font-weight": "bold" });
  let officeStartTime=document.getElementById('officeStartTime').value;
  let officeEndTime=document.getElementById('officeEndTime').value;
  if(officeStartTime && officeEndTime){
      let st=moment.duration(officeStartTime,'HH:mm ');
      let et=moment.duration(officeEndTime,'HH:mm ');
      let diff=et.subtract(st);
      let diffH=diff.hours();
      let diffM=diff.minutes();
      let totalMinutes=(diffH*60)+diffM;
      document.getElementById('totalMinutes').value=totalMinutes;         
  }
}

function selectedLeaveCreditType()  
  {        
    let attendanceType = $("#attendanceTypeSelector").val();     // here i change attendance type to selctiob
    let leaveCreditType = $("#leaveCreditSelector").val();


    let totalMinutes = $("#totalMinutes").val();       
    if(totalMinutes > 0){              
      if(leaveCreditType === "Yearly" && attendanceType === "Card"){        
        document.getElementById('leaveTotalMinutes').value = (parseInt(totalMinutes) * 12);
      }else if(leaveCreditType === "Yearly" && attendanceType === "Tracker"){
        document.getElementById('leaveTotalMinutes').value = (480 * 12);
      }else if(leaveCreditType === "Yearly" && attendanceType === "Client Tracker"){
        document.getElementById('leaveTotalMinutes').value = (480 * 12);
      }else if(leaveCreditType === "None"){
        document.getElementById('leaveTotalMinutes').value = 0;
      }else{
        document.getElementById('leaveTotalMinutes').value = (parseInt(totalMinutes));
      }
    }
} 


function selectedLeaveCreditTypeChange()  
  {        
    let attendanceType = $("#attendanceTypeSelector").val();    
    let leaveCreditType = $("#leaveCreditSelector").val();
    let totalMinutes = $("#totalMinutes").val();
    if(attendanceType === "Tracker") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) - 60);
    if(attendanceType === "Client Tracker") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) - 60);
    if(attendanceType === "Card") document.getElementById('totalMinutes').value = (parseInt(totalMinutes) + 60); 
    
    totalMinutes = $("#totalMinutes").val();

    if(totalMinutes > 0){              
      if(leaveCreditType === "Yearly" && attendanceType === "Card"){        
        document.getElementById('leaveTotalMinutes').value = (parseInt(totalMinutes) * 12);
      }else if(leaveCreditType === "Yearly" && attendanceType === "Tracker"){       
        document.getElementById('leaveTotalMinutes').value = (480 * 12);
      }else if(leaveCreditType === "Yearly" && attendanceType === "Client Tracker"){       
        document.getElementById('leaveTotalMinutes').value = (480 * 12);
      }else{
        document.getElementById('leaveTotalMinutes').value = (parseInt(totalMinutes));
      }
    }
}


function selectedLeaveCreditTypeUpdate()  
  {            
    let attendanceType = $("#attendanceType").val();    
    var leaveCreditType = $("#leaveCreditSelector").val();
     
    attendanceType = attendanceType.trim();
    leaveCreditType = leaveCreditType.trim();
    
    var totalMinutes = $("#totalMinutes").val();
    if(totalMinutes >= 0){              
      if(leaveCreditType === "Yearly" && attendanceType === "Card"){        
        document.getElementById('leaveTotalMinutes').value = (parseInt(totalMinutes) * 12);
      }else if(leaveCreditType === "Yearly" && attendanceType === "Tracker"){       
        document.getElementById('leaveTotalMinutes').value = (480 * 12);
      }else if(leaveCreditType === "Yearly" && attendanceType === "Client Tracker"){       
        document.getElementById('leaveTotalMinutes').value = (480 * 12);
      }else{
        document.getElementById('leaveTotalMinutes').value = (parseInt(totalMinutes));
      }
    }
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
  function loadAttMonthYear(year){
    var y=year.value;
    document.location.href = `/admin/attendance/settings/`+'?select='+y;
  } 


  