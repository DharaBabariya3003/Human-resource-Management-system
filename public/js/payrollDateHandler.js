function myEndDate() {
  let date = document.getElementById("myTrainingdate").value;
  let nxdate = new Date(new Date(date).valueOf() + 1 * 24 * 60 * 60 * 1000);
  let joindate = convert(nxdate);
  document.getElementById("myJoinDate").value = joindate;
  let bond = document.getElementById("bondDuration").value;
  if(!bond){ bond = 1; }
  if(parseInt(bond) != 0){
    futureMonth = moment(joindate).add((bond-1), 'months').format("YYYY-MM-DD");
    futureMonth = new moment(futureMonth).endOf("month").format("YYYY-MM-DD");
    document.getElementById("myBondComplete").value = futureMonth;
  }
}
function convert(str) {
  let date = new Date(str),
  mnth = ("0" + (date.getMonth() + 1)).slice(-2),
  day = ("0" + date.getDate()).slice(-2);
  return [date.getFullYear(), mnth, day].join("-");
}

function myBondChange(e) {
  let mon = e.target.value;
  let date = document.getElementById("myTrainingdate").value;
  if (date) {
    myEndDate();
  } else {
    let joindate = document.getElementById("myJoinDate").value;
    if (joindate) {
      let bond = document.getElementById("bondDuration").value;
      if(!bond){ bond = 1; }
      if(parseInt(bond) != 0){
        futureMonth = moment(joindate).add((bond-1), 'months').format("YYYY-MM-DD");
        futureMonth = new moment(futureMonth).endOf("month").format("YYYY-MM-DD");
        document.getElementById("myBondComplete").value = futureMonth;
      }
    }
  }
}
function myJoinDatecal(e) {
  let joindate = document.getElementById("myJoinDate").value;
  if (joindate) {
    let bond = document.getElementById("bondDuration").value;
    if(!bond){ bond = 1; }
    if(parseInt(bond) != 0){
      futureMonth = moment(joindate).add((bond-1), 'months').format("YYYY-MM-DD");
      futureMonth = new moment(futureMonth).endOf("month").format("YYYY-MM-DD");
      document.getElementById("myBondComplete").value = futureMonth;
    }
  }
}

function noticePeriodChange() {
    let resignDate = document.getElementById("resignDate").value;  
    resignDate = new Date(resignDate);
    let noticePeriod = document.getElementById('noticePeriod').value;
    if(!noticePeriod){
      noticePeriod = 1;
    }
    let nextDate = moment(resignDate).add((noticePeriod-1), 'months').format('YYYY-MM-DD');
    nextDate = new moment(nextDate).endOf("month").format("YYYY-MM-DD");
    document.getElementById("resignLastDate").value = nextDate;    
}
function trainingPeriodChange(e) {
  let trainingStartDateID = document.getElementById("trainingStartDateID").value;  
  trainingStartDateID = new Date(trainingStartDateID);
  let monthPeriod = e.target.value;
  nextDate = moment(trainingStartDateID).add((monthPeriod-1), 'months').format('YYYY-MM-DD');
  nextDate = new moment(nextDate).endOf("month").format("YYYY-MM-DD");
  document.getElementById("myTrainingdate").value = nextDate;
  myEndDate();
}
function trainingStartDateFunc(e) {
  let trainingStartDateID = document.getElementById("trainingStartDateID").value;  
  trainingStartDateID = new Date(trainingStartDateID);
  let monthPeriod = document.getElementById("trainingDurationID").value;  
  if(!monthPeriod){
    monthPeriod = 1;
  }
  let nextDate = moment(trainingStartDateID).add((monthPeriod-1), 'months').format('YYYY-MM-DD');
  nextDate = new moment(nextDate).endOf("month").format("YYYY-MM-DD");
  document.getElementById("myTrainingdate").value = nextDate;
  myEndDate();
}

function removePayrollDate(){
  $("#trainingStartDateID").val("");
  $("#myTrainingdate").val("");
  $("#trainingDurationID").val("");

  $("#myJoinDate").val("");
  $("#bondDuration").val("");
  $("#myBondComplete").val("");
}