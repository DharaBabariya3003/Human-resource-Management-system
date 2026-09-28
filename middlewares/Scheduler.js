const cron = require("node-cron");
const USER = require("../models/user");
const NOTIFICATION = require("../models/notification");
const PAYROLL = require("../models/payroll");
const INTERVIEW = require("../models/interview");
const INTERVIEWNOTIFICATION = require("../models/interviewNotification");
const ATTENDANCECAPTURE = require("../models/attendanceCapture");
const { sendMail } = require("../utils/sendMail");
const moment = require("moment");
const { deleteFile } = require("../services/s3");
const ROLE = require("../models/role");
const { NOTIFICATION_TYPES } = require('../enum');
const ATTENDANCE = require("../models/attendance");
const ATTENDANCELOGS = require("../models/attendanceLogs");
const { createNotificationObject,createEmpAnniversayObject,getAllUserIds,getUserAndHrId,storeResignationNotification,storeInterviewNotification } = require("../utils/notification");


cron.schedule("1 30 02 * * *", async () => {
  try {
  //Get todays's date
  let todayDay = new Date().getDate();
  let todayMonth = new Date().getMonth();
  let todayDate = `${todayDay}:${todayMonth + 1}`;
  //User Employment date range
  const startDayForEmployement = moment().startOf('day').toDate();
  let nextDateForEmployement = moment().add(3,'days').format("YYYY-MM-DD");
  const endDayForEmployement = moment(nextDateForEmployement).endOf('day').toDate();

  const role = await ROLE.findOne({ name: new RegExp("admin", "i") });
  const adminId = await USER.findOne({ role: role._id});
  const adminAndHrId = await getUserAndHrId();
  const employee = await USER.find({ isDeleted: false, isLeft: false });

  const allUsers = await getAllUserIds();

  for (let element of employee) {

    if(element.payrollID){
      //Employee Annevarsary
      let payrollData = await PAYROLL.findOne({ _id: element.payrollID,isDeleted: false }).populate('user');
      
     if(payrollData && payrollData.joiningDate && moment(payrollData.joiningDate).isBefore(moment(new Date()).format("YYYY-MM-DD"))){
      
      let empAnnevarsary_day = new Date(payrollData.joiningDate).getDate();
      let empAnnevarsary_month = new Date(payrollData.joiningDate).getMonth();
      let empAnnevarsaryDate = `${empAnnevarsary_day}:${empAnnevarsary_month + 1}`;

      let empAnnevarsaryMsgUsers = [];
      if (todayDate == empAnnevarsaryDate) {
        if(!(String(adminAndHrId)).includes(String(element._id))){
          empAnnevarsaryMsgUsers.push(element._id);
        }
        empAnnevarsaryMsgUsers = empAnnevarsaryMsgUsers.concat(adminAndHrId);
        let result = createEmpAnniversayObject(empAnnevarsaryMsgUsers,payrollData,adminAndHrId,NOTIFICATION_TYPES.EMPLOYEE_ANNIVERSARY);
        await NOTIFICATION.insertMany(result);
      }
     }

     //User Employment
     let empEmploymentMsg = [];
     if(payrollData && payrollData.trainingEndDate){
      if(moment(new Date(payrollData.trainingEndDate),'YYYY-MM-DD').isBetween(moment(new Date(startDayForEmployement)), moment(new Date(endDayForEmployement)))){
        if(!(String(adminAndHrId)).includes(String(element._id))){
          empEmploymentMsg.push(element._id);
        }
        empEmploymentMsg = empEmploymentMsg.concat(adminAndHrId);
        let employmentResult = createEmpAnniversayObject(empEmploymentMsg,payrollData,adminAndHrId,NOTIFICATION_TYPES.EMPLOYMENT);
        await NOTIFICATION.insertMany(employmentResult);
      }
     }

     //User Bond complete
     let empBondCompleteMsg = [];
     if(payrollData && payrollData.bondCompletedDate){
      if(moment(new Date(payrollData.bondCompletedDate),'YYYY-MM-DD').isBetween(moment(new Date(startDayForEmployement)), moment(new Date(endDayForEmployement)))){
        if(!(String(adminAndHrId)).includes(String(element._id))){
          empBondCompleteMsg.push(element._id);
        }
        empBondCompleteMsg = empBondCompleteMsg.concat(adminAndHrId);
        let employmentResult = createEmpAnniversayObject(empBondCompleteMsg,payrollData,adminAndHrId,NOTIFICATION_TYPES.BOND_COMPLETION);
        await NOTIFICATION.insertMany(employmentResult);
      }
     }

    }
    
    //Birthday
    let birth_day = new Date(element.birthDate).getDate();
    let birth_month = new Date(element.birthDate).getMonth();
    let birthDate = `${birth_day}:${birth_month + 1}`;
    
    if (todayDate == birthDate) {
      let result = createNotificationObject(allUsers,element._id,NOTIFICATION_TYPES.BIRTHDAY,element);
      await NOTIFICATION.insertMany(result);
    }

    //Marriage Annevarsary
    if(element.marriageDate){
      let marriage_day = new Date(element.marriageDate).getDate();
      let marriage_month = new Date(element.marriageDate).getMonth();
      let marriageDate = `${marriage_day}:${marriage_month + 1}`;

      if(todayDate == marriageDate){
        let result = createNotificationObject(allUsers,element._id,NOTIFICATION_TYPES.MARRIAGE_ANNIVERSARY,element);
        await NOTIFICATION.insertMany(result);
      }
    }
  }
  
  //Resign Employee Notification
  const startDayForResign = moment().startOf('day').toDate();
  let nextDateForResign = moment().add(3,'days').format("YYYY-MM-DD");
  const endDayForResign = moment(nextDateForResign).endOf('day').toDate();  
  const resignEmployees = await USER.find({ lastDate:{ $gte :startDayForResign ,$lte :endDayForResign},isDeleted: false, isLeft: false });
  if(resignEmployees && resignEmployees.length > 0){
    for (const resignEmployee of resignEmployees) {
      await storeResignationNotification(resignEmployee,NOTIFICATION_TYPES.RESIGNATION_REQUEST);
    }
  }

  //Interview Notification
  var roleObj = {HR_Recruiter:"HR Recruiter",HR:"HR",admin:'admin'};
  const roleIds = await ROLE.find({ name: new RegExp(Object.keys(roleObj).join("|"), "i") }, "_id");
  let notificationOfInterviewUser = await USER.find(
    { isDeleted: false, isLeft: false,role : { $in : roleIds } },
      "_id firstName middleName lastName attendanceCode"
  );
  const interviewCandidate = await INTERVIEW.find({ isDeleted: false, interviewStatus: false, interviewTime:{ $gte :startDayForResign ,$lte :endDayForResign} });
  if(interviewCandidate && interviewCandidate.length > 0){
    for (const interviewUser of interviewCandidate) {
      await storeInterviewNotification(notificationOfInterviewUser,interviewUser,NOTIFICATION_TYPES.INTERVIEW);
    }
  }



  //Attendance Capture Remove
  const threeMonthPreviousdate=moment().subtract(3, 'months').format('YYYY-MM-DD');
  const end = moment(threeMonthPreviousdate).endOf('day').toDate(); 
  ATTENDANCECAPTURE.updateMany({"createdAt":{ $lte : end }}, {"$set":{"isS3Removed": true}}, {"multi": true}, (err, writeResult) => {});
  
  let attendanceLogCapture = await ATTENDANCECAPTURE.find({ isS3Removed: true });

  attendanceLogCapture.forEach(async element => {
    let deleteFilePath = `users/${element.user}/attendance/original/${element.key}`;
    await deleteFile(deleteFilePath);
  });
  }catch (error) {}
});


