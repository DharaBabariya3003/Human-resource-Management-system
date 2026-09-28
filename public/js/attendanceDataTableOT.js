function interviewTimeToHours(e) { 
    let time = e.split(':');// here the time is like "16:14"
    let thistime =time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
    return thistime;
  }