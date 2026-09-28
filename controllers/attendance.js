const APIError = require("../utils/APIError");
const ATTENDANCE = require("../models/attendance");
const ATTENDANCESETTINGS = require("../models/attendanceSetting");
const USER = require("../models/user");
const ROLE = require("../models/role");
const HOLIDAY = require("../models/holiday");
const LEAVECREDIT = require("../models/leaveCredit");
const PAYROLL = require("../models/payroll");
const SALARY = require("../models/payslip");
const ATTENDANCELOGS = require("../models/attendanceLogs");
const ATTENDANCECAPTURE = require("../models/attendanceCapture");
const momentWeek = require('moment-weekdaysin');
const moment = require("moment");
const momentTimezone = require("moment-timezone");  
const {  
  decryptPayroll, 
} = require("../middlewares/payrollHandler");
const axios = require('axios').default;
const { baseUrl } = require("../config");
const attendanceLogs = require("../models/attendanceLogs");
const { uploadFile, deleteFile, getSignedURL } = require("../services/s3");
const {
  validateAttendance,
} = require("../validations/attendance");
const DATATABLEWEB = require('../utils/dataTable');
const { getHolidays,getSundays,getSundaysForSalary,getAllHolidayDates } = require("../utils/getAllHolidays");
const INCREMENT = require("../models/increment");
const { getDateRangeSalaryInfo } = require("../utils/salary");

function format_two_digits(n) {
  return n < 10 ? '0' + n : n;
}

const getUtcHnM = (currentUTCTime)=>{
  let utcHours = new Date(currentUTCTime).getUTCHours();
  let utcMinutes = new Date(currentUTCTime).getUTCMinutes();

  const utcH = format_two_digits(utcHours);
  const utcM = format_two_digits(utcMinutes);

  const utcHnM = utcH+":"+utcM ;
  return utcHnM ;
}

exports.show = async (req, res, next) => {
  try {
    let today = new Date();
    let n = today.toDateString();
    const id = req.session.user._id;
    const attendance = await ATTENDANCE.findOne({ user: id, date: n });
    return res.sendRender("employee/attendance", null, null, attendance);
  } catch (error) {
    next(error);
  }
};

const getUserAttendanceInformation = async (id,currentDate,employeeJoiningDate,payrollJoiningDate)=>{
  try{
  if(payrollJoiningDate){
    if((moment(currentDate).isSame((moment(new Date(employeeJoiningDate)).format("YYYY-MM"))))){
      employeeJoiningDate = payrollJoiningDate;
    }
  }
  
  let lastDateMonth;
  let overtime = 0,deductedMinutes = 0, fullDayLeave = 0, presentDay = 0;
  const startOfMonth = currentDate+'-01';

  const startDate = moment(startOfMonth).startOf('day').toDate();
  if((moment().format("YYYY-MM").toString()) == currentDate.toString()){
    lastDateMonth = moment().subtract(1, 'day').format("YYYY-MM-DD");
  }else{  
    lastDateMonth = moment(currentDate+"-01").endOf("month").format("YYYY-MM-DD");
  }

  const endDate = moment(lastDateMonth).endOf('day').toDate();

  // Get all Sundays
  let month_sundays = await getSundays(currentDate);
  
  // Get all holidays
  let month_holidays = await getHolidays(currentDate);
  employeeJoiningDate = (moment(new Date(employeeJoiningDate)).format("YYYY-MM-DD"));
  let afterJoiningDateHolidays = [];
  month_holidays.map(holidayDate =>{
    if((moment(new Date(holidayDate)).isSame(new Date(employeeJoiningDate)) || (moment(new Date(holidayDate)).isAfter(new Date(employeeJoiningDate))))){
      afterJoiningDateHolidays.push(holidayDate);
    }
  })  
    
  month_holidays = afterJoiningDateHolidays;


  let allHolidays = [...month_sundays,...month_holidays];
  
  const formatEmployeeJoiningDate = moment(employeeJoiningDate).format("YYYY-MM");
  if((moment(new Date(currentDate)).isSame(new Date(formatEmployeeJoiningDate)) || (moment(new Date(currentDate)).isAfter(new Date(formatEmployeeJoiningDate))))){
    while (startDate <= endDate) {
      let monthDate = startDate.toDateString();
      let attendance = await ATTENDANCE.findOne({ user: id, date: monthDate,isDeleted: false});
      let status = allHolidays.includes((moment(startDate).format("YYYY-MM-DD")).toString());
      if(attendance){
        // split totalTime by :
        let user_totalTime = attendance.totalTime.split(":");
        let store_user_minutes = parseInt(user_totalTime[0])*60+parseInt(user_totalTime[1]);

        if(status && attendance.overtimeCheckout && attendance.totalTime){
          // Add totalminutes of holiday into OT minutes.
          overtime = overtime + store_user_minutes;
        }else if((attendance.overtimeCheckout && attendance.overTime)){
          overtime = overtime + (store_user_minutes - parseInt(attendance.totalMinutes));
        }
        if(!status){
          presentDay = (presentDay + 1);
          if(store_user_minutes < parseInt(attendance.totalMinutes)){
            let halfDayMinutes = (parseInt(attendance.totalMinutes) - store_user_minutes);
            // Total half day minutes
            deductedMinutes = (deductedMinutes + halfDayMinutes);
          }
        }
      }else{
        if(!status){
          fullDayLeave = (fullDayLeave + 1);
        }
      }
      startDate.setDate(startDate.getDate() + 1);
    }
  }
  return {
    overtimeMinutes: overtime,
    halfDayMinutes: deductedMinutes,
    fullDayLeave: fullDayLeave,
    presentDay: presentDay
  }
  }catch(error){
    console.log(error);
  }
}


const splitcompletedHours = (completedHours)=>{
  let hoursAndMinutes = completedHours.split(":");
  let result;
  if(parseInt(hoursAndMinutes[0]) == 0){
    result = hoursAndMinutes[1]+" minutes "
  }else{
    if(hoursAndMinutes[1] == 0){
      result = hoursAndMinutes[0]+" hours ";
    }else{
    result = hoursAndMinutes[0]+" hours "+hoursAndMinutes[1]+" minutes ";
    }
  }
  return result +" early";
}

exports.leaveDetails = async (req, res, next) => {
  try {
    const _id = req.session.user._id;
    let leaveRecordOfUser = [];
    let selectedDate;
    if(req.query.selectedDate){
      selectedDate = req.query.selectedDate;
    }else{
      selectedDate = moment().format("YYYY-MM");
    }
    
   let employeeJoiningDate = moment(req.session.user.createdAt).format("YYYY-MM");

   if((moment(selectedDate).isSame(employeeJoiningDate)) || (moment(selectedDate).isAfter(employeeJoiningDate))){
    const start_of_month = moment(new Date(selectedDate)).format("YYYY-MM")+"-01";
    let last_dateMonth;

    if((moment().format("YYYY-MM").toString()) == selectedDate.toString()){
      // If month is current month then get up to todays date data
      last_dateMonth = moment().subtract(1, 'day').format("YYYY-MM-DD"); // get last date
    }else{  
      last_dateMonth = moment(start_of_month).endOf('month').format('YYYY-MM-DD');
    }
    
    const startDate = moment(start_of_month).startOf('day').toDate();
    const endDate = moment(last_dateMonth).endOf('day').toDate();

    // Get all Sundays
    let month_sundays = await getSundays(selectedDate);
    
    // Get all holidays
    let month_holidays = await getHolidays(selectedDate);
    let allHolidays = [...month_sundays,...month_holidays] 
    
    let leaveStatus;
    while (startDate <= endDate) {
      let monthDate = startDate.toDateString();
      let status = allHolidays.includes((moment(startDate).format("YYYY-MM-DD")).toString());
      if(!status){
        let attendance = await ATTENDANCE.findOne({ user: _id, date: monthDate,isDeleted: false});
        if(attendance){
          let splittedTime = attendance.totalTime.split(":");
          let hoursToMinutes = (parseInt(splittedTime[0])*60+parseInt(splittedTime[1]));
          // Check if total minutes is less than user minutes or not
          if(hoursToMinutes < parseInt(attendance.totalMinutes)){
            if(hoursToMinutes == 0 ){
              leaveStatus = {date:monthDate,leave:'Full Day',status:'-'}
              leaveRecordOfUser.push(leaveStatus);
            }else if(hoursToMinutes < parseInt(attendance.totalMinutes)){
              let earlyMinutes = (parseInt(attendance.totalMinutes) - hoursToMinutes);
              let earlyHours  = (Math.floor(earlyMinutes / 60) + ':' + earlyMinutes % 60);
              let earlyStatus = splitcompletedHours(earlyHours);
              leaveStatus = {date:monthDate,leave:'Half Day',status: earlyStatus};
              leaveRecordOfUser.push(leaveStatus);
            }
          }

        }else{
          leaveStatus = {date:monthDate,leave:'Full Day',status:'-'}
          leaveRecordOfUser.push(leaveStatus);
        }
      }
      startDate.setDate(startDate.getDate() + 1);
    }
  }
    return res.sendRender("employee/showLeaveDetails", null, null, {
      user: _id,
      attendanceMonth: selectedDate,
      currentMonth: moment().format("YYYY-MM"),
      sideTab: "userLeaveAttendenceDetail",
      leaveRecordOfUser: leaveRecordOfUser
    });
  } catch (error) {
    next(error);
  }
};
  
//Admin
exports.all = async (req, res, next) => {
  try {
    let currentDate;    
    let attendanceLogs;
    let attendanceLogCapture;

    currentDate = moment(new Date()).format("YYYY-MM-DD");
    
    if(req.query.selectedDate) currentDate = req.query.selectedDate;


		const startDate = moment.tz(`${currentDate} ${"00:00:59"}`, true, "Asia/Kolkata").format();
		const endDate = moment.tz(`${currentDate} ${"23:59:59"}`, true, "Asia/Kolkata").format();
    
    attendanceLogs = await ATTENDANCELOGS.find({ isDeleted:false,startTime:{ $gte :startDate ,$lte :endDate } });
    attendanceLogCapture = await ATTENDANCECAPTURE.find({ isS3Removed: false,isDeleted:false,startTime:{ $gte :startDate ,$lte :endDate } });  
    
    for(element of attendanceLogCapture){
      let originalFilePath = `users/${element.user}/attendance/original/${element.key}`;
      let attendanceCaptureURL = await getSignedURL(originalFilePath);
      element.key = attendanceCaptureURL.signedUrl;
    }
    
    // Get all holidays
    let monthHolidays = await getHolidays(currentDate);
    let isHoliday = monthHolidays.includes(currentDate.toString());

    return res.sendRender("admin/attendance", null, null, {
      attendanceDate: currentDate,
      attendanceLogs: JSON.stringify(attendanceLogs),
      attendanceLogCapture: JSON.stringify(attendanceLogCapture),
      moment: moment,  
      sideTab: "attendance",
      maxDateOfDatePicker: moment(new Date()).format("YYYY-MM-DD"),
      isHoliday: isHoliday,
    });
  } catch (error) {
    next(error);
  }
};

exports.showUpdate = async (req, res, next) => {
  try{
    
    const _id = req.params.id;    
    let attendance = await ATTENDANCELOGS.findOne({ _id:_id,isDeleted:false});
    attendance.sideTab = "attendance";    

    let selectedDate  = moment(attendance.startTime).format("YYYY-MM-DD"); 
    if(moment(attendance.startTime).isAfter(moment.tz(`${selectedDate} ${"23:59:59"}`, true, "Asia/Kolkata").format())){
      selectedDate = moment(new Date(selectedDate)).add(1, 'day').format("YYYY-MM-DD");
    }

    attendance.selectedDate = selectedDate;
    const user= await USER.findOne({_id: attendance.user, isDeleted: false });
    attendance.name = user.firstName + " " + user.middleName + " " +user.lastName;
    
    let st = moment.duration(getUtcHnM(attendance.startTime), "HH:mm ");
    let et = moment.duration(getUtcHnM(attendance.endTime), "HH:mm ");
    let diff = et.subtract(st);
    let diffH = diff.hours();
    let diffM = diff.minutes();        
    let totalTime = diffH + ":" + diffM;
    if(diffH < 0 || diffM < 0)  attendance.totalTime = "00:00"; 
    else attendance.totalTime = totalTime;
    
    if(req.query.error){
      attendance.error = true;
    }else{
      attendance.error = false;
    }
    if(req.query.hrStatus){
      attendance.hrStatus = true;
    }else{
      attendance.hrStatus = false;
    }
    attendance.moment = moment;
    return res.sendRender("admin/updateAttendance", null, null, attendance);
  }catch(error){
    console.log(error);
  }  
};


exports.update = async (req, res, next) => {
  try {
    
    const _id = req.params.id;
    const payload = req.body;
    let error = false;

    const todayDate = payload.selectedAttendanceDate;
    const sessionDate = moment(new Date(todayDate)).format("YYYY-MM-DD");
    const sessionPrevDate = moment(sessionDate).subtract(1, 'day').format("YYYY-MM-DD");
    

    const startTimeRange = `${sessionPrevDate}T18:29:59.000Z`;
    const endTimeRange = `${sessionDate}T18:29:59.000Z`;


    let attendancelog = await ATTENDANCELOGS.findOne({ _id:_id,isDeleted:false });
    
    const user = await USER.findOne({ _id: attendancelog.user, isDeleted: false, isLeft: false }).populate('role');
    let sessionId = req.session.user._id;
    const loginUser = await USER.findOne({ _id:sessionId, isDeleted: false }).populate('role');
    let loginUserRole = loginUser.role.name.trim()
    let addAttUserRole = user.role.name.trim();

    if(loginUserRole == 'HR' && addAttUserRole == 'HR'){
      return res.redirect("/admin/attendance/" + _id +"/edit?hrStatus=true");
    }

    
    const startDay = moment(attendancelog.createdAt).startOf('day').toDate();
    const endDay = moment(attendancelog.createdAt).endOf('day').toDate();    
    const attendance = await ATTENDANCELOGS.find({ user: attendancelog.user,createdAt:{ $gte :startTimeRange ,$lte :endTimeRange },isDeleted:false});
    

    const attendanceModel = await ATTENDANCE.findOne({ user: attendancelog.user,date: new Date(todayDate).toDateString() ,isDeleted:false });


    payload.startTime = moment.tz(`${todayDate} ${payload.startTime}`, true, "Asia/Kolkata").format();
    payload.endTime = moment.tz(`${todayDate} ${payload.endTime}`, true, "Asia/Kolkata").format();

    
    if(moment(payload.startTime).isAfter(startTimeRange) && moment(payload.endTime).isBefore(endTimeRange)){
      for(let i = 0; i < attendance.length; i++){
        if(_id === (attendance[i]._id).toString()){      
          if((i != 0) && (i != attendance.length-1)){
            //Middle log
            if(attendance[i+1] && attendance[i-1]){
              if(moment(payload.startTime).isBefore(attendance[i-1].endTime) || moment(payload.endTime).isAfter(attendance[i+1].startTime)){
               error = true;
              }
            }
                    
          }else if((i == 0) && (i != attendance.length-1)) {
            //First log
            if(attendance[i+1]){
              if(moment(payload.endTime).isAfter(attendance[i+1].startTime)){
                error = true;
              }
            }
          }else if((i == (attendance.length-1)) && (i != 0)) {
            //last log
            if(attendance[i-1]){
              if(moment(payload.startTime).isBefore(attendance[i-1].endTime)){
                error = true;
              }
            }
          }
        }
      }

    }else{
      error = true;
    }

    //if invalid time selected then show error
    if(error){  
      return res.redirect("/admin/attendance/" + _id +"/edit?error=true");
    }

    //update AttendanceLog Table
    let query = {_id: _id, isDeleted:false};
    let update = {
      $set: { startTime : payload.startTime, endTime : payload.endTime},
      $push: {updateRecord: { updateReason:payload.updateReason,updatedBy :sessionId}}
    };
    options = {upsert: true};
    await ATTENDANCELOGS.findOneAndUpdate(query,update,options);
  
    // Update attendance session
    const attendanceLogLastRecord = await ATTENDANCELOGS.findOne({ user: attendancelog.user,createdAt:{ $gte :startTimeRange ,$lte :endTimeRange},isDeleted: false}).sort({createdAt: -1});
    const attendanceLogFirstRecord = await ATTENDANCELOGS.findOne({ user: attendancelog.user,createdAt:{ $gte :startTimeRange ,$lte :endTimeRange},isDeleted: false}).sort({createdAt: 1});
    let updateSessionQuerys = {
      $set: {
        end: true,
        startTime: attendanceLogFirstRecord.startTime,
        endTime: attendanceLogLastRecord.endTime, 
      },
    };

    const allAttendanceLogs = await ATTENDANCELOGS.find({ user: attendancelog.user,createdAt:{ $gte :startTimeRange ,$lte :endTimeRange},isDeleted:false,endTime: { $ne: null }});

    
    let totalMinutesOfAllLogs = 0;
    allAttendanceLogs.forEach(element=>{
      //Get difference between all logs.
      let endTime = moment(element.endTime);
      let startTime = moment(element.startTime);
      let minuteDiffBtnLastLog = endTime.diff(startTime, 'minutes');
      totalMinutesOfAllLogs = totalMinutesOfAllLogs + parseInt(minuteDiffBtnLastLog);
    });
    
    let extraMinutes = 0;
    if(attendanceModel.extraMinutes){
      extraMinutes = parseInt(attendanceModel.extraMinutes);
    }

    let workingMinutes = (totalMinutesOfAllLogs + extraMinutes);
    let overTime = null;

    if(workingMinutes > (parseInt(user.overTimeMinute) + parseInt(attendanceModel.totalMinutes))){
      overTime = (workingMinutes - (parseInt(attendanceModel.totalMinutes)));
    }else{
      updateSessionQuerys.$set.overtimeCheckout = false;
    }
    updateSessionQuerys.$set.overTime = overTime;
    updateSessionQuerys.$set.totalTime = (Math.floor(workingMinutes / 60) + ':' + workingMinutes % 60);
    
    
    await ATTENDANCE.findOneAndUpdate({ user: attendancelog.user ,_id: attendanceModel._id, isDeleted:false },
      updateSessionQuerys
    );

    
    let currentDate = attendancelog.createdAt;
    currentDate = moment(new Date(currentDate)).format("YYYY-MM-DD");
    
   return res.redirect("/admin/attendance/" + attendancelog.user +"/show?selectedDate=" + currentDate);
    
  } catch (error) {
    next(error);
  }
};

exports.showView = async (req, res, next) => {
  try {
    let currentDate;
    const _id = req.params.id;  
    let selectedDate = req.query.selectedDate;
    
    let userRecord = await USER.findOne({ _id: _id });    
    let fullmonthName = moment().format("YYYY-MM");
    if(selectedDate){ 
      fullmonthName = moment(selectedDate).format("YYYY-MM");
    }     
    
    if(selectedDate) currentDate = new Date(moment(selectedDate).format('YYYY-MM'));
    else currentDate = new Date(moment().format("YYYY-MM"));    
    
    let startMonth = moment(currentDate).startOf('month').toDate();
    let endMonth = moment(currentDate).endOf('month').toDate();

    startMonth = (moment(startMonth).format("YYYY-MM-DD"));
    endMonth = (moment(endMonth).format("YYYY-MM-DD"));

    startMonth = (moment.tz(`${startMonth} ${"00:00:59"}`, true, "Asia/Kolkata").format());
    endMonth = (moment.tz(`${endMonth} ${"23:59:59"}`, true, "Asia/Kolkata").format());
    
    let attendanceLogs = await ATTENDANCELOGS.find({ createdAt:{ $gte :startMonth ,$lte :endMonth},user:_id,isDeleted:false});
    let attendanceLogCapture = await ATTENDANCECAPTURE.find({ createdAt:{ $gte :startMonth ,$lte :endMonth} ,user:_id,isS3Removed: false,isDeleted:false });

    let payroll = await PAYROLL.findOne({ user: _id, isDeleted: false });
    let empPayrollJoiningDate = null;
    if(payroll && payroll.trainingStartDate){
      empPayrollJoiningDate = payroll.trainingStartDate;
    }else if(payroll && payroll.joiningDate){
      empPayrollJoiningDate = payroll.joiningDate;
    }
    const attendanceInformation = await getUserAttendanceInformation(_id,fullmonthName,userRecord.createdAt,empPayrollJoiningDate);
    
    for(element of attendanceLogCapture){
      let originalFilePath = `users/${element.user}/attendance/original/${element.key}`;
      let attendanceCaptureURL = await getSignedURL(originalFilePath);
      element.key = attendanceCaptureURL.signedUrl;
    }
    

    let overTimeStatus = await USER.findOne({ _id: req.params.id, isDeleted: false },'overtime');
    
    let current_month = moment().format("YYYY-MM");

    // Get all holidays
    let monthHolidays = await getHolidays(fullmonthName);
    
    // Get all Sundays
    let monthSundays = await getSundays(fullmonthName);
    
    //Check user is admin or HR.
    let sessionUserInfo = await USER.findOne({ _id: req.session.user._id },'role').populate('role','name');
    
    return res.sendRender("admin/showAttendenceDetail", null, null, {
      current_month: current_month,
      attendanceLogs :JSON.stringify(attendanceLogs),
      attendanceLogCapture :JSON.stringify(attendanceLogCapture),
      user: _id,        
      name: userRecord.firstName + " " + userRecord.middleName + " " + userRecord.lastName,
      attendanceMonth: fullmonthName,
      presentDays : attendanceInformation.presentDay,
      moment : moment,
      sideTab: "attendance",
      useroverTimeStatus: overTimeStatus.overtime,
      overTime: attendanceInformation.overtimeMinutes,
      halfLeaveMinute: attendanceInformation.halfDayMinutes,
      totalLeave: attendanceInformation.leave,
      fullDayLeave: attendanceInformation.fullDayLeave,
      holidayOfMonth: monthHolidays,
      monthSundays: monthSundays,
      loggedUser: sessionUserInfo.role.name
    }); 
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.overTimeCheck = async (req, res, next) => {
  try {
    const attendanceId = req.params.id;
    const overtimeCheck = req.query.overtimeCheck;
    let attendance;     
    if(overtimeCheck == 'true')
    {            
      attendance = await ATTENDANCE.findOneAndUpdate(
        { _id:  attendanceId },{ $set: { overtimeCheckout : true },});
    } else {        
      attendance = await ATTENDANCE.findOneAndUpdate(
        { _id:  attendanceId },{ $set: { overtimeCheckout : false },});
    }
    
    if(req.query.perDateOvertimeCheck == 'true'){      
      return res.redirect("/admin/attendance?selectedDate=" + req.query.selectedDate + "&selectedOption=" + req.query.selectedOption);  
    }

    //For showAttendance Page
    const _id = attendance.user;    
    let userRecord = await USER.findOne({ _id: _id });
    const selectedDate = req.query.selectedDate;
    let totalOverTime = 0;        
    let monthAttendance = [];
    let monthName = moment(selectedDate).subtract(0, "month").format("MMM");
    let year = moment(selectedDate).format("YYYY");

    let attendanceType = userRecord.attendanceType;
    let minuteBaseonAttendance;
    let hoursBaseonAttendance;
  
    minuteBaseonAttendance = parseInt(userRecord.totalMinutes);
    hoursBaseonAttendance = minuteBaseonAttendance / 60;
  
    let halfLeaveMinute = 0;
    chooseAttendanceData = await ATTENDANCE.find({ user: _id });      
    chooseAttendanceData.forEach(async(element, index, array) => {
      let hoilidayPresentDate = new Date(element.date);
      let day = hoilidayPresentDate.getDate();
      let m = hoilidayPresentDate.getMonth() + 1;
      if (m < 10) m = "0" + m;
      if (day < 10) day = "0" + day;
      let y = hoilidayPresentDate.getFullYear();
      let yf = day + "/" + m + "/" + y;      
      let holiday = await HOLIDAY.findOne({ holidayDate: yf ,status :0});      
      if(!holiday){
        let month = moment(element.date).subtract(0, "month").format("MMM");
        let yearRecord = moment(element.date).format("YYYY");       
        if (month == monthName && year == yearRecord) {
          monthAttendance.push(element);
          if (element.overTime && element.overtimeCheckout){
            totalOverTime = totalOverTime + element.overTime;
          }
          let totalTime=element.totalTime;
          if(!totalTime){
            totalTime= "0:0";
          }
          let totalTimeArray=totalTime.split(":");
          let tempMinutes = (+totalTimeArray[0]) * 60 + (+totalTimeArray[1]);
          if(tempMinutes < minuteBaseonAttendance)
          {
            halfLeaveMinute = halfLeaveMinute + (minuteBaseonAttendance - tempMinutes);
          }
        }
      }
    });
   
    let user = true;
    if (monthAttendance) {
      user = false;
    }
    let fullmonthName = moment(selectedDate).format("YYYY-MM");

    //For Holiday Count
    let currentDate = new Date();           
    if(selectedDate) currentDate = new Date(moment(selectedDate).format('YYYY-MM'));
    else currentDate = new Date(moment().format("YYYY-MM"));    
    let startDate = moment(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    let endDate = moment(new Date(startDate)).clone().endOf("month").format("MM/DD/YYYY");
    let dd = new Date(startDate);
    let now = new Date(endDate);
    let holidayDate = 0;
    while (dd <= now) {
      let day = dd.getDate();
      let m = dd.getMonth() + 1;
      if (m < 10) m = "0" + m;
      if (day < 10) day = "0" + day;
      let y = dd.getFullYear();
      let yf = day + "/" + m + "/" + y;
      let newDate = y + "-" + m + "-" + day;
      if (!(moment(newDate).format("dddd") == "Sunday")) {
        let holiday = await HOLIDAY.findOne({ holidayDate: yf, status:0 });
        if (holiday) {
          holidayDate = holidayDate + 1;
        }
      }
      dd.setDate(dd.getDate() + 1);
    }

    let totalDays = moment(fullmonthName, "YYYY-MM").daysInMonth();       
    let weekend = momentWeek(fullmonthName).weekdaysInMonth('Sunday');
    totalDays = totalDays - weekend.length;
    monthAttendance.totalLeave = (totalDays - monthAttendance.length) - holidayDate;
    monthAttendance.halfLeaveMinute = halfLeaveMinute;

    let m = moment(selectedDate).format("M");
    let y = moment(selectedDate).format("YYYY");

    //for AttendanceLogs table entry
    const startMonth = moment(currentDate).startOf('month').toDate();
    const endMonth = moment(currentDate).endOf('month').toDate();
    let attendanceLogs = await ATTENDANCELOGS.find({ createdAt:{ $gte :startMonth ,$lte :endMonth},user:_id});
    let attendanceLogCapture = await ATTENDANCECAPTURE.find({ createdAt:{ $gte :startMonth ,$lte :endMonth} ,user:_id,isS3Removed: false });  
    
    for(let i = 0; i < attendanceLogCapture.length; i++){
      let originalFilePath = `users/${attendanceLogCapture[i].user}/attendance/original/${attendanceLogCapture[i].key}`;
      let attendanceCaptureURL = await getSignedURL(originalFilePath);
      attendanceLogCapture[i].key = attendanceCaptureURL.signedUrl;
    }     
   
    return res.sendRender("admin/showAttendenceDetail", null, null, {
      selectedAttendance: monthAttendance,
      attendanceLogs :JSON.stringify(attendanceLogs),
      attendanceLogCapture :JSON.stringify(attendanceLogCapture),
      user: _id,    
      name: chooseAttendanceData[0].name,
      overTime: totalOverTime,
      attendanceMonth: fullmonthName,
      moment : moment,
      sideTab: "attendance",
      moment : moment
    });
  } catch (error) {
    next(error);
  }
};

exports.showSalary = async (req, res, next) => {
  try {
    const _id = req.params.id;
    let dateRangePickerDate = `${moment(new Date()).subtract(7,'day').format("DD/MM/YYYY")} - ${moment(new Date()).format("DD/MM/YYYY")}`;
    if(req.query.daterangeForSalary){
      dateRangePickerDate = req.query.daterangeForSalary;
    }else{
      dateRangePickerDate = `${moment(new Date()).subtract(7,'day').format("DD/MM/YYYY")} - ${moment(new Date()).format("DD/MM/YYYY")}`;
    }
    
    let userRecord = await USER.findOne({ _id: _id });

    const user = await USER.findOne({ _id, isDeleted: false, isLeft: false });
    let payrollStatus = false,employeePosition = false,dataStatus = false;
    let salarySlipObject = {};
    //Check user position in system.
    if(user.position == 'Employee'){
      employeePosition = true;
      // Check payroll of user available or not.
      let payroll = await PAYROLL.findOne({ user: _id, isDeleted: false });
      if(payroll){
        if(payroll.salary){
          payrollStatus = true;

          // Calculate salary.
          let startEndDateRange = dateRangePickerDate.split("-");
          let startDateRange = startEndDateRange[0].trim();
          let endDateRange = startEndDateRange[1].trim();

          startDateRange = moment(moment(startDateRange, 'DD/MM/YYYY')).format('YYYY-MM-DD');
          endDateRange = moment(moment(endDateRange, 'DD/MM/YYYY')).format('YYYY-MM-DD');

          let dateStart = moment(new Date(startDateRange));
          let dateEnd = moment(new Date(endDateRange));
          let timeValues = [];

          // Get all months between dateRange.
          if(moment(dateEnd).isAfter(dateStart)){
            while (moment(dateEnd).isAfter(dateStart) || dateStart.format('M') === dateEnd.format('M')) {
              timeValues.push(dateStart.format('YYYY-MM'));
              dateStart.add(1,'month');
            }
          }else{
            timeValues.push(dateStart.format('YYYY-MM'));
          }

          // get start and end date of month
          let dateRangeObject = [];
          for(let i=0; i<timeValues.length; i++){
            let dateRange = {};
            dateRange.startDate = moment(new Date(timeValues[i]),'YYYY-MM').startOf("month").format("YYYY-MM-DD");
            if(timeValues.length > 1){
              dateRange.endDate = moment(new Date(timeValues[i]),'YYYY-MM').endOf("month").format("YYYY-MM-DD");
            }else{
              dateRange.endDate = dateRange.endDate = endDateRange;
            }
            if(i == 0){
              dateRange.startDate = startDateRange;
            }else if(i == (timeValues.length-1)){
              dateRange.endDate = endDateRange
            }
            dateRangeObject.push(dateRange);
          }

         

          let specialAllowance = 0,bonus = 0,petrolAllowance = 0,shift = 0,professionalTax = 0,esic = 0,securityDeposit = 0,tds = 0,pf = 0,other = 0;
          let basicPay = 0,leaveEncashment = 0,overtimeAllowance = 0, finalSalary = 0;
          //Get all months one by one.
          for(const salaryMonthObj of dateRangeObject){
            let salaryMonth = moment(new Date(salaryMonthObj.startDate)).format("YYYY-MM")
            let salary_amount = 0;
            //Get salary amount.
            let fromIncrementGetSalary = await INCREMENT.find({ user: _id, isDeleted: false, payrollID: payroll._id }).sort({createdAt: -1});
            let flag = 0;
            for (const element of fromIncrementGetSalary) {
              let matchDate = moment(new Date(element.effectiveFrom)).format("YYYY-MM");
              if((moment(salaryMonth).isSame(matchDate)) || (moment(salaryMonth).isAfter(matchDate))){
                salary_amount = element.totalSalary;
                flag = 1;
                break;
              }
            }
            if(flag == 0){
              salary_amount = fromIncrementGetSalary[0].totalSalary;
            }
            
            //Check if salary amount is more than 0 or not.
            if(parseInt(salary_amount) > 0){
              // Get all salary information.
              let empPayrollJoiningDate = null;
              if(payroll && payroll.trainingStartDate){
                empPayrollJoiningDate = payroll.trainingStartDate;
              }else if(payroll && payroll.joiningDate){
                empPayrollJoiningDate = payroll.joiningDate;
              }
              let salary_Info_Obj = await getDateRangeSalaryInfo(
                _id,
                salaryMonthObj.startDate,
                salaryMonthObj.endDate,
                salaryMonth,
                salary_amount,
                user.leaveCreditType,
                user.createdAt,
                empPayrollJoiningDate);
                
              if(parseInt(salary_Info_Obj.monthly_attendance) > 0){
                let salaryslip = await SALARY.findOne({ user: _id, monthYear: salaryMonth});
                if(salaryslip){
                  specialAllowance = specialAllowance +  Number(salaryslip.specialAllowance);
                  bonus = bonus + Number(salaryslip.bonus);
                  petrolAllowance = petrolAllowance +  Number(salaryslip.petrolAllowance);
                  shift = shift + Number(salaryslip.shift);
                  professionalTax = professionalTax + Number(salaryslip.professionalTax);
                  esic = esic + Number(salaryslip.esic);
                  securityDeposit = securityDeposit + Number(salaryslip.securityDeposit);
                  tds = tds + Number(salaryslip.tds);
                  pf = pf + Number(salaryslip.pf);
                  other = other + Number(salaryslip.other);
                }
                
                basicPay = basicPay + Number(salary_Info_Obj.total_salary + salary_Info_Obj.holiday_rupees + salary_Info_Obj.deductedLeaveEncashment);
                leaveEncashment = leaveEncashment + Number(salary_Info_Obj.leave_cashment);
                overtimeAllowance = overtimeAllowance + Number(salary_Info_Obj.overtime_rupees);
                finalSalary = finalSalary + Number(salary_Info_Obj.finalSalary);
              }
            }
          }
          
          salarySlipObject.basicPay = basicPay;
          salarySlipObject.specialAllowance = specialAllowance;
          salarySlipObject.leaveEncashment = leaveEncashment;
          salarySlipObject.bonus = bonus;
          salarySlipObject.overtimeAllowance = overtimeAllowance;
          salarySlipObject.petrolAllowance = petrolAllowance;
          salarySlipObject.shift = shift;
          salarySlipObject.professionalTax = professionalTax;
          salarySlipObject.esic = esic;
          salarySlipObject.securityDeposit = securityDeposit;
          salarySlipObject.tds = tds;
          salarySlipObject.pf = pf;
          salarySlipObject.other = other;

          let earings = (finalSalary+specialAllowance+bonus+petrolAllowance+shift);
          let deduction = (professionalTax + esic + securityDeposit + tds + pf + other);
          salarySlipObject.netPay = ( earings - deduction);
        }
      }
    }

    (Object.keys(salarySlipObject).length) > 0 ? dataStatus = true : dataStatus = false;

    return res.sendRender("admin/salary", null, null, {
      user: _id,
      dateRangePickerDateForSalary: dateRangePickerDate,
      name: userRecord.firstName + " " + userRecord.middleName + " " + userRecord.lastName,
      payrollStatus: payrollStatus,
      employeePosition: employeePosition,
      salarySlipObject: salarySlipObject,
      dataStatus: dataStatus
    });
  } catch (error) { 
    console.log(error);
    next(error);
  }
};

exports.editSalary = async (req, res, next) => {
  try {
    
    let _id = req.params.id;
    let payload = req.body;
    let month_year = req.query.salaryMonth;
    
    payload.user = _id;
    payload.monthYear = month_year;

    if (!payload.specialAllowance) {
      payload.specialAllowance = "0";
    }
    if (!payload.bonus) {
      payload.bonus = "0";
    }
    if (!payload.petrolAllowance) {
      payload.petrolAllowance = "0";
    }
    if (!payload.shift) {
      payload.shift = "0";
    }
    if (!payload.professionalTax) {
      payload.professionalTax = "0";
    }
    if (!payload.securityDeposit) {
      payload.securityDeposit = "0";
    } 
    if (!payload.tds) { 
      payload.tds = "0";
    }
    if (!payload.pf) {
      payload.pf = "0";
    }
    if (!payload.esic) {  
      payload.esic = "0";
    }

    let salaryslip = await SALARY.findOne({ user: _id, monthYear: month_year});
    if(salaryslip){
      //update
      let updateSalary = await SALARY.findOneAndUpdate(
        { user: _id, monthYear: month_year},
        { $set: payload},
        { new: true }
      );
    }else{
      let createSalary = await SALARY.create(payload);
    }
    
    return res.redirect(`/admin/view/salarySlip/${_id}?salaryMonth=${month_year}`);
  } catch (error) {
    next(error);
  }
};

exports.showEditSalary = async (req, res, next) => {
  const _id = req.params.id;
  const salary = await SALARY.findOne({_id:_id});
  return res.sendRender("admin/updatePayslip", null, null, {salaryObject:salary,sideTab: "employee",moment:moment});  
}

exports.editPayslip = async (req, res, next) => {
  const _id = req.params.id;
  const payload = req.body;
  const _query = { _id };
  
  const salary = await SALARY.findOneAndUpdate(
    _query,
    { $set: payload },
    { new: true }    
  );
  
  return res.redirect("/admin/view/" + "salarySlip/" + salary.user);
  
}

exports.settings = async (req, res, next) => {
  try {    
    let select,newAtt=[],allUserAtt=[];    
    if(req.query.select){
      select=req.query.select;
    }else{
      select=moment(new Date()).format('YYYY-MM');
    }
    const user = await USER.find(
      { isDeleted: false},'_id firstName lastName middleName attendanceCode'
    );
    let att=await ATTENDANCESETTINGS.find({ monthandYear:select,isDeleted: false }).populate({path: 'user', select: '_id firstName lastName middleName attendanceCode'});
    let i=0;
    att.forEach(element=>{
      allUserAtt[i]=JSON.stringify(element.user._id);
      i=(i+1);
    })
    user.forEach(async element=>{
      if(element.firstName && element.middleName && element.lastName){
      let eID=JSON.stringify(element._id);
      if(allUserAtt.includes(eID)){
        
      }else{
        newAtt.push(element);
      }
      }
    })
    
    let finalAtt=newAtt.concat(att);
    
    return res.sendRender("admin/attendanceSettings", null, null, {attendanceSetting:finalAtt,totalEMp:finalAtt.length,settingDoneEmp:att.length,selectedMonth:select,sideTab:'attendanceSetting',moment:moment});
  } catch (error) {
    next(error);
  }
};

exports.createSetting = async (req, res, next) => {
  try {
    let payload=req.body;
    const user = await USER.find({ isDeleted: false });
    if((payload.totalMinutes<=0)){
      return res.sendRender("admin/addAttendanceSetting", null, null, {
        recordStatus: "No",
        attendanceSetting:payload,
        moment:moment,
        allUsers:user,
        selectedEmp: payload.allUsers,
        availableEMpErr:null
      });
    }else if(!payload.allUsers){
      return res.sendRender("admin/addAttendanceSetting", null, null, {
        recordStatus: "NoUser",
        attendanceSetting:payload,
        moment:moment,
        allUsers:user,
        selectedEmp: payload.allUsers,
        availableEMpErr:null
      });
    }
    else{
      let newArry=[];
      let allAttendanceSettings = await ATTENDANCESETTINGS.find({isDeleted:false});
      allAttendanceSettings.forEach((element, index, array) => {
        if(element.monthandYear==payload.monthandYear){
          if(payload.allUsers.includes(""+element.user)){
            newArry.push(element.user);
          }
        }
      });
      if(newArry.length>0){
        newArry=JSON.stringify(newArry);
        newArry=JSON.parse(newArry);
        return res.sendRender("admin/addAttendanceSetting", null, null, {
          recordStatus: "empAvailable",
          attendanceSetting:payload,
          moment:moment,
          allUsers:user,
          selectedEmp: payload.allUsers,
          availableEMpErr:newArry
        });
      }else{
          payload.lastUpdated=new Date();
          if(typeof payload.allUsers=='string'){
            let length=payload.allUsers.length;
            let str=payload.allUsers.slice(0,length);
            payload.user=str;
            delete payload.allUsers;
            await ATTENDANCESETTINGS.create(payload);

          }else{
            for(element of payload.allUsers){
            payload.user=element;
            delete payload.allUsers;
            let aa=await ATTENDANCESETTINGS.create(payload);
          }
          }
          
          return res.redirect("/admin/attendance/settings");
      }
    }
  } catch (error) {
    next(error);
  }
};

exports.showAddAtteSetting = async (req, res, next) => {
  try {
    const user = await USER.find({ isDeleted: false });
    return res.sendRender('admin/addAttendanceSetting',null,null,{sideTab:'attendanceSetting',allUsers:user})
  } catch (error) {
    next(error);
  }
};

exports.showAttSettingEdit = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const attSettingEdit = await ATTENDANCESETTINGS.findOne({ _id, isDeleted: false });
    const user = await USER.findOne({ _id:attSettingEdit.user, isDeleted: false },'attendanceCode firstName middleName lastName');
    return res.sendRender("admin/updateAttendaceSetting", null, null, {attendanceSetting:attSettingEdit,attUser:user,sideTab:'attendanceSetting'});
  } catch (error) {
    next(error);
  }
};

exports.AttSettingEdit = async (req, res, next) => {
  try {
    const _id = req.params.id;
    let payload=req.body;
    if(payload.totalMinutes<=0){
      return res.redirect("/admin/attendance/settings/" + _id + "/edit");
    }else{
     payload.lastUpdated=new Date();
     const _query = { _id, isDeleted: false };
    const att = await ATTENDANCESETTINGS.findOneAndUpdate(
      _query,
      { $set: payload },
      { new: true }
    );
   
    return res.redirect(`/admin/attendance/settings/?select=${payload.monthandYear}`);
    }
    
  }catch (error) {
    next(error);
  }
};
exports.addShowAttendance = async (req, res, next) => {
  try {
    let employees = await USER.find(
      { isDeleted: false, isLeft: false },
      "_id firstName middleName lastName attendanceCode"
    );

    let payload = {};
    payload.attendanceDate = moment().format("YYYY-MM-DD");
    payload.attendanceUser ="";
    payload.attendanceEmpName ="";
    payload.attendanceInTime ="";
    payload.attendanceOutTime ="";
    payload.attendanceTotalMinutes ="";
   return res.sendRender("admin/addAttendance", null, null, { employees,sideTab:'addAttendance',payload});
  } catch (error) {
    next(error);
  }
};

exports.addNewAttendance = async (req, res, next) => {
  try {
    
    let payload=req.body;
    
    /* get all users for show on data-list*/
     const employees = await USER.find(
       { isDeleted: false, isLeft: false },
       "_id firstName middleName lastName attendanceCode"
     );
    
    const dummyattendanceEmpName = payload.attendanceEmpName ;
    delete payload['attendanceEmpName'];
    const validateError = validateAttendance.body.validate(payload).error;
    if (validateError) {  
      payload.attendanceEmpName =  dummyattendanceEmpName;
      throw new APIError({
        message: validateError.message,
        template: "admin/addAttendance",
        oldValues: { employees,sideTab:'addAttendance', payload }
        
      });
    }

    /* get user id from attendance code*/
    let employeeID = await USER.findOne(
      { attendanceCode:payload.attendanceUser,isDeleted: false, isLeft: false },
      "_id firstName middleName lastName"
    ).populate('role');
       
    if(!employeeID){
      payload.attendanceEmpName =  dummyattendanceEmpName;
      return res.sendRender("admin/addAttendance", null, null, { payload,employees,sideTab:'addAttendance',status:"Invalid"});
    }
     /* check total minutes less or equlas to zero or not*/
    if(parseInt(payload.attendanceTotalMinutes)<=0){
      payload.attendanceEmpName =  dummyattendanceEmpName;
      return res.sendRender("admin/addAttendance", null, null, { payload,employees,sideTab:'addAttendance',status:"Invalid"});
    }

    let sessionId = req.session.user._id;
    const loginUser = await USER.findOne({ _id:sessionId, isDeleted: false }).populate('role');
    let loginUserRole = loginUser.role.name.trim()
    let addAttUserRole = employeeID.role.name.trim();

    if(loginUserRole == 'HR' && addAttUserRole == 'HR'){
      return res.sendRender("admin/addAttendance", null, null, { payload,employees,sideTab:'addAttendance',status:"HR"});
    }

    
    let attDate = new Date(payload.attendanceDate);
    let attDateFormat = attDate.toDateString();
    let userId= employeeID._id;
    ATTENDANCE.findOne({user: userId,date: attDateFormat,isDeleted: false}).then(async(attendance)=>{
    /* check user entry available in system or not */
      if(attendance){
        payload.attendanceEmpName =  dummyattendanceEmpName;
        return res.sendRender("admin/addAttendance", null, null, { payload,employees,sideTab:'addAttendance',status:"Already"});
      }else{      
        let date = payload.attendanceDate;
        let startTime = payload.attendanceInTime;
        let endTime = payload.attendanceOutTime;

        let startTimeUTCFormat = moment.tz(`${date} ${startTime}`, true, "Asia/Kolkata").format();
        let endTimeUTCFormat = moment.tz(`${date} ${endTime}`, true, "Asia/Kolkata").format();
        
        if((moment(new Date(startTimeUTCFormat)).isBefore(new moment())) && (moment(new Date(endTimeUTCFormat)).isBefore(new moment()))){
          const URL = `${baseUrl}/dashboard/getCodeapi?code=${payload.attendanceUser}&date=${date}&minutes=${payload.attendanceTotalMinutes}`;
          await axios.post(URL+`&startTime=${startTime}`);        
          await axios.post(URL+`&endTime=${endTime}`);
          payload.status="No";
          payload.todaysDate = moment().format("YYYY-MM-DD");
          const todaysDate = moment().format("YYYY-MM-DD");
          return res.sendRender("admin/addAttendance", null, null, {employees,sideTab:'addAttendance',todaysDate,status:"Done"});
        }else{
          payload.attendanceEmpName =  dummyattendanceEmpName;
          return res.sendRender("admin/addAttendance", null, null, { payload,employees,sideTab:'addAttendance',status:"Future"});
        }
      }    
    }).catch((err)=>{})
  
   
       
  } catch (error) {
    next(error);
  }
};
const getHoursDifference= (officeStartTime,officeEndTime)=>{
  let st=moment.duration(officeStartTime,'HH:mm ');
  let et=moment.duration(officeEndTime,'HH:mm ');
  let diff=et.subtract(st);
  let diffH=diff.hours();
  let diffM=diff.minutes();
  let totalMinutes=(diffH*60)+diffM;
  return totalMinutes;  
}
exports.attendanceMode = async (req, res, next) => {
  try {
    let totalMinutes;
   if(req.query.startTime && req.query.endTime && req.query.code){
    totalMinutes = getHoursDifference(req.query.startTime,req.query.endTime);
    res.send({totalMinutes});
   }
  } catch (error) {
    next(error);
  }
};

exports.showDetails = async (req, res, next) => {
  try {
    let currentMonthYear;
    if(req.query.selectedDate){
      currentMonthYear = req.query.selectedDate;
    }else{
      currentMonthYear = moment().format("MMM-YYYY");
    }
    
    const selectedDate = moment(new Date(currentMonthYear)).format("YYYY-MM"); //2021-06
    const _id = req.session.user._id;

    let payroll = await PAYROLL.findOne({ user: _id, isDeleted: false });
    let empPayrollJoiningDate = null;
    if(payroll && payroll.trainingStartDate){
      empPayrollJoiningDate = payroll.trainingStartDate;
    }else if(payroll && payroll.joiningDate){
      empPayrollJoiningDate = payroll.joiningDate;
    }
    const attendanceInformation = await getUserAttendanceInformation(_id,selectedDate,req.session.user.createdAt,empPayrollJoiningDate);
    let overTimeStatus = await USER.findOne({ _id: _id, isDeleted: false },'overtime');
    
    //Get all present days of employee
    let startMonth = moment(selectedDate).startOf('month').toDate();
    let endMonth = moment(selectedDate).endOf('month').toDate();

    startMonth = (moment(startMonth).format("YYYY-MM-DD"));
    endMonth = (moment(endMonth).format("YYYY-MM-DD"));

    startMonth = (moment.tz(`${startMonth} ${"00:00:59"}`, true, "Asia/Kolkata").format());
    endMonth = (moment.tz(`${endMonth} ${"23:59:59"}`, true, "Asia/Kolkata").format());

    let attendanceLogs = await ATTENDANCELOGS.find({ createdAt:{ $gte :startMonth ,$lte :endMonth},user:_id,isDeleted:false });
    let attendanceLogCapture = await ATTENDANCECAPTURE.find({ createdAt:{ $gte :startMonth ,$lte :endMonth} ,user:_id,isS3Removed: false,isDeleted:false });

    for(element of attendanceLogCapture){
      let originalFilePath = `users/${element.user}/attendance/original/${element.key}`;
      let attendanceCaptureURL = await getSignedURL(originalFilePath);
      element.key = attendanceCaptureURL.signedUrl;
    }

    return res.sendRender("employee/showAttendenceDetail", null, null, {
      currentMonthYear,
      presentDays: attendanceInformation.presentDay,
      attendanceLogs :JSON.stringify(attendanceLogs),
      attendanceLogCapture :JSON.stringify(attendanceLogCapture),
      moment : moment,
      sideTab: "usershowAttendenceDetail",
      overTime: attendanceInformation.overtimeMinutes,
      halfLeaveMinute: attendanceInformation.halfDayMinutes,
      fullDayLeave: attendanceInformation.fullDayLeave,
      useroverTimeStatus: overTimeStatus.overtime,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.showDetailsAPI = async (req, res, next) => {
  try {
    if(req.query.attendanceMonth)
    {
      const _id = req.session.user._id;
      const selectedDate = moment(new Date(req.query.attendanceMonth)).format("YYYY-MM"); //2021-06
      
      const startDate = selectedDate+"-01";
      const endDate = moment(selectedDate+"-01").endOf("month").format("YYYY-MM-DD");

      let prevStartDate = moment(moment(startDate)).startOf('day').toDate();
      let prevEndDate = moment(moment(endDate)).endOf('day').toDate();

      prevStartDate = (moment(prevStartDate).format("YYYY-MM-DD"));
      prevEndDate = (moment(prevEndDate).format("YYYY-MM-DD"));

      prevStartDate = (moment.tz(`${prevStartDate} ${"00:00:59"}`, true, "Asia/Kolkata").format());
      prevEndDate = (moment.tz(`${prevEndDate} ${"23:59:59"}`, true, "Asia/Kolkata").format());
      
      
      const modelObj = ATTENDANCE;
      const searchFields = ['totalTime','date'];
      
      const conditionQuery = { user: _id, createdAt: {$gte :prevStartDate ,$lte :prevEndDate },isDeleted: false};
      const projectionQuery = '-__v -isDeleted -isLeft -createdAt -updatedAt -deletedAt -deletedBy';
      const sortingQuery = {'createdAt': -1};
      const populateQuery = null;
      
      DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
        if(err) throw new APIError({message: "Something went wrong while fetch user list."});
        const jsonString = JSON.stringify(data);
        res.send(jsonString);
      });


    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.monthlyReport = async (req, res, next) => {
  try {
   //Get selected Date
   let selectedDate;
   if (req.query.userId) {
     const userId = req.query.userId;

     let month_Year = moment(new Date(req.query.selectedDate)).format("YYYY-MM");
     const start_of_month = month_Year+'-01';
     const end_of_month = moment(month_Year+"-01").endOf("month").format("YYYY-MM-DD");
     
     let startDate = moment(start_of_month).startOf('day').toDate();
     let endDate = moment(end_of_month).endOf('day').toDate();
     
     startDate = (moment(startDate).format("YYYY-MM-DD"));
     endDate = (moment(endDate).format("YYYY-MM-DD"));
  
     startDate = (moment.tz(`${startDate} ${"00:00:59"}`, true, "Asia/Kolkata").format());
     endDate = (moment.tz(`${endDate} ${"23:59:59"}`, true, "Asia/Kolkata").format());
  
  
     // get array of records for that user id.
     let monthlyAttendance = await ATTENDANCE.find(
       { user: userId,
        createdAt:{ $gte :startDate ,$lte :endDate },
        isDeleted: false }
        ,'totalTime totalMinutes overTime overtimeCheckout -_id attendanceType createdAt date').sort({createdAt: 1});
      
      
      res.send({
        monthlyAttendance: monthlyAttendance,
        startOfMonth: start_of_month,
        endOfMonth: end_of_month
      });  
   } else if (req.query.selectedDate) {
     selectedDate = req.query.selectedDate;
     const startOfMonth = moment(new Date(selectedDate)).format("YYYY-MM")+"-01";
     const totalDaysOfMonth = moment(startOfMonth).daysInMonth();

     // Get all holidays
     let monthHolidays = await getHolidays(selectedDate);
     // Get all Sundays
     let monthSundays = await getSundays(selectedDate);

     const adminRole = await ROLE.findOne({ name: new RegExp("admin", "i") });
     let employeeJoiningDate = moment(new Date(selectedDate)).add(1,'months').format("YYYY-MM");
     //Select all employees
     const employees = await USER.find({ 
       isDeleted: false, 
       isLeft: false,
       createdAt:{ $lte :employeeJoiningDate },
       role : { $ne : adminRole } 
      },"_id firstName middleName lastName").sort({createdAt: 1});

     res.send({
      totalDaysOfMonth: totalDaysOfMonth,
      employees: employees,
      monthHolidays: monthHolidays,
      monthSundays: monthSundays
     });
   } else {
     selectedDate = moment().format("MMM-YYYY");
     return res.sendRender("admin/attendanceReport", null, null, {
      moment: moment,
      selectedDate: selectedDate,
      sideTab: "monthlyAttendance",
    });
   }
  } catch (error) {
    next(error);
  }
};

const getUsersFullDayLeave = async (id,allHolidays,start_of_month,end_of_month)=>{
  try{
    let fullDayLeave = 0, presentDay = 0;
    const startDate = moment(start_of_month).startOf('day').toDate();
    const endDate = moment(end_of_month).endOf('day').toDate();

    while (startDate <= endDate) {
      let monthDate = startDate.toDateString();
      let attendance = await ATTENDANCE.findOne({ user: id, date: monthDate, isDeleted: false});
      let status = allHolidays.includes((moment(startDate).format("YYYY-MM-DD")).toString());
      if((attendance) && (!status)){
        presentDay = (presentDay + 1);
      }
      if((!attendance) && (!status)){
        fullDayLeave = (fullDayLeave + 1);
      }
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return {
      fullDayLeave: fullDayLeave,
      presentDay: presentDay
    }
  }catch(error){
    console.log(error);
  }
}

exports.getSalaryInformation = async (userID , month_Year ,salary_amount, leaveCreditType, empJoiningDate, payrollJoiningDate)=>{
  try {
    if(payrollJoiningDate){
      if((moment(month_Year).isSame((moment(new Date(empJoiningDate)).format("YYYY-MM"))))){
        empJoiningDate = payrollJoiningDate;
      }
    }
    
    let salaryObject = {};

    const selectedMonth = moment(month_Year).format("MM");
    const selectedYear = moment(month_Year).format("YYYY");

    let overtime_rupees = 0,overtime_minutes = 0;
    
    // User object ID
    const userId = userID;
    let totalDays_month;  
    // Starting and ending dates
    const start_of_month = month_Year+'-01';
    let last_dateMonth,range_holidays = [];
    let all_holidays = await getHolidays(month_Year);
    
    let month_sundays;
    const prevMonthLastDate = moment(selectedYear+"-"+selectedMonth).subtract(1,'months').endOf('month').format("YYYY-MM-DD");
    
    
    if((moment().format("YYYY-MM").toString()) == month_Year.toString()){
      // If month is current month then get up to todays date data
      last_dateMonth = moment().subtract(1, 'day').format("YYYY-MM-DD"); // get last date
      all_holidays.map((element)=>{

        if((moment(element).isBefore(moment().format("YYYY-MM-DD"))) ){
          range_holidays.push(element);
        }
      }); // get holidays
      totalDays_month = ((moment(new Date())).diff(moment(start_of_month), 'days') + 1); //get total days
      // Get all Sundays
      month_sundays = await getSundaysForSalary(prevMonthLastDate,(moment().format("YYYY-MM-DD")));
      
      
    }else{
      last_dateMonth = moment(month_Year+"-01").endOf("month").format("YYYY-MM-DD");
      range_holidays = all_holidays;
      totalDays_month = (moment(month_Year, "YYYY-MM").daysInMonth());
      // Get all Sundays
      const nexMonthFirstDate = moment(selectedYear+"-"+selectedMonth).add(1,'months').startOf('month').format("YYYY-MM-DD");
      month_sundays = await getSundaysForSalary(prevMonthLastDate,nexMonthFirstDate);
    }
    const end_of_month = last_dateMonth;
    
    // Get all holidays
    let month_holidays = range_holidays;
    empJoiningDate = moment(new Date(empJoiningDate)).format("YYYY-MM-DD");
    let afterJoiningDateHolidays = [];
    month_holidays.map(holidayDate =>{
      if((moment(new Date(holidayDate)).isSame(new Date(empJoiningDate)) || (moment(new Date(holidayDate)).isAfter(new Date(empJoiningDate))))){
        afterJoiningDateHolidays.push(holidayDate);
      }
    })  
    
    month_holidays = afterJoiningDateHolidays;

    // for holiday
    let presetOn_holiday = 0,present_holiday_date = [],holiday_minutes =0 ,holiday_salary =0;
    //for sunday
    let presetOn_sunday = 0,present_sunday_date = [],sunday_minutes = 0,sunday_salary = 0;
    
    let total_salary = 0, halfday_cut_salary = 0, working_minutes = 0,card_minutes = 0, tracker_minutes = 0,clientTracker_minutes = 0 ;
    let halfday_cut_minutes = 0,halfday_cut_minutes_card = 0,halfday_cut_minutes_tracker = 0;
    let halfday_cut_minutes_clientTracker = 0;
    let halfDay_card_salary = 0,halfDay_tracker_salary = 0,halfDay_clienttracker_salary = 0;

    // present day by card and tracker.
    let card_presentDay = 0 ,tracker_presentDay = 0 ,cTracker_presentDay = 0 

    // Get OT minutes of all different mode.
    let cardOT = 0, trackerOT = 0, clientTrackerOT = 0;
    let cardOTRupees = 0, trackerOTRupees = 0, clientTrackerOTRupees = 0;
    let cardWorkingRupees = 0, trackerWorkingRupees = 0, clientTrackerWorkingRupees = 0;
    let singleEntryOT,oTRupees;

    let startDate = moment(start_of_month).startOf('day').toDate();
    let endDate = moment(end_of_month).endOf('day').toDate();

    startDate = (moment(startDate).format("YYYY-MM-DD"));
    endDate = (moment(endDate).format("YYYY-MM-DD"));

    startDate = (moment.tz(`${startDate} ${"00:00:59"}`, true, "Asia/Kolkata").format());
    endDate = (moment.tz(`${endDate} ${"23:59:59"}`, true, "Asia/Kolkata").format());

    // get array of records for that user id.
    let monthly_attendance = await ATTENDANCE.find({ user: userId,createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false },'totalTime totalMinutes overTime overtimeCheckout -_id attendanceType createdAt date').sort({createdAt: 1});
    
    // current salary.
    const salary = salary_amount;
    
    // Total days of month except sunday.
    const total_days_ofMonth = (totalDays_month-(month_sundays.length));
    
    // One day salary.
    const one_day_salary = (salary/total_days_ofMonth);
    // Merge all holidays and sundays
    let allHolidaysOfMonth = [...month_sundays,...month_holidays];
    monthly_attendance.map((attendance)=>{
    
    // check holiday and sunday
    let presentDate = moment(new Date(attendance.date)).format('YYYY-MM-DD').toString();
    let isHoliday = month_holidays.includes(presentDate);
    let isSunday = month_sundays.includes(presentDate);
    singleEntryOT = 0, oTRupees = 0;

    // Check status of date ,is holiday or not
    let status = allHolidaysOfMonth.includes((moment(new Date(attendance.date)).format("YYYY-MM-DD")).toString());
    

    // split totalTime by :
    let user_totalTime = attendance.totalTime.split(":");
    // convert hours to minutes
    let user_totalTime_toMinutes = parseInt(user_totalTime[0])*60+parseInt(user_totalTime[1]);

    let store_user_minutes = 0;
    if(attendance.overtimeCheckout){
      //store users total working minutes
      store_user_minutes = user_totalTime_toMinutes;
      if(status){
        singleEntryOT = store_user_minutes;
      }else if(attendance.overTime){
        singleEntryOT = (store_user_minutes - parseInt(attendance.totalMinutes));
      }
      
      overtime_minutes = overtime_minutes + singleEntryOT;
      // salary of 1 minutes based on users totalMinutes for halfday.
      let oT_minute_salary = (one_day_salary / parseInt(attendance.totalMinutes));
      oTRupees = (singleEntryOT * oT_minute_salary);
      // multiply one min salary with users working for halfday.
      overtime_rupees = overtime_rupees + oTRupees;

    }else{
    if(!status){
      if(user_totalTime_toMinutes > parseInt(attendance.totalMinutes)){
        // If user Minutes are greater than att settings totalMinutes
        store_user_minutes = (parseInt(attendance.totalMinutes));
      }else{
        //store users total working minutes
        store_user_minutes = user_totalTime_toMinutes;
        // reaming minutes of user.
        let halfDayMinutes = (parseInt(attendance.totalMinutes) - store_user_minutes);

        // Total half day minutes
        halfday_cut_minutes = (halfday_cut_minutes + halfDayMinutes);

        // salary of 1 minutes based on users totalMinutes for halfday.
        let one_minute_salary_halfDayMinutes = (one_day_salary / parseInt(attendance.totalMinutes));
        // multiply one min salary with users working for halfday.
        let working_minutes_salary_halfDayMinutes = (halfDayMinutes * one_minute_salary_halfDayMinutes);
        // Total halfday salary of month.
        halfday_cut_salary = halfday_cut_salary + working_minutes_salary_halfDayMinutes;

        if(attendance.attendanceType == 'Card'){
          // cut minutes if card mode.
          halfday_cut_minutes_card = halfday_cut_minutes_card + halfDayMinutes;
          halfDay_card_salary = halfDay_card_salary + working_minutes_salary_halfDayMinutes;
        }else if(attendance.attendanceType == 'Tracker'){
          halfday_cut_minutes_tracker = halfday_cut_minutes_tracker + halfDayMinutes;
          halfDay_tracker_salary = halfDay_tracker_salary + working_minutes_salary_halfDayMinutes;
        }else{
          halfday_cut_minutes_clientTracker = halfday_cut_minutes_clientTracker + halfDayMinutes;
          halfDay_clienttracker_salary = halfDay_clienttracker_salary + working_minutes_salary_halfDayMinutes;
        }
      }
    } 
    }
    
    // Total working minutes in month by user
    working_minutes = (working_minutes + store_user_minutes);
    // salary of 1 minutes based on users totalMinutes.
    let one_minute_salary = (one_day_salary / parseInt(attendance.totalMinutes));
    // multiply one min salary with users working
    let working_minutes_salary = (store_user_minutes * one_minute_salary);
    let workingMinutesSalaryOfMode = ((store_user_minutes - singleEntryOT) * one_minute_salary);

    // Total salary of month.
    total_salary = (total_salary + working_minutes_salary);

    // If user present on holiday then push that date.
    if(isHoliday){
      (++presetOn_holiday);present_holiday_date.push((moment(new Date(attendance.date)).format("YYYY-MM-DD")));
      holiday_minutes = (holiday_minutes + store_user_minutes);
      holiday_salary = (holiday_salary + working_minutes_salary);
    }
    // If user present on sunday then push that date.
    if(isSunday){
      (++presetOn_sunday);present_sunday_date.push((moment(new Date(attendance.date)).format("YYYY-MM-DD")));
      sunday_minutes = (sunday_minutes + store_user_minutes);
      sunday_salary = (sunday_salary + working_minutes_salary);
    }

    if(attendance.attendanceType == 'Card'){
      cardOTRupees = cardOTRupees + oTRupees;
      cardOT = cardOT + singleEntryOT;
      card_minutes = card_minutes + (store_user_minutes - singleEntryOT);
      card_presentDay = (++card_presentDay);
      cardWorkingRupees = cardWorkingRupees + workingMinutesSalaryOfMode;
    }else if(attendance.attendanceType == 'Tracker'){
      trackerOTRupees = trackerOTRupees + oTRupees;
      trackerOT = trackerOT + singleEntryOT;
      tracker_minutes = tracker_minutes + (store_user_minutes - singleEntryOT);
      tracker_presentDay = (++tracker_presentDay);
      trackerWorkingRupees = trackerWorkingRupees + workingMinutesSalaryOfMode;
    }else{
      clientTrackerOTRupees = clientTrackerOTRupees + oTRupees;
      clientTrackerOT = clientTrackerOT + singleEntryOT;
      clientTracker_minutes = clientTracker_minutes + (store_user_minutes - singleEntryOT);
      cTracker_presentDay = (++cTracker_presentDay);
      clientTrackerWorkingRupees = clientTrackerWorkingRupees + workingMinutesSalaryOfMode;
    }

    
   });
    
    //Deducted salary with total full leave
    
    let empLeaveAndPresentDays = await getUsersFullDayLeave(userId,allHolidaysOfMonth,start_of_month,end_of_month);
    let totalFullDayLeave = (empLeaveAndPresentDays.fullDayLeave);

    const halfdayAndFullDaySalary = (halfday_cut_salary + (totalFullDayLeave * one_day_salary));
    salaryObject.halfdayAndFullDaySalary =  halfdayAndFullDaySalary;
    //Full day cut salary
    salaryObject.fullDayCutSalary = (totalFullDayLeave * one_day_salary);

    // Total salary (working minutes salary)
    if(leaveCreditType == 'None'){
      salaryObject.total_salary = (total_salary-overtime_rupees);
      salaryObject.deductedLeaveEncashment = 0;
    }else{
      let leaveEcRupees;
      if(halfdayAndFullDaySalary > one_day_salary){
        leaveEcRupees = one_day_salary;
      }else if(halfdayAndFullDaySalary == 0){
        leaveEcRupees = 0;
      }else{
        leaveEcRupees = halfday_cut_salary;
      }
      //Deducted leave encashment
      salaryObject.deductedLeaveEncashment = leaveEcRupees;
      salaryObject.total_salary = (total_salary - overtime_rupees);
    }


    // Give holiday rupees
    let holiday_rupees = (one_day_salary * (month_holidays.length));
    if(leaveCreditType == 'None'){ total_salary = (total_salary + holiday_rupees); }else{ total_salary = (total_salary + one_day_salary+holiday_rupees); }
    

    // Total days of month
    salaryObject.totalDays =  total_days_ofMonth;
    // Total working days except holidays
    salaryObject.workingDays =  (total_days_ofMonth - month_holidays.length);
    //Total Sundays
    salaryObject.totalSundays =  month_sundays.length;
    // Total Holidays
    salaryObject.totalHolidays =  month_holidays.length;


    //get OT of all different modes.
    salaryObject.cardOT = cardOT;
    salaryObject.trackerOT = trackerOT;
    salaryObject.clientTrackerOT = clientTrackerOT;

    //get OT rupees of all different modes.
    salaryObject.cardOTRupees = cardOTRupees;
    salaryObject.trackerOTRupees = trackerOTRupees;
    salaryObject.clientTrackerOTRupees = clientTrackerOTRupees;

    //get rupees of all different modes.
    salaryObject.workingRupeesOfModes = (cardWorkingRupees + trackerWorkingRupees + clientTrackerWorkingRupees);
    salaryObject.cardWorkingRupees = cardWorkingRupees;
    salaryObject.trackerWorkingRupees = trackerWorkingRupees;
    salaryObject.clientTrackerWorkingRupees = clientTrackerWorkingRupees;

    //Present days including holidays
    salaryObject.monthly_attendance =  monthly_attendance.length;
    //Present days except holidays
    salaryObject.empPresentDays =  (empLeaveAndPresentDays.presentDay);
    //Present days by card
    salaryObject.card_presentDay =  card_presentDay;
    //Present days by tracker
    salaryObject.tracker_presentDay =  tracker_presentDay;
    //Present days by client tracker
    salaryObject.cTracker_presentDay =  cTracker_presentDay;
    
    //working minutes
    salaryObject.workingMinutes =  (working_minutes - overtime_minutes);
    //working minutes by card
    salaryObject.cardWorkingMinutes =  card_minutes;
    //working minutes by tracker
    salaryObject.trackerWorkingMinutes =  tracker_minutes;
    //working minutes by client tracker
    salaryObject.c_TrackerWorkingMinutes =  clientTracker_minutes;


    //Total half day minutes
    salaryObject.halfday_cut_minutes =  halfday_cut_minutes;
    //Total half day minutes by card
    salaryObject.halfday_cut_minutes_card =  halfday_cut_minutes_card;
    //Total half day minutes by tracker
    salaryObject.halfday_cut_minutes_tracker =  halfday_cut_minutes_tracker;
    //Total half day minutes by client tracker
    salaryObject.halfday_cut_minutes_clientTracker =  halfday_cut_minutes_clientTracker;


    //Half day cut salary
    salaryObject.halfday_cut_salary =  halfday_cut_salary;
    //Half day cut salary by card
    salaryObject.halfDay_card_salary =  halfDay_card_salary;
    //Half day cut salary by tracker
    salaryObject.halfDay_tracker_salary =  halfDay_tracker_salary;
    //Half day cut salary by client tracker
    salaryObject.halfDay_clienttracker_salary =  halfDay_clienttracker_salary;


    //Present on number of holidays
    salaryObject.presetOn_sunday = presetOn_sunday;
    //Present holidays dates
    salaryObject.present_sunday_date = present_sunday_date;
    //Present holidays minutes
    salaryObject.sunday_minutes = sunday_minutes;
    //Present holidays salary
    salaryObject.sunday_salary = sunday_salary;


    //Present on number of sundays
    salaryObject.presetOn_holiday = presetOn_holiday;
    //Present sundays dates
    salaryObject.present_holiday_date = present_holiday_date;
    //Present sundays minutes
    salaryObject.holiday_minutes = holiday_minutes;
    //Present sundays salary
    salaryObject.holiday_salary = holiday_salary;

    //Present salary amount
    salaryObject.salary_amount = salary_amount;
    //one day salary
    salaryObject.one_day_salary = one_day_salary;

    
    // Holiday rupees
    salaryObject.holiday_rupees = holiday_rupees;
    // Leave enchashment
    if(leaveCreditType == 'None'){
      salaryObject.leave_cashment = 0;
    }else{
     if(halfdayAndFullDaySalary > one_day_salary){
        salaryObject.leave_cashment = 0;
      }else if(halfdayAndFullDaySalary == 0){
        salaryObject.leave_cashment = one_day_salary;
      }else{
        salaryObject.leave_cashment = (one_day_salary - halfday_cut_salary);
      }
    } 
    // Final Salary
    salaryObject.finalSalary = Math.round(total_salary);

    // from date
    salaryObject.fromDate = start_of_month;
    // to date
    salaryObject.lastDate = last_dateMonth;

    // Overtime minutes/salary
    salaryObject.overtime_minutes = overtime_minutes;
    salaryObject.overtime_rupees = overtime_rupees;
    salaryObject.employeeTotalFullLeave = totalFullDayLeave;

    return salaryObject;

  } catch (error) {
    console.log(error);
  }
}

// Generate xls sheet
exports.generateXlsSheet = async (userID , month_Year ,salary_amount, leaveCreditType, empJoiningDate, payrollJoiningDate)=>{
  try {
    
    if(payrollJoiningDate){
      if((moment(month_Year).isSame((moment(new Date(empJoiningDate)).format("YYYY-MM"))))){
        empJoiningDate = payrollJoiningDate;
      }
    }
    
    let salaryObject = {};

    const selectedMonth = moment(month_Year).format("MM");
    const selectedYear = moment(month_Year).format("YYYY");

    let overtime_rupees = 0,overtime_minutes = 0;
    
    // User object ID
    const userId = userID;
    let totalDays_month;  
    // Starting and ending dates
    const start_of_month = month_Year+'-01';
    let last_dateMonth,range_holidays = [];
    let all_holidays = await getHolidays(month_Year);
    
    let month_sundays;
    const prevMonthLastDate = moment(selectedYear+"-"+selectedMonth).subtract(1,'months').endOf('month').format("YYYY-MM-DD");
    
    
    if((moment().format("YYYY-MM").toString()) == month_Year.toString()){
      // If month is current month then get up to todays date data
      last_dateMonth = moment().subtract(1, 'day').format("YYYY-MM-DD"); // get last date
      all_holidays.map((element)=>{

        if((moment(element).isBefore(moment().format("YYYY-MM-DD"))) ){
          range_holidays.push(element);
        }
      }); // get holidays
      totalDays_month = (moment(new Date())).diff(moment(start_of_month), 'days'); //get total days
      // Get all Sundays
      month_sundays = await getSundaysForSalary(prevMonthLastDate,last_dateMonth);
      
      
    }else{  
      last_dateMonth = moment(month_Year+"-01").endOf("month").format("YYYY-MM-DD");
      range_holidays = all_holidays;
      totalDays_month = (moment(month_Year, "YYYY-MM").daysInMonth());
      // Get all Sundays
      const nexMonthFirstDate = moment(selectedYear+"-"+selectedMonth).add(1,'months').startOf('month').format("YYYY-MM-DD");
      month_sundays = await getSundaysForSalary(prevMonthLastDate,nexMonthFirstDate);
    }
    
    const end_of_month = last_dateMonth;
    
    // Get all holidays
    let month_holidays = range_holidays;
    empJoiningDate = moment(new Date(empJoiningDate)).format("YYYY-MM-DD");
    let afterJoiningDateHolidays = [];
    month_holidays.map(holidayDate =>{
      if((moment(new Date(holidayDate)).isSame(new Date(empJoiningDate)) || (moment(new Date(holidayDate)).isAfter(new Date(empJoiningDate))))){
        afterJoiningDateHolidays.push(holidayDate);
      }
    })  
    
    month_holidays = afterJoiningDateHolidays;

    // for holiday
    let presetOn_holiday = 0,present_holiday_date = [],holiday_minutes =0 ,holiday_salary =0;
    //for sunday
    let presetOn_sunday = 0,present_sunday_date = [],sunday_minutes = 0,sunday_salary = 0;
    
    let total_salary = 0, halfday_cut_salary = 0, working_minutes = 0;
    let halfday_cut_minutes = 0,halfday_cut_minutes_card = 0,halfday_cut_minutes_tracker = 0;
    let halfday_cut_minutes_clientTracker = 0;
    
    let cardWorkingRupees = 0, trackerWorkingRupees = 0, clientTrackerWorkingRupees = 0;
    let singleEntryOT,oTRupees;

    let startDate = moment(start_of_month).startOf('day').toDate();
    let endDate = moment(end_of_month).endOf('day').toDate();

    startDate = (moment(startDate).format("YYYY-MM-DD"));
    endDate = (moment(endDate).format("YYYY-MM-DD"));

    startDate = (moment.tz(`${startDate} ${"00:00:59"}`, true, "Asia/Kolkata").format());
    endDate = (moment.tz(`${endDate} ${"23:59:59"}`, true, "Asia/Kolkata").format());

    // get array of records for that user id.
    let monthly_attendance = await ATTENDANCE.find({ user: userId,createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false },'totalTime totalMinutes overTime overtimeCheckout -_id attendanceType createdAt date').sort({createdAt: 1});
    
    
    // current salary.
    const salary = salary_amount;
    
    // Total days of month except sunday.
    const total_days_ofMonth = (totalDays_month-(month_sundays.length));
    
    // One day salary.
    const one_day_salary = (salary/total_days_ofMonth);

    // Merge all holidays and sundays
    let allHolidaysOfMonth = [...month_sundays,...month_holidays];
    
    monthly_attendance.map((attendance)=>{
    
    // check holiday and sunday
    let presentDate = moment(new Date(attendance.date)).format('YYYY-MM-DD').toString();
    let isHoliday = month_holidays.includes(presentDate);
    let isSunday = month_sundays.includes(presentDate);
    singleEntryOT = 0, oTRupees = 0;

    // Check status of date ,is holiday or not
    let status = allHolidaysOfMonth.includes((moment(new Date(attendance.date)).format("YYYY-MM-DD")).toString());
    

    // split totalTime by :
    let user_totalTime = attendance.totalTime.split(":");
    // convert hours to minutes
    let user_totalTime_toMinutes = parseInt(user_totalTime[0])*60+parseInt(user_totalTime[1]);

    let store_user_minutes = 0;
    if(attendance.overtimeCheckout){
      //store users total working minutes
      store_user_minutes = user_totalTime_toMinutes;
      if(status){
        singleEntryOT = store_user_minutes;
      }else if(attendance.overTime){
        singleEntryOT = (store_user_minutes - parseInt(attendance.totalMinutes));
      }
      
      overtime_minutes = overtime_minutes + singleEntryOT;
      // salary of 1 minutes based on users totalMinutes for halfday.
      let oT_minute_salary = (one_day_salary / parseInt(attendance.totalMinutes));
      oTRupees = (singleEntryOT * oT_minute_salary);
      // multiply one min salary with users working for halfday.
      overtime_rupees = overtime_rupees + oTRupees;

    }else{
    if(!status){
      if(user_totalTime_toMinutes > parseInt(attendance.totalMinutes)){
        // If user Minutes are greater than att settings totalMinutes
        store_user_minutes = (parseInt(attendance.totalMinutes));
      }else{
        //store users total working minutes
        store_user_minutes = user_totalTime_toMinutes;
        // reaming minutes of user.
        let halfDayMinutes = (parseInt(attendance.totalMinutes) - store_user_minutes);

        // Total half day minutes
        halfday_cut_minutes = (halfday_cut_minutes + halfDayMinutes);

        // salary of 1 minutes based on users totalMinutes for halfday.
        let one_minute_salary_halfDayMinutes = (one_day_salary / parseInt(attendance.totalMinutes));
        // multiply one min salary with users working for halfday.
        let working_minutes_salary_halfDayMinutes = (halfDayMinutes * one_minute_salary_halfDayMinutes);
        // Total halfday salary of month.
        halfday_cut_salary = halfday_cut_salary + working_minutes_salary_halfDayMinutes;

      }
    } 
    }
    
    // Total working minutes in month by user
    working_minutes = (working_minutes + store_user_minutes);
    // salary of 1 minutes based on users totalMinutes.
    let one_minute_salary = (one_day_salary / parseInt(attendance.totalMinutes));
    // multiply one min salary with users working
    let working_minutes_salary = (store_user_minutes * one_minute_salary);
    

    // Total salary of month.
    total_salary = (total_salary + working_minutes_salary);

    // If user present on holiday then push that date.
    if(isHoliday){
      (++presetOn_holiday);present_holiday_date.push((moment(new Date(attendance.date)).format("YYYY-MM-DD")));
      holiday_minutes = (holiday_minutes + store_user_minutes);
      holiday_salary = (holiday_salary + working_minutes_salary);
    }
    // If user present on sunday then push that date.
    if(isSunday){
      (++presetOn_sunday);present_sunday_date.push((moment(new Date(attendance.date)).format("YYYY-MM-DD")));
      sunday_minutes = (sunday_minutes + store_user_minutes);
      sunday_salary = (sunday_salary + working_minutes_salary);
    }

    });

    //Deducted salary with total full leave
    let totalFullDayLeave = total_days_ofMonth - (month_holidays.length + monthly_attendance.length);
    totalFullDayLeave = (totalFullDayLeave >= 0)? totalFullDayLeave : 0;

    const halfdayAndFullDaySalary = (halfday_cut_salary + (totalFullDayLeave * one_day_salary));
    salaryObject.halfdayAndFullDaySalary =  halfdayAndFullDaySalary;
    //Full day cut salary
    salaryObject.fullDayCutSalary = (totalFullDayLeave * one_day_salary);

    // Total salary (working minutes salary)
    if(leaveCreditType == 'None'){
      salaryObject.total_salary = (total_salary-overtime_rupees);
      salaryObject.deductedLeaveEncashment = 0;
    }else{
      let leaveEcRupees;
      if(halfdayAndFullDaySalary > one_day_salary){
        leaveEcRupees = one_day_salary;
      }else if(halfdayAndFullDaySalary == 0){
        leaveEcRupees = 0;
      }else{
        leaveEcRupees = halfday_cut_salary;
      }
      //Deducted leave encashment
      salaryObject.deductedLeaveEncashment = leaveEcRupees;
      salaryObject.total_salary = (total_salary - overtime_rupees);
    }


    // Give holiday rupees
    let holiday_rupees = (one_day_salary * (month_holidays.length));
    if(leaveCreditType == 'None'){ total_salary = (total_salary + holiday_rupees); }else{ total_salary = (total_salary + one_day_salary+holiday_rupees); }
    

    // Total days of month
    salaryObject.totalDays =  total_days_ofMonth;
    // Total working days except holidays
    salaryObject.workingDays =  (total_days_ofMonth - month_holidays.length);
    //Total Sundays
    salaryObject.totalSundays =  month_sundays.length;
    // Total Holidays
    salaryObject.totalHolidays =  month_holidays.length;


    //get rupees of all different modes.
    salaryObject.workingRupeesOfModes = (cardWorkingRupees + trackerWorkingRupees + clientTrackerWorkingRupees);
    

    //Present days
    salaryObject.monthly_attendance =  monthly_attendance.length;
    
    
    //working minutes
    salaryObject.workingMinutes =  (working_minutes - overtime_minutes);



    //Total half day minutes
    salaryObject.halfday_cut_minutes =  halfday_cut_minutes;
    //Total half day minutes by card
    salaryObject.halfday_cut_minutes_card =  halfday_cut_minutes_card;
    //Total half day minutes by tracker
    salaryObject.halfday_cut_minutes_tracker =  halfday_cut_minutes_tracker;
    //Total half day minutes by client tracker
    salaryObject.halfday_cut_minutes_clientTracker =  halfday_cut_minutes_clientTracker;


    //Half day cut salary
    salaryObject.halfday_cut_salary =  halfday_cut_salary;
  


    //Present on number of holidays
    salaryObject.presetOn_sunday = presetOn_sunday;
    //Present holidays dates
    salaryObject.present_sunday_date = present_sunday_date;
    


    //Present on number of sundays
    salaryObject.presetOn_holiday = presetOn_holiday;
    //Present sundays dates
    salaryObject.present_holiday_date = present_holiday_date;
    //Present sundays minutes
    salaryObject.holiday_minutes = holiday_minutes;
    //Present sundays salary
    salaryObject.holiday_salary = holiday_salary;

    //Present salary amount
    salaryObject.salary_amount = salary_amount;
    //one day salary
    salaryObject.one_day_salary = one_day_salary;

    
    // Holiday rupees
    salaryObject.holiday_rupees = holiday_rupees;
    // Leave enchashment
    if(leaveCreditType == 'None'){
      salaryObject.leave_cashment = 0;
    }else{
     if(halfdayAndFullDaySalary > one_day_salary){
        salaryObject.leave_cashment = 0;
      }else if(halfdayAndFullDaySalary == 0){
        salaryObject.leave_cashment = one_day_salary;
      }else{
        salaryObject.leave_cashment = (one_day_salary - halfday_cut_salary);
      }
    } 
    // Final Salary
    salaryObject.finalSalary = Math.round(total_salary);

    // from date
    salaryObject.fromDate = start_of_month;
    // to date
    salaryObject.lastDate = last_dateMonth;

    // Overtime minutes/salary
    salaryObject.overtime_minutes = overtime_minutes;
    salaryObject.overtime_rupees = overtime_rupees;
    salaryObject.employeeTotalFullLeave = totalFullDayLeave;
    
    return salaryObject;

  } catch (error) {
    console.log(error);
  }
}

// Get Xls record
exports.getXlsRecord = async (_id, monthYear, employee, salaryInfoObj)=>{
  try {
    let bankName = "-";
    let accountNumber = "-";
    let ifscCode = "-",payStatus = '-';
    if (employee.accountNumber) {
      accountNumber = (employee.accountNumber);
    }
    if (employee.bankId) {
      bankName = employee.bankId.bankName;
      payStatus = employee.bankId.bankName.split(" ");
      payStatus = payStatus[0].toUpperCase();
      if(payStatus == 'ICICI'){
        payStatus = 'I';
      }else{
        payStatus = 'N';
      }
    }
    if (employee.ifscCode) {
      ifscCode = employee.ifscCode;
    }
    
    
    let employeeXlsData = {};
    let salaryslip = await SALARY.findOne({ user: _id, monthYear: monthYear});
    let specialAllowance,bonus,petrolAllowance,shift,professionalTax,esic,securityDeposit,tds,pf,other;
    if(salaryslip){
      specialAllowance = Number(salaryslip.specialAllowance);
      bonus = Number(salaryslip.bonus);
      petrolAllowance = Number(salaryslip.petrolAllowance);
      shift = Number(salaryslip.shift);
      professionalTax = Number(salaryslip.professionalTax);
      esic = Number(salaryslip.esic);
      securityDeposit = Number(salaryslip.securityDeposit);
      tds = Number(salaryslip.tds);
      pf = Number(salaryslip.pf);
      other = Number(salaryslip.other);
    }else{
      specialAllowance = 0;
      bonus = 0;
      petrolAllowance = 0;
      shift = 0;
      professionalTax = 0;
      esic = 0;
      securityDeposit = 0;
      tds = 0;
      pf = 0;
      other = 0;
    }

    employeeXlsData.employeeCode = employee.attendanceCode;
    employeeXlsData.ifscCode = ifscCode;
    employeeXlsData.employeeName = employee.firstName + " " + employee.middleName + " " + employee.lastName;
    employeeXlsData.birthDate = moment(employee.birthDate).format("DD-MM-YYYY");
    employeeXlsData.department = employee.department.departmentName;
    employeeXlsData.designation = employee.designation.designationName;
    employeeXlsData.basicPay =  Number((salaryInfoObj.total_salary + salaryInfoObj.holiday_rupees + salaryInfoObj.deductedLeaveEncashment).toFixed(2));
    employeeXlsData.overtimeAllowance = Number((salaryInfoObj.overtime_rupees).toFixed(2));
    employeeXlsData.specialAllowane = Number(specialAllowance);
    employeeXlsData.leaveEncashment = Number((salaryInfoObj.leave_cashment).toFixed(2));
    employeeXlsData.petrol = petrolAllowance;
    employeeXlsData.shift = shift;
    employeeXlsData.bonus = bonus;
    employeeXlsData.professionalTax = professionalTax;
    employeeXlsData.securityDeposit = securityDeposit;
    employeeXlsData.tds = tds;
    let earings = (salaryInfoObj.finalSalary+specialAllowance+bonus+petrolAllowance+shift);
    let deduction = (professionalTax + esic + securityDeposit + tds + pf + other);
    employeeXlsData.netPay = Number(( earings - deduction).toFixed(2));
    employeeXlsData.bankName = bankName;
    employeeXlsData.accountNumber = accountNumber;
    employeeXlsData.pf = pf;
    employeeXlsData.other = other;
    employeeXlsData.esic = esic;
    employeeXlsData.payStatus = payStatus;
    employeeXlsData.remark = `Sal ${moment(new Date(monthYear)).format("MMM")} ${employee.firstName.replace(/ /g,'')}${employee.middleName.replace(/ /g,'')}${employee.lastName.replace(/ /g,'')}`;
    return employeeXlsData;

  } catch (error) {}
}

// Get users overtime records
exports.getOvertimeRecordsOfUser = async (userId,attendanceMonth) => {
  try {
    
		const _id = userId;
		
		const selectedDate = moment(new Date(attendanceMonth)).format("YYYY-MM"); //2021-06

		const startDate = selectedDate+"-01";
		const endDate = moment(selectedDate+"-01").endOf("month").format("YYYY-MM-DD");

		let prevStartDate = moment(moment(startDate)).startOf('day').toDate();
    let prevEndDate = moment(moment(endDate)).endOf('day').toDate();
    
    prevStartDate = (moment(prevStartDate).format("YYYY-MM-DD"));
    prevEndDate = (moment(prevEndDate).format("YYYY-MM-DD"));

    prevStartDate = (moment.tz(`${prevStartDate} ${"00:00:59"}`, true, "Asia/Kolkata").format());
    prevEndDate = (moment.tz(`${prevEndDate} ${"23:59:59"}`, true, "Asia/Kolkata").format());

    // Get all Sundays
    let month_sundays = await getSundays(selectedDate);
        
    // Get all holidays
    let month_holidays = await getHolidays(selectedDate);
    let allHolidays = [...month_sundays,...month_holidays]

    let holidayDatetoString = [];
    allHolidays.forEach(element=>{
      holidayDatetoString.push((new Date(element)).toDateString());
    })     

    const overimeRecord= await ATTENDANCE.find({
       user: _id,
       $or: [{ overTime:{ $ne: null } }, { date:{ $in: holidayDatetoString } }],
       createdAt: {$gte :prevStartDate ,$lte :prevEndDate },
       isDeleted: false 
    }).sort({createdAt:1});
    return overimeRecord;


  } catch (error) {
    next(error);
  }
};

exports.getSalarySlip = async (req, res, next) => {
  const _id = req.query.userID;
  const month_year = req.query.month_Year;
  return res.redirect(`/admin/view/salarySlip/${_id}?salaryMonth=${month_year}`);
}

const setUnsetExtraMinutes = async (element, status, payload) => {
  try {
    let setPayload = {};
    const user = await USER.findOne({ _id: element.user, isDeleted: false, isLeft: false });
    // split totalTime by :
    let userTotalTime = element.totalTime.split(":");
    let storeUserMinutes = parseInt(userTotalTime[0])*60+parseInt(userTotalTime[1]);
    if(status){
      //Unset minutes
      storeUserMinutes = (storeUserMinutes - parseInt(element.extraMinutes));
    }else{
      //Set minutes
      storeUserMinutes = (storeUserMinutes + parseInt(payload.extraMinutes));
    }
    setPayload.totalTime = (Math.floor(storeUserMinutes / 60) + ':' + storeUserMinutes % 60);
    
    if(storeUserMinutes > (parseInt(element.totalMinutes) + (parseInt(user.overTimeMinute)))){
      setPayload.overTime = (storeUserMinutes - parseInt(element.totalMinutes));
    }else{
      setPayload.overTime = null;
    }
    if(status){
      //unset field
      setPayload.extraMinutes = null;
      setPayload.extraMinutesReason = null;
      await ATTENDANCE.findOneAndUpdate({ _id: element._id, isDeleted: false }, setPayload);
    }else{
      //Set fields
      setPayload.extraMinutes = payload.extraMinutes;
      setPayload.extraMinutesReason = payload.extraMinutesReason;
    }
    return setPayload;  
  } catch (error) {
    console.log(error);
  }
};

exports.addExtraMinutes = async (req, res, next) => {
  try{
    //Add extra minutes in attendance of selected users.
    
    let payload = req.body;
    
    var bulkTeamUpdate = ATTENDANCE.collection.initializeOrderedBulkOp();

    // Get HR role.
    const hrRoleID = await ROLE.findOne({ name: new RegExp('HR', "i") }, "_id");
    
    let hrObject = await USER.find({ isDeleted: false, isLeft: false,role : hrRoleID },"_id");
    
    let hrObjectId = [];
    hrObject.map(element=>{
      hrObjectId.push(String(element._id));
    });
    
    let loginUserId = req.session.user._id;
    let loginUserStatus;

    //Set condition
    let _condition = {};
    _condition.isDeleted = false;
    _condition._id = { $in : payload.attendanceId };
    _condition.endTime = {$ne: null};
    

    if(JSON.stringify(hrObjectId).includes(loginUserId.trim())){
      _condition.user = {$nin: hrObjectId };
      // Check from selected attendance, HR's id is also selected or not
      let attendanceUser = await ATTENDANCE.find(
        { isDeleted: false,_id : { $in : payload.attendanceId }, endTime: {$ne: null}, user: {$in: hrObjectId}}
      );
      if(attendanceUser.length > 0){
        loginUserStatus = 'HR';
      }else{
        loginUserStatus = 'Admin';
      }
    }else{
      loginUserStatus = 'Admin';
    }
    

    // Get all attendance record except HR record.
    _condition.extraMinutes = {$ne: null};
    let unsetAttendance = await ATTENDANCE.find(_condition);
    
    
    
    // If extra minute is already set then first unset to it.
    for(element of unsetAttendance){
      // Here true arg means already there is no extra minutes are available.
      await setUnsetExtraMinutes(element,true,payload);
    }

    // After unset, again set new extra minutes
    _condition.extraMinutes = {$eq: null};
    let setAttendance = await ATTENDANCE.find(_condition);
    
    if(setAttendance.length > 0){
      for(element of setAttendance){
        // Here false arg means already there is no extra minutes are available.
        let setPayload = await setUnsetExtraMinutes(element,false,payload);
        bulkTeamUpdate.find({ _id: element._id, isDeleted: false }).update({ $set: setPayload });
      }
      await bulkTeamUpdate.execute();
    }
    
    return res.send({loginUser: loginUserStatus});
  }catch(error){
    console.log(error);
  }  
};

exports.unsetExtraMinutes = async (req, res, next) => {
  try{
    let attendanceRecord = await ATTENDANCE.findOne(
      { isDeleted: false,_id : req.query.attendanceId, endTime: {$ne: null}, extraMinutes: {$ne: null} }
    );
    await setUnsetExtraMinutes(attendanceRecord,true,{});
    return res.send({status: true});
  }catch(error){
    console.log(error);
  }  
};

exports.checkOverTime = async (req, res, next) => {
  try{
    const { userID, attendanceMonth, ckbCheckAllStatus } = req.body;
    
    if(userID && attendanceMonth) {
      const selectedDate = moment(new Date(attendanceMonth)).format("YYYY-MM"); //2021-06
  
      const startDate = selectedDate+"-01";
      const endDate = moment(selectedDate+"-01").endOf("month").format("YYYY-MM-DD");
  
      let prevStartDate = moment(moment(startDate)).startOf('day').toDate();
      let prevEndDate = moment(moment(endDate)).endOf('day').toDate();
  
      prevStartDate = (moment(prevStartDate).format("YYYY-MM-DD"));
      prevEndDate = (moment(prevEndDate).format("YYYY-MM-DD"));
  
      prevStartDate = (moment.tz(`${prevStartDate} ${"00:00:59"}`, true, "Asia/Kolkata").format());
      prevEndDate = (moment.tz(`${prevEndDate} ${"23:59:59"}`, true, "Asia/Kolkata").format());
  
      
      // Get all Sundays
      let month_sundays = await getSundays(selectedDate);
      
      // Get all holidays
      let month_holidays = await getHolidays(selectedDate);
      let allHolidays = [...month_sundays,...month_holidays]
      
      let holidayDatetoString = [];
      allHolidays.forEach(element=>{
        holidayDatetoString.push((new Date(element)).toDateString());
      })

      const conditionQuery = { 
        user: userID, 
        createdAt: {$gte :prevStartDate ,$lte :prevEndDate },
        $or: [{ overTime:{ $ne: null } }, { date:{ $in: holidayDatetoString } }],
        isDeleted: false };

      await ATTENDANCE.updateMany(
        conditionQuery,
      { $set: { overtimeCheckout : ckbCheckAllStatus }},
      { new: true });
      
    }
    
    res.send(true);
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.deleteAttendance = async (req, res, next) => {
  try{
    const attendanceId = req.query.attendanceId;
    const user = req.query.user;
    const attendanceDateToDelete = req.query.date;
    
    //Delete attendance record.
    await ATTENDANCE.findOneAndUpdate(
      { _id: attendanceId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    // Delete attendance logs.
    const selectedDateForDelete = moment(new Date(attendanceDateToDelete)).format("YYYY-MM-DD");
    const prevUTCDate = moment(selectedDateForDelete).subtract(1, 'day').format("YYYY-MM-DD");
    
    // Date range for attendance log.
    const startTimeRange = `${prevUTCDate}T18:29:59.000Z`;
    const endTimeRange = `${selectedDateForDelete}T18:29:59.000Z`;
    

    await ATTENDANCELOGS.updateMany(
      { user: user, createdAt: { $gte: startTimeRange, $lte: endTimeRange }, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true });

    
    res.send({ status: true});
  }catch(error){
    console.log(error);
    next(error);
  }  
}

exports.deleteAttendanceLog = async (req, res, next) => {
  try{
    const attendanceLogId = req.query.attendanceLogId;
    const user = req.query.user;
    const attendanceDateToDelete = req.query.date;

    //Get date range
    const sessionDate = moment(new Date(attendanceDateToDelete)).format("YYYY-MM-DD");
    const sessionPrevDate = moment(sessionDate).subtract(1, 'day').format("YYYY-MM-DD");
    const startTimeRange = `${sessionPrevDate}T18:29:59.000Z`;
    const endTimeRange = `${sessionDate}T18:29:59.000Z`;

    const countAttendanceLogs = await ATTENDANCELOGS.countDocuments({ user: user, createdAt: { $gte: startTimeRange ,$lte: endTimeRange }, isDeleted: false });
    
    //Check how many attendance logs available,if only 1 log then dont delete to it.
    if(countAttendanceLogs > 1){
      // Delete attendance log.
      await ATTENDANCELOGS.findOneAndUpdate(
        { _id: attendanceLogId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );

      // Update attendance.
      const allAttendanceLogs = await ATTENDANCELOGS.find({ user: user, createdAt: { $gte: startTimeRange ,$lte: endTimeRange }, isDeleted: false, endTime: { $ne: null } });
      // Get total minutes of user from attendance record.
      const attendanceModel = await ATTENDANCE.findOne({ user: user, date: attendanceDateToDelete, isDeleted: false });

      // Update attendance session
      const attendanceLogLastRecord = await ATTENDANCELOGS.findOne({ user: user, createdAt: { $gte :startTimeRange ,$lte :endTimeRange }, isDeleted: false }).sort({createdAt: -1});
      const attendanceLogFirstRecord = await ATTENDANCELOGS.findOne({ user: user, createdAt: { $gte :startTimeRange ,$lte :endTimeRange }, isDeleted: false }).sort({createdAt: 1});
      const userData = await USER.findOne({ _id: user, isDeleted: false, isLeft: false });

      let updateSessionQuerys = {
        $set: {
          end: true,
          startTime: attendanceLogFirstRecord.startTime,
          endTime: attendanceLogLastRecord.endTime, 
        },
      };

      let totalMinutesOfAllLogs = 0;
      allAttendanceLogs.forEach(element=>{
        //Get difference between all logs.
        let endTime = moment(element.endTime);
        let startTime = moment(element.startTime);
        let minuteDiffBtnLastLog = endTime.diff(startTime, 'minutes');
        totalMinutesOfAllLogs = totalMinutesOfAllLogs + parseInt(minuteDiffBtnLastLog);
      });
      
      let extraMinutes = 0;
      if(attendanceModel.extraMinutes){
        extraMinutes = parseInt(attendanceModel.extraMinutes);
      }

      let workingMinutes = (totalMinutesOfAllLogs + extraMinutes);
      let overTime = null;

      if(workingMinutes > (parseInt(userData.overTimeMinute) + parseInt(attendanceModel.totalMinutes))){
        overTime = (workingMinutes - (parseInt(attendanceModel.totalMinutes)));
      }else{
        updateSessionQuerys.$set.overtimeCheckout = false;
      }
      updateSessionQuerys.$set.overTime = overTime;
      updateSessionQuerys.$set.totalTime = (Math.floor(workingMinutes / 60) + ':' + workingMinutes % 60);
      
      
      await ATTENDANCE.findOneAndUpdate(
        { user: user, date: attendanceDateToDelete, isDeleted: false },
        updateSessionQuerys,
        { new: true }
      );

      res.send({ status: true });
    }else{
      res.send({ status: false });
    }
  }catch(error){
    console.log(error);
    next(error);
  }  
}