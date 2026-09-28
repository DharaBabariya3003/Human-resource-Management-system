window.onload = function(){

  let error = document.getElementById("errorStatus").value;
  if(error == "true"){
    toastr.error("Invalid time selected!");    
  }
  let hrStatuserror = document.getElementById("hrStatus").value;
  if(hrStatuserror == "true"){
    toastr.error("HR can not update attendance of themself");    
  }

  let a = document.getElementById("updatedStartTime").value;
  let b = document.getElementById("updatedEndTime").value; 
  document.getElementById("updatedStartTime").value = getLocalTime(a);
  if(b){    
    document.getElementById("updatedEndTime").value = getLocalTime(b);
  }else{
    document.getElementById("updatedEndTime").value = "";
  }
  
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
function format_two_digits(n) {
  return n < 10 ? '0' + n : n;
}
function inButton() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  m = checkTime(m);
  document.getElementById("intimeLabel").innerHTML = h + ":" + m;
  document.getElementById("intimeButton").disabled = true;
  var st = document.getElementById("intimeLabel").textContent;
  document.location.href =`/dashboard/attendance/starttime` + "?starttime=" + st;
}