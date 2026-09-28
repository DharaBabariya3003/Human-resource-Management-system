function format_two_digits(n) {
  return n < 10 ? '0' + n : n;
}

function getUtcHnM (currentUTCTime){
  let utcHours = new Date(currentUTCTime).getUTCHours();
  let utcMinutes = new Date(currentUTCTime).getUTCMinutes();

  const utcH = format_two_digits(utcHours);
  const utcM = format_two_digits(utcMinutes);

  const utcHnM = utcH+":"+utcM ;
  return utcHnM ;
}
function getLocalTime(dateAndTime) {
  let localTime = moment.utc(dateAndTime).local().format(); 
  let localHours = new Date(localTime).getHours();
  let localMinutes = new Date(localTime).getMinutes();
  let localH = format_two_digits(localHours);
  let localM = format_two_digits(localMinutes);
  
  let localHnM = localH+":"+localM ;	
  return localHnM ;
}
function format(attendancelogs,date) {
  let a = 0;
  let j = 0;
  let start = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;background-color:#f6f8fe;width: 100%;font-size:13px">';
  let end = '</table>' ;
  let flag = 0; 
  for(i = 0; i < attendancelogs.length; i++){  
    let logDate = new Date(attendancelogs[i].createdAt).toDateString();
    if(logDate.trim() === date.trim()){
      let st = moment.duration(getUtcHnM(attendancelogs[i].startTime), "HH:mm ");
      let et = moment.duration(getUtcHnM(attendancelogs[i].endTime), "HH:mm ");
      let diff = et.subtract(st);
      let diffH = diff.hours(); 
      let diffM = diff.minutes();        
      let totalTime = "-";    
      let printEndTime = '-';
      let lateReason ="-";      
      let leaveReason="-";
      let overtimeReason="-";
      let updateReson ="-";
      if(attendancelogs[i].updateRecord[0]){
        updateReson = attendancelogs[i].updateRecord[0].updateReason;
        for(let j = 1;j < attendancelogs[i].updateRecord.length ;j++)
        {
          updateReson = updateReson +"<br>"+ attendancelogs[i].updateRecord[j].updateReason;
        }      
      }
      if(attendancelogs[i].lateReason){
        lateReason = attendancelogs[i].lateReason;
      }
      if(attendancelogs[i].leaveReason){
        leaveReason = attendancelogs[i].leaveReason;
      }
      if(attendancelogs[i].overtimeReason){
        overtimeReason = attendancelogs[i].overtimeReason;
      }
      if(attendancelogs[i].endTime) {
        printEndTime = interviewTimeToHours(getLocalTime(attendancelogs[i].endTime));
        totalTime =  diffH + ":" + diffM;    
      }
      if(flag == 0){
        a = 
        `<tr>
            <th><strong>Sr No.</strong></th>
            <th><strong>In Time</strong></th>
            <th><strong>Out Time</strong></th>
            <th><strong>Total Time</strong></th>
            <th><strong>Late Reason</strong></th>
            <th><strong>Leave Reason</strong></th>
            <th><strong>Overtime Reason</strong></th>
            <th><strong>Updated Reason</strong></th>
            <th><strong>Action</strong></th>
        </tr>   
        <tr style="border-bottom:2px solid gray">
            <td><strong>${(j=j+1)}</strong></td>
            <td>${interviewTimeToHours(getLocalTime(attendancelogs[i].startTime))}</td>
            <td>${printEndTime}</td>
            <td>${totalTime}</td>
            <td>${lateReason}</td>
            <td>${leaveReason}</td> 
            <td>${overtimeReason}</td>
            <td>${updateReson}</td>
            <td> <button type="button" onclick='attendanceDateHandlerEmployeeShowupdate(${JSON.stringify(attendancelogs[i]._id)})' class="btn btn-outline-success" data-toggle="tooltip" title="Edit" style="border-radius: 0%;" data-id=id><i class="fas fa-edit"></i></button> </td> 
        </tr>`
        
        flag = 1;      
      }else{
        a = a +
        `<tr style="border-bottom:2px solid gray">
            <td><strong>${(j=j+1)}</strong></td>
            <td>${interviewTimeToHours(getLocalTime(attendancelogs[i].startTime))}</td>
            <td>${printEndTime}</td>
            <td>${totalTime}</td>
            <td>${lateReason}</td>
            <td>${leaveReason}</td> 
            <td>${overtimeReason}</td>
            <td>${updateReson}</td>
            <td> <button type="button" onclick='attendanceDateHandlerEmployeeShowupdate(${JSON.stringify(attendancelogs[i]._id)})' class="btn btn-outline-success" data-toggle="tooltip" title="Edit" style="border-radius: 0%;" data-id=id><i class="fas fa-edit"></i></button> </td> 
        </tr>`
      }                   
    }
  }
  if(a == 0) return start + "<h6><strong>No logs found...</strong></h6>" + end;
  let finalTable = start + a + end;
  return finalTable;
}
function interviewTimeToHours(e) { 
  let time = e.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  return thistime;
}
