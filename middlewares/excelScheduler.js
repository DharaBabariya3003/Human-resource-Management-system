const cron = require("node-cron");
const moment = require("moment");
const PAYROLL = require("../models/payroll");
const ATTENDANCE = require("../models/attendance");
const HOLIDAY = require("../models/holiday"); 
const USER = require("../models/user");
const SALARY = require("../models/payslip");
const momentWeek = require("moment-weekdaysin");
  
exports.scheduler = cron.schedule("59 59 7 1 * *", async () => {    
    let currentDate = new Date();
    let month = moment(currentDate).subtract(1, "months").format("MMM");
    let year = moment(currentDate).subtract(1, "months").format("YYYY");
    let monthformat = moment(currentDate).subtract(1, "months").format("YYYY-MM");
    
    const employees = await USER.find(
      { isDeleted: false, isLeft: false },
      "-__v -isDeleted -isLeft -createdAt -updatedAt -deletedAt -deletedBy"
    );

    for(let i = 1; i < employees.length; i++)
    {
      let attendanceType = employees[i].attendanceType;
      let minuteBaseonAttendance;
      let hoursBaseonAttendance;
      
      minuteBaseonAttendance = parseInt(employees[i].totalMinutes);
      hoursBaseonAttendance = minuteBaseonAttendance/60;      
      
      let _id = employees[i]._id;
      let payrollS = await PAYROLL.findOne({ user: _id ,isDeleted :false});
      let salary = 0;
      if (!payrollS) {
        
      } else {
        payrollS = JSON.parse(JSON.stringify(payrollS));        
        salary = payrollS.salary;
      }
      if(payrollS){
        let startDate = moment(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)).subtract(1, "months").format("MM/DD/YYYY");
        let endDate = moment(new Date(startDate)).clone().endOf("month").format("MM/DD/YYYY");

        let chooseAttendanceData = await ATTENDANCE.find({ user: _id });    
        
        let code = _id;
        let now = new Date(endDate);
        let totalMinutes = 0;
        let tempMinutes = 0;
        let totalOvertimeMinutes = 0;
        let leave = 0;
        let leaveDates = [];
        let dd = new Date(startDate);
        let totalPresentDays = 0;
        let daySalary;
        let hourSalary;
        let minuteSalary;
        let totalSalary = 0;
        let totalDays;
        let leaveEncashment = 0;
        let overtimeAllowance = 0;
        let leaveDeduction = 0;
        let totalWorkingHours = 0;
        let halfLeaveMinute = 0;  
        let holidayEncashment = 0;
        let leaveCreditType = employees[i].leaveCreditType;         
        let updatedYearlyLeaveCredit = 0;        
        let addLeaveCredit = 0;
        let yearlyLeaveCreditMinute = employees[i].leaveTotalMinutes;
        let backupLeaveCreditMinute = employees[i].backupLeaveTotalMinutes;
        while (dd <= now) {
          let attOne = await ATTENDANCE.findOne({user: code,date: dd.toDateString(),});
          if (attOne) {

            let isHoliday = true;
            //if Working on holiday than doesn't count it working minute
            let day = dd.getDate();
            let m = dd.getMonth() + 1;
            if (m < 10) m = "0" + m;
            if (day < 10) day = "0" + day;
            let y = dd.getFullYear();
            let yf = day + "/" + m + "/" + y;
            
            let holiday = await HOLIDAY.findOne({ holidayDate: yf,status:0 });
            if (holiday) {                              
              tempMinutes = minuteBaseonAttendance;
              isHoliday = false;
            }            
            else{              
              totalPresentDays = totalPresentDays + 1;
              let totalTime = attOne.totalTime;
              let totalTimeArray = totalTime.split(":");
              totalMinutes = totalMinutes + +totalTimeArray[0] * 60 + +totalTimeArray[1];
              tempMinutes = +totalTimeArray[0] * 60 + +totalTimeArray[1];
            }
                        
            // if bigdesk through then check limit from 540 to 555 and set it to 540                      
            if((tempMinutes > minuteBaseonAttendance) && (tempMinutes <= (parseInt(employees[i].overTimeMinute) + minuteBaseonAttendance)) && (attendanceType == "Tracker") && isHoliday){
              let subtractOverMinute = tempMinutes - minuteBaseonAttendance;
              totalMinutes = totalMinutes - subtractOverMinute;
              tempMinutes = tempMinutes - subtractOverMinute;              
            }

            if (attOne.overTime && !attOne.overtimeCheckout && isHoliday) {
              totalMinutes = totalMinutes - attOne.overTime;
              tempMinutes = tempMinutes - attOne.overTime;
            }
            if (attOne.overTime && attOne.overtimeCheckout && isHoliday) {
              tempMinutes = tempMinutes - attOne.overTime;
              totalOvertimeMinutes = totalOvertimeMinutes + attOne.overTime;
            }
            if (tempMinutes < minuteBaseonAttendance) {
              halfLeaveMinute = halfLeaveMinute + (minuteBaseonAttendance - tempMinutes);
            }

            let format = moment(dd).format("YYYY-MM");
            totalDays = moment(format, "YYYY-MM").daysInMonth();
            let weekend = momentWeek(dd).weekdaysInMonth("Sunday");
            totalDays = totalDays - weekend.length;

            daySalary = salary / totalDays;
            hourSalary = daySalary / hoursBaseonAttendance;
            minuteSalary = hourSalary / 60;
            totalSalary = totalSalary + tempMinutes * minuteSalary;

          } else {
            //Check for leave
            let day = dd.getDate();
            let m = dd.getMonth() + 1;
            if (m < 10) m = "0" + m;
            if (day < 10) day = "0" + day;
            let y = dd.getFullYear();
            let yf = day + "/" + m + "/" + y;
            let newDate = y + "-" + m + "-" + day;

            if (!(moment(newDate).format("dddd") == "Sunday")) {
              let holiday = await HOLIDAY.findOne({ holidayDate: yf,status:0 });
              if (!holiday) {                
                leaveDates.push(newDate);
                leave++;
              }else{                
                holidayEncashment = holidayEncashment + minuteBaseonAttendance;
              }
            }
          }
          dd.setDate(dd.getDate() + 1);
        }
        let noLeaveAndHalfLeave = 0;
        if(totalPresentDays > 0){  
          totalWorkingHours = Math.floor(totalMinutes / 60);
          let remainingMinutes = totalMinutes % 60;
          totalWorkingHours = totalWorkingHours + ":" + remainingMinutes;
        
          let totalLeaveMinute = 0;
          if(leaveCreditType === "Monthly"){
            if (leaveDates.length == 0) {
              if(halfLeaveMinute == 0) leaveEncashment = Math.round(minuteBaseonAttendance * minuteSalary);
              else if(halfLeaveMinute < minuteBaseonAttendance){
                let leaveEncashmentMinute = minuteBaseonAttendance - halfLeaveMinute;
                leaveEncashment = Math.round(leaveEncashmentMinute * minuteSalary);
              }else{
                noLeaveAndHalfLeave = halfLeaveMinute - minuteBaseonAttendance ;
              }
            }
            let halfLeaveCal = halfLeaveMinute;
            if(leaveDates.length == 0 && halfLeaveMinute <= minuteBaseonAttendance){
              halfLeaveCal = 0;
            }else if(leaveDates.length == 0 && halfLeaveMinute > minuteBaseonAttendance){
              halfLeaveCal = noLeaveAndHalfLeave;
            }

            totalLeaveMinute = leaveDates.length * hoursBaseonAttendance * 60 + halfLeaveCal;
            leaveDeduction = Math.round(totalLeaveMinute * minuteSalary);
          }else{
            totalLeaveMinute = leaveDates.length * hoursBaseonAttendance * 60 + halfLeaveMinute;   
            
            let month = new Date().getMonth();        
            if(month == 11) {
              if(totalLeaveMinute <= parseInt(backupLeaveCreditMinute)) {          
                leaveDeduction = 0;
                backupLeaveCreditMinute = backupLeaveCreditMinute - totalLeaveMinute;
                let userUpdatedLeaveCredit = await USER.findOneAndUpdate(
                  { _id: code },
                  { $set: { backupLeaveTotalMinutes:  backupLeaveCreditMinute} },
                  { new: true }
                );          
                updatedYearlyLeaveCredit =  backupLeaveCreditMinute;
                addLeaveCredit = Math.round(totalLeaveMinute * minuteSalary);               
                addLeaveCredit = addLeaveCredit + Math.round(backupLeaveTotalMinutes * minuteSalary);
                
              }
              else if((totalLeaveMinute > 0) && (parseInt(backupLeaveCreditMinute) != 0)){
                let remainingLeaveMinute = totalLeaveMinute - (parseInt(backupLeaveCreditMinute));
                leaveDeduction = Math.round(remainingLeaveMinute * minuteSalary);
                addLeaveCredit = Math.round((parseInt(backupLeaveCreditMinute)) * minuteSalary);          
                let userUpdatedLeaveCredit = await USER.findOneAndUpdate(
                  { _id: code },
                  { $set: { backupLeaveTotalMinutes:  "0"} },
                  { new: true }
                );       
                updatedYearlyLeaveCredit =  userUpdatedLeaveCredit.backupLeaveTotalMinutes;
              }else{
                leaveDeduction = Math.round(totalLeaveMinute * minuteSalary);
              }
            }else{
              if(totalLeaveMinute <= parseInt(yearlyLeaveCreditMinute)) {          
                leaveDeduction = 0;
                yearlyLeaveCreditMinute = yearlyLeaveCreditMinute - totalLeaveMinute;
                let userUpdatedLeaveCredit = await USER.findOneAndUpdate(
                  { _id: code },
                  { $set: { leaveTotalMinutes:  yearlyLeaveCreditMinute , backupLeaveTotalMinutes: yearlyLeaveCreditMinute} },
                  { new: true }
                );          
                updatedYearlyLeaveCredit =  userUpdatedLeaveCredit.leaveTotalMinutes;
                addLeaveCredit = Math.round(totalLeaveMinute * minuteSalary);                
              }
              else if((totalLeaveMinute > 0) && (parseInt(yearlyLeaveCreditMinute) != 0)){
                let remainingLeaveMinute = totalLeaveMinute - (parseInt(yearlyLeaveCreditMinute));
                leaveDeduction = Math.round(remainingLeaveMinute * minuteSalary);
                addLeaveCredit = Math.round((parseInt(yearlyLeaveCreditMinute)) * minuteSalary);          
                let userUpdatedLeaveCredit = await USER.findOneAndUpdate(
                  { _id: code },
                  { $set: { leaveTotalMinutes:  "0", backupLeaveTotalMinutes: "0"} },
                  { new: true }
                );       
                updatedYearlyLeaveCredit =  userUpdatedLeaveCredit.leaveTotalMinutes;
              }else{
                leaveDeduction = Math.round(totalLeaveMinute * minuteSalary);
              }
            }
            leaveEncashment = addLeaveCredit;
          }

          overtimeAllowance = Math.round(totalOvertimeMinutes * minuteSalary);
          holidayEncashment = Math.round(holidayEncashment * minuteSalary);             
          let netAmount = Math.round( totalSalary + leaveEncashment + overtimeAllowance + holidayEncashment);
          
          const user = await USER.findOne({ _id: _id}); 
          payload = {};
          payload.totalWorkingDays = totalDays;
          payload.totalPresentDays = totalPresentDays;
          payload.totalLeaves = leaveDates.length;
          payload.totalOvertimeMinutes = totalOvertimeMinutes;
          payload.totalWorkingHours = totalWorkingHours;
          payload.totalHalfLeaveMinute = halfLeaveMinute;
          payload.basicPay = salary;
          payload.leaveEncashment = leaveEncashment;
          payload.remainingYearLeaveCreditMinute = updatedYearlyLeaveCredit;
          payload.overtimeAllowance = overtimeAllowance;
          payload.specialAllowance = "0";
          payload.bonus = "0";
          payload.petrolAllowance = "0";
          payload.shift = "0";
          payload.professionalTax ="0";
          payload.leaveDeduction = leaveDeduction;
          payload.securityDeposit = "0";
          payload.tds = "0";
          payload.pf = "0";
          payload.esic = "0";
          payload.netAmount = netAmount;
          payload.totalLeaveMinute = totalLeaveMinute;
          payload.payDate = moment(new Date(), "DD-MM-YYYY").add(5, 'days').format("YYYY-MM-DD");                            
          payload.user = _id;
          payload.month = month;
          payload.year = year;
          payload.attendanceCode = user.attendanceCode;
          payload.bankAccountNumber = user.accountNumber;
          payload.ifscCode = user.ifscCode;
          payload.employeeName = user.firstName+" "+user.middleName+" "+user.lastName;    
          payload.isEdit = true;    
          if(totalPresentDays > 0){    
            const salary = await SALARY.create(payload);    
          } 
        }
      }
    }
    
});