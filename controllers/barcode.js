const USER = require("../models/user");
const ATTENDANCE = require("../models/attendance");
const ATTENDANCELOGS = require("../models/attendanceLogs");
const ATTENDANCECAPTURE = require("../models/attendanceCapture");
const moment = require("moment");
const { uploadFile } = require("../services/s3");
const sharp = require('sharp');
const INTERVIEW = require("../models/interview");
const { setHttpContextValue } = require("../utils/log");

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

const getTimeDiff = (startTime,endTime)=>{
  let entryTime = moment.duration(startTime, "HH:mm ");
  let exitTime = moment.duration(endTime, "HH:mm ");
  let diff = exitTime.subtract(entryTime);
  const diffH = diff.hours();
  const diffM = diff.minutes();
  const workingHours = diffH + ":" + diffM;
  return workingHours ;
}

const getHoursToMinutes = (completedHours)=>{
   const hourAndMinutes = moment.duration(completedHours, "HH:mm ");
   const hoursCompleted = hourAndMinutes.hours();
   const minutesCompleted = hourAndMinutes.minutes();
   const workingMinutes = hoursCompleted * 60 + minutesCompleted;
   return workingMinutes;
}

let getHoursAndMinutes = (endTime,officeEndTime)=>{
  let userEt = moment.duration("" + endTime, "HH:mm ");
  let officeEt = moment.duration("" + officeEndTime,"HH:mm");
  const diffU = userEt.subtract(officeEt);
  const diffHU = diffU.hours();
  const diffMU = diffU.minutes();
  return [diffHU,diffMU]

}
let splitcompletedHours = (completedHours)=>{
  let hoursAndMinutes = completedHours.split(":");
  let result;
  if(parseInt(hoursAndMinutes[0]) == 0){
    result = hoursAndMinutes[1]+" Minutes "
  }else{
    result = hoursAndMinutes[0]+" hours "+hoursAndMinutes[1]+" Minutes ";
  }
  return result;
}
const endTimeEntry = async function (req, res,attendanceLogRecord, user, attendance) {
  let today = new Date();
  let todayDateString = today.toDateString();
  let overTime = null;
  const id = user._id;
  let completedHoursTotalTime ;
  const endTimeUTC = moment().utc().format();
  const endTime = moment().utc().format("HH:mm")
  //const endTime = "13:00";

  /* Get difference between entry and exit time in hours*/
  let workingHours = getTimeDiff(getUtcHnM(attendanceLogRecord.startTime),endTime);
  

  /* Add current total working hours with attendance hours*/
  let totalHours=moment(workingHours, 'HH:mm ').add(moment.duration(attendance.totalTime));
  const completedHours= moment(totalHours).format("HH:mm");
  completedHoursTotalTime = completedHours;

  const completedHoursToFormat = splitcompletedHours(completedHours);

   /* Get total completed minutes */
  let workingMinutes = getHoursToMinutes(completedHours);
  let leaveReasonQuery = null,overtimeReasonQuery = null;
   
   if (req.query.leaveReason) {
    leaveReasonQuery = req.query.leaveReason;
  } else {
    req.query.leaveReason = null;
    leaveReasonQuery = "";
  }
  if (req.query.overtimeReason) {
    overtimeReasonQuery = req.query.overtimeReason;
  } else {
    req.query.overtimeReason = null;
    overtimeReasonQuery = "";
  }

  /* If working minutes are less then users total working minutes then ask leave reason*/
  if (parseInt(workingMinutes) < parseInt(user.totalMinutes)) {
    if (!req.query.leaveReason) {
      res.status(422).json({
        status: false,
        message: 'Why you are going early ?',
        data: {
          leave: true,
          totalTime : completedHoursToFormat,
        },
      });
      return;
    }
   }else{
     if ((parseInt(workingMinutes) >=parseInt(user.totalMinutes)) && parseInt(workingMinutes)<=(parseInt(user.overTimeMinute) + parseInt(user.totalMinutes))) {
      
       let diffHM = getHoursAndMinutes(endTime,getUtcHnM(user.officeEndTime));
       if (diffHM[0] < 0 || diffHM[1] < 0) {

        if (!req.query.leaveReason) {
          res.status(422).json({
            status: false,
            message: 'Why you are going early ?',
            data: {
              leave: true,
              totalTime : completedHoursToFormat,
            },
          });
          return;
        }
      }else{
      }
    }
    else{
      let diffHM = getHoursAndMinutes(endTime,getUtcHnM(user.officeEndTime))
      if (diffHM[0] < 0 || diffHM[1] < 0) {
        if (!req.query.overtimeReason) {
          res.status(422).json({
            status: false,
            message: 'Why you are going early ? || overtime reason ?',
            data: {
              leave: true,
              overtime: true,
              totalTime : completedHoursToFormat,
            },
          });
          return;
        }
      } else {
        if (!req.query.overtimeReason) {
          res.status(422).json({
            status: false,
            message: "Why you are going late ?",
            data: {
              overtime: true,
            },
          });
          return;
        }
      }
    }
     
   }
  
   if (req.query.overtimeReason ||(req.query.overtimeReason && req.query.leaveReason)) {
    overtimeReasonQuery = req.query.overtimeReason;
    leaveReasonQuery = req.query.leaveReason;
    workingHourss = getTimeDiff(getUtcHnM(user.officeStartTime),getUtcHnM(user.officeEndTime));

  /* Store totalMinutes*/
    //completedHoursTotalTime = workingHourss;

    /* Overtime minutes */
    
    workingHourssT = getTimeDiff(workingHourss,completedHours);
    let totalWorkingMinutes = getHoursToMinutes(workingHourssT);
    overTime = totalWorkingMinutes;
    }

    const startDate = moment().startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    const query = {
    $set: {
      endTime : endTimeUTC,
      end : true,
      totalTime : completedHoursTotalTime,
      overTime : overTime,
      totalMinutes: user.totalMinutes,
    },
  };
  const attendanceEntry = await ATTENDANCE.findOneAndUpdate(
    { user: id, date: todayDateString, createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false},
    query,{ new: true }
  );

  
  let attendanceLog = await ATTENDANCELOGS.findOneAndUpdate(
    { _id: attendanceLogRecord._id, user: id, createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false },
    {$set: { endTime: endTimeUTC,leaveReason: leaveReasonQuery,overtimeReason: overtimeReasonQuery}},
    { new: true }
  ).sort({createdAt: -1});
  
  let docFiles = req.files;          
  let fileName;
  let responseData;
  
  Object.keys(docFiles).forEach(async (properties) => {
    let buffer = docFiles[properties][0].buffer;
    let originalFileName = docFiles[properties][0].originalname;
    let originalFileNameSplit = originalFileName.split(".");
    let fileType = originalFileNameSplit[1];
    fileName =originalFileNameSplit[0] + "_" + new Date().valueOf() + "." + fileType;
    if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
      let thumbnail;        
      if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
      if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();        
      let originalFilePath = `users/${user._id}/attendance/original/${fileName}`;
      responseData = await uploadFile(originalFilePath, thumbnail, fileType);
      if(responseData){                  
          const capture = new ATTENDANCECAPTURE({
            attendanceLogId : attendanceLogRecord._id,
            captureType: "Exit",
            key : fileName,     
            user : user._id,         
          });
          capture.save(function (err, data) {});                  
        }
    }
  });

  res.status(200).json({
    status: true,
    message: "Exit is done !!",
  });

};

