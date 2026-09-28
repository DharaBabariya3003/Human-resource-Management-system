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



$(document).ready(function () {
  var val1 = $("#profile_OfficeEntryTime_Id").text();
  var val2 = $("#profile_officeEndTime_Id").text();
  var val3 = $("#profile_lateReasonMinute_Id").text();

  
  var updateVal1 = document.getElementById('officeStartTime').value ;
  var updateVal2 = document.getElementById('officeEndTime').value ;
  var updateVal3 = document.getElementById('lateEntryTime').value ;

  if(updateVal1 || updateVal2 || updateVal3){
  document.getElementById('officeStartTime').value = (getLocalTime(updateVal1));
  document.getElementById('officeEndTime').value = (getLocalTime(updateVal2));
  document.getElementById('lateEntryTime').value = (getLocalTime(updateVal3));
  }
  
  if(val1 || val2 || val3){
  document.getElementById('profile_OfficeEntryTime_Id').textContent = interviewTimeToHours(getLocalTime(val1));
  document.getElementById('profile_officeEndTime_Id').textContent = interviewTimeToHours(getLocalTime(val2));
  document.getElementById('profile_lateReasonMinute_Id').textContent = interviewTimeToHours(getLocalTime(val3));
  }
});
