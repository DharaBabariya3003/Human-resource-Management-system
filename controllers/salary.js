const USER = require("../models/user");
const ATTENDANCE = require("../models/attendance");
const HOLIDAY = require("../models/holiday");
const LEAVECREDIT = require("../models/leaveCredit");
const PAYROLL = require("../models/payroll");
const momentWeek = require('moment-weekdaysin');

const moment = require("moment");
const {
  setPayroll,
  getPayroll,
  decryptPayroll,
  encryptPayroll,
} = require("../middlewares/payrollHandler");



exports.getSalary = async (req, res, next) => {
  try {
    let code="606d9fda4c984225a86ab80f";
    let startDate="2021-04-01";
    let endDate="2021-04-14";
    let now = new Date(endDate);
    let totalMinutes = 0;
    let totalOvertimeMinutes = 0;
    let leave=0;
    let leaveDates=[];
    let d = new Date(startDate);
    let salary ;        
    let daySalary;
    let hourSalary;
    let minuteSalary;
    let totalSalary;
    while( d <= now){
      let attOne = await ATTENDANCE.findOne({ user: code ,date:d.toDateString()});
      if(attOne){
        let totalTime=attOne.totalTime;
        if(!totalTime){
          totalTime = "0:0";
        }
        let totalTimeArray=totalTime.split(":")
        totalMinutes =totalMinutes+ (+totalTimeArray[0]) * 60 + (+totalTimeArray[1]);
        
        if(attOne.overTime && attOne.overtimeCheckout)
          totalMinutes = totalMinutes +  attOne.overTime;
          totalOvertimeMinutes = totalOvertimeMinutes +  attOne.overTime;
      }
      else{
        let day = d.getDate();
        let m = d.getMonth() + 1;
        if (m < 10) m = "0" + m;
        if (day < 10) day = "0" + day;
        let y = d.getFullYear();
        let yf = day + "/" + m + "/" + y;
     
        let newDate=y+"-"+m+"-"+day;       
        if (!(moment(newDate).weekday() == 0)) {          
          let holiday = await HOLIDAY.findOne({ holidayDate: yf, status:0 });
          if (!holiday) {                        
            leaveDates.push(newDate);
            leave++;                       
          }
        }
      }
      d.setDate(d.getDate() + 1);
    }
   

    let payroll = await PAYROLL.findOne({ user: code});
    
    if(!payroll){
      console.log("payroll is not added");
    }else{      
      //payroll = JSON.parse(JSON.stringify(payroll));
      // decryptPayroll(payroll, payroll.iv);
      salary=payroll.salary;          
    }

    let startMonth = moment(startDate).format('MMM');
    let endMonth = moment(endDate).format('MMM');
     
    if(startMonth == endMonth){      
      let format = moment(endDate).format('YYYY-MM');
      let totalDays = moment(format, "YYYY-MM").daysInMonth()       
      let weekend = momentWeek(endDate).weekdaysInMonth('Sunday');
      totalDays = totalDays - weekend.length;      

      daySalary = salary / totalDays;
      hourSalary = daySalary / 9;
      minuteSalary = hourSalary / 60;
      totalSalary =  Math.round(totalMinutes * minuteSalary);
    }

    else{
      console.log("not same");
    }

    return res.json({notes: "ok done getSalary"})
  } catch (error) {
    next(error);
  }
};