exports.barcode = async (req, res, next) => {
  try {

    /* get code from scanner */
    const code = req.query.code;
    const user = await USER.findOne({ attendanceCode: code, isDeleted: false ,isLeft: false});
    let today = new Date();
    today = today.toDateString();

    /* If user available or not */
    if(user){
      setHttpContextValue(user._id);
      /* Check user attendance mode is card or not */
      if (user.attendanceType!='Card'){
        res.status(422).json({
          status: false,
          message: "Your Attendance Mode is not Card !!",
          error: true,
        });
        return;
      }else{

        /* for UTC date format*/
        const startDate = moment().startOf('day').toDate();
        const endDate = moment().endOf('day').toDate();
        const entryTimeUTC = moment().utc().format();
        const entryTime = moment().utc().format("HH:mm")
        //const entryTime = "02:16";
        let lateReasonQuery = null;

        /* check user is available in attendance table or not.*/
        const attendanceLogRecord = await ATTENDANCELOGS.findOne({ user: user._id ,createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false}).sort({createdAt: -1});
        if(!attendanceLogRecord || (attendanceLogRecord.startTime && attendanceLogRecord.endTime)){
          if(!attendanceLogRecord){
             /* if user is not available in attendanceLog table then insert entry-time of user.*/
             const officelastEntryTime = getUtcHnM(user.lateReasonMinute);
             const st = moment.duration("" + entryTime, "HH:mm ");
             const et = moment.duration("" + officelastEntryTime, "HH:mm ");
             const diff = et.subtract(st);
             const diffH = diff.hours();
             const diffM = diff.minutes();
               /* Check user is late or not */
               if (req.query.lateReason) {
                lateReasonQuery = req.query.lateReason;
              } else {
                req.query.lateReason = null;
                lateReasonQuery = "";
              }
              if (!req.query.lateReason) {
                if (diffH < 0 || diffM < 0) {
                  res.status(422).json({
                    status: false,
                    message: "Why you are late ?",
                    data: {
                      late: true,
                    },
                  });
                  return;
                }
              }
 
              /* Set total time to 00:00 for first entry time*/
              const attendance = new ATTENDANCE({
                startTime : entryTimeUTC,
                date : today,
                user : user._id,
                start : true,
                totalTime : '00:00',
                attendanceType : user.attendanceType,
                totalMinutes: user.totalMinutes
              });
              attendance.save(function (err, data) {});

          }

          /* If user scan attendance for second time*/
          const attendanceLog = new ATTENDANCELOGS({
            attendanceMode : user.attendanceType,
            startTime : entryTimeUTC,
            user : user._id,
            lateReason: lateReasonQuery,
          });
          attendanceLog.save(function (err, data) {});

          //upload photo
          let docFiles = req.files;          
          let fileName;
          let responseData;
          
          Object.keys(docFiles).forEach(async (properties) => {
            let buffer = docFiles[properties][0].buffer;
            let originalFileName = docFiles[properties][0].originalname;
            let originalFileNameSplit = originalFileName.split(".");
            let fileType = originalFileNameSplit[1];
            fileName =originalFileNameSplit[0] + "_" + new Date().valueOf() + "." + fileType;
            if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
              let thumbnail;        
              if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
              if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();        
              let originalFilePath = `users/${user._id}/attendance/original/${fileName}`;
              responseData = await uploadFile(originalFilePath, thumbnail, fileType);
              if(responseData){                  
                  const capture = new ATTENDANCECAPTURE({
                    attendanceLogId : attendanceLog._id,
                    captureType: "Entry",
                    key : fileName,     
                    user : user._id,               
                  });
                  capture.save(function (err, data) {});                  
                }
            }
          });

          const allInterviews = await INTERVIEW.find({ technicalRoundUser: user._id,
            interviewTime:{ $gte :startDate ,$lte :endDate },
            interviewStatus: false,
            isDeleted: false
           },'name technology interviewMode interviewTime');
           
           
          // Check previous attendance
          const prevAttendanceTableRecord = await ATTENDANCE.findOne({ user: user._id, date: {$ne :today},isDeleted: false }).sort({createdAt: -1});
          if(prevAttendanceTableRecord){
            const prevDate = prevAttendanceTableRecord.startTime;
            const prevDateFormate = moment(prevDate).format("YYYY-MM-DD");
            const prevStartDate = moment(moment(prevDateFormate)).startOf('day').toDate();
            const prevEndDate = moment(moment(prevDateFormate)).endOf('day').toDate();
            const prevDayAttendanceLogRecord = await ATTENDANCELOGS.findOne({ user: user._id ,createdAt:{ $gte :prevStartDate ,$lte :prevEndDate },isDeleted: false }).sort({createdAt: -1});
            if(prevDayAttendanceLogRecord){
              if(!prevDayAttendanceLogRecord.endTime){
                res.status(200).json({
                  status: true,
                  message: "Entry is done !!  Your last out entry does not exits.",
                  data: {
                    interviewDetails: allInterviews
                  } 
                });
              }else{
                res.status(200).json({
                  status: true,
                  message: "Entry is done !!",
                  data: {
                    interviewDetails: allInterviews
                  }
                });
              }
            }else{
              res.status(200).json({
                status: true,
                message: "Entry is done !!",
                data: {
                  interviewDetails: allInterviews
                }
              });
            }  
          }else{
            res.status(200).json({
              status: true,
              message: "Entry is done !!",
              data: {
                interviewDetails: allInterviews
              }
            });
          }
          
          
        }else{
          /* store endtime of user*/
          const attendance = await ATTENDANCE.findOne({ user: user._id ,createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false });
          endTimeEntry(req, res, attendanceLogRecord, user, attendance);

        }

      }

    }else{
       /* if user not available then... */
       res.status(422).json({
        status: false,
        message: "User not available !!",
        error: true,
      });
      return;
    }

  } catch (error) {
    next(error);
  }
};