$(document).ready(function () {
  var startTime = $("#profile_OfficeEntryTime_Id").text();
  var endTime = $("#profile_officeEndTime_Id").text();
  var lateReason = $("#profile_lateReasonMinute_Id").text();

  if(startTime || endTime || lateReason){
  document.getElementById('profile_OfficeEntryTime_Id').textContent = interviewTimeToHours(getLocalTime(startTime));
  document.getElementById('profile_officeEndTime_Id').textContent = interviewTimeToHours(getLocalTime(endTime));
  document.getElementById('profile_lateReasonMinute_Id').textContent = interviewTimeToHours(getLocalTime(lateReason));
  }
});
function getLocalTime(dateAndTime) {
  let localTime = moment.utc(dateAndTime).local().format(); 
  let localHours = new Date(localTime).getHours();
  let localMinutes = new Date(localTime).getMinutes();
  let localH = format_two_digits(localHours); 
  let localM = format_two_digits(localMinutes);
              
  let localHnM = localH+":"+localM ;	
  return localHnM ;
}
function format_two_digits(n) {
  return n < 10 ? '0' + n : n;
}
function interviewTimeToHours(e) { 
  let time = e.split(':');// here the time is like "16:14"
  let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  return thistime;
}