cron.schedule("59 59 23 * * *", async () => {  
  try {
    // End the active session of tracker mode users.
    const startDate = moment().startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();
    const today = new Date().toDateString();
    
    const nextDay = new Date(moment().add(1,'day')).toDateString();
    let nextDayStartTime = moment().add(1,'day').format("YYYY-MM-DD");
    
    
    nextDayStartTime = moment.tz(`${nextDayStartTime} ${"00:00:59"}`, true, "Asia/Kolkata").format();
    
    
    const todaysDate = moment().format('YYYY-MM-DD');
    const todaysDateEndTime = moment.tz(`${todaysDate} ${"23:59:59"}`, true, "Asia/Kolkata").format();
    
    // Find all attendance logs in which endTime is not set.
    const attendanceLogRecord = await ATTENDANCELOGS.find({
      attendanceMode: new RegExp('Tracker', "i"),
      createdAt: { $gte :startDate ,$lte :endDate },
      endTime: null,
      isDeleted: false }
    ).populate('user');
    
    if(attendanceLogRecord.length > 0){
      for(element of attendanceLogRecord){
        // To stop prev session
        const query = { $set: { endTime: todaysDateEndTime }};
        const attendanceLogsEntry = await ATTENDANCELOGS.findOneAndUpdate(
          { _id: element._id },
          query ,{ new: true }
        );

        let workingMinutes = await timeDifferenceBtnStartAndEnd(attendanceLogsEntry.endTime,attendanceLogsEntry.startTime,element.user._id,today)
        let overTime = null;
            
        if(workingMinutes > (parseInt(element.user.overTimeMinute) + parseInt(element.user.totalMinutes))){
          overTime = (workingMinutes - (parseInt(element.user.totalMinutes)));
        }
        const querys = {
          $set: {          
            end: true,
            endTime: todaysDateEndTime,
            totalTime: (Math.floor(workingMinutes / 60) + ':' + workingMinutes % 60),
            overTime: overTime,
          },
        };

        await ATTENDANCE.findOneAndUpdate(
          { user: element.user._id, date: today },
          querys,{ new: true }
        );
        // Start new Session
        let attendancePayload = {
          startTime : nextDayStartTime,
          date : nextDay,
          user : element.user._id,
          start : true,
          totalTime : '00:00',
          attendanceType : element.user.attendanceType,
          totalMinutes: element.user.totalMinutes,
          createdAt: nextDayStartTime,
        };
        await ATTENDANCE.create(attendancePayload);
        /* If user scan attendance for second time*/
        let attendanceLogPayload = {
          attendanceMode : element.user.attendanceType,
          startTime : nextDayStartTime,
          user : element.user._id,
          createdAt: nextDayStartTime,
        };
        await ATTENDANCELOGS.create(attendanceLogPayload);
      }
    }
  }catch (error) {console.log(error);}
},{ timezone:"Asia/Kolkata" });


const convertHoursToMinutes = (hours =>{
  let splittedTime = hours.split(":");
  let hoursToMinutes = (parseInt(splittedTime[0])*60+parseInt(splittedTime[1]));
  return hoursToMinutes;
})


const timeDifferenceBtnStartAndEnd = async(logEndTime,logStartTime,userId,currentDate)=>{
  try {
    let endTime = moment(logEndTime);
    let startTime = moment(logStartTime);
  
    let minuteDiffBtnLastLog = endTime.diff(startTime, 'minutes');
    const attendance = await ATTENDANCE.findOne({ user: userId, date: currentDate });
    
    let hoursToMinutes = convertHoursToMinutes(attendance.totalTime);
    let workingMinutes = (parseInt(minuteDiffBtnLastLog) + hoursToMinutes);
    return workingMinutes;
  }catch (error) {}
}