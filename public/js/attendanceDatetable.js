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
  let localH = (localHours);
  let localM = (localMinutes);
  
  let localHnM = localH+":"+localM ;	
  return localHnM ;
}
function interviewTimeToHours(e) { 
  let hours,minutes;
  let time = e.split(':');
  let formattedTime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
  formattedTime = formattedTime.split(":");
  hours = format_two_digits(parseInt(formattedTime[0]));
  let hourAndDayStatus = formattedTime[1].split(" ");
  minutes = format_two_digits(parseInt(hourAndDayStatus[0]));
  return hours+":"+minutes+" "+hourAndDayStatus[1];
}
function getTimeDiff(startTime,endTime){
  let entryTime = moment.duration(startTime, "HH:mm ");
  let exitTime = moment.duration(endTime, "HH:mm ");
  let diff = exitTime.subtract(entryTime);
  const diffH = format_two_digits(diff.hours());
  const diffM = format_two_digits(diff.minutes());
  const workingHours = diffH + ":" + diffM;
  return workingHours ;
}
function getTimeDiffTotalMinutes(startTime,endTime){
  let workingHours;
  let entryTime = moment.duration(startTime, "HH:mm ");
  let exitTime = moment.duration(endTime, "HH:mm ");
  let diff = exitTime.subtract(entryTime);
  let diffH = diff.hours();
  let diffM = diff.minutes();
  console.log(diffH+" "+diffM);
  if(diffH<0 || diffM<0){
    workingHours = "-";
  }else{
    diffH = format_two_digits(diff.hours());
    diffM = format_two_digits(diff.minutes());
    workingHours = diffH + ":" + diffM;
  }
  return workingHours ;
}