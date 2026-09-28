window.onload = function(){
  let startTime = document.getElementById("officeStartTime").value;
  let endTime = document.getElementById("officeEndTime").value; 
  let leaveReason = document.getElementById("lateEntryReason").value; 
  
  document.getElementById("officeStartTime").value = getLocalTime(startTime);
  document.getElementById("officeEndTime").value = getLocalTime(endTime);
  document.getElementById("lateEntryReason").value = getLocalTime(leaveReason);
}

function interviewTimeToHours(e) { 
  let time = e.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  return thistime;
}
function format_two_digits(n) {
  return n < 10 ? '0' + n : n;
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








