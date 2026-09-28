const USER = require("../models/user");
const ATTENDANCE = require("../models/attendance");
const moment = require("moment");
const ATTENDANCELOGS = require("../models/attendanceLogs");

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

endTimeEntry = async function(req, res,temp,user ) {

  const id = user._id;
  let overTime = null;
  let today;
  if(req.query.date){
    today = new Date(req.query.date);
  }else{
    today = new Date();
  }  


  let utcEndTime;
  if(req.query.endTime){
    utcEndTime =  moment.tz(`${req.query.date} ${req.query.endTime}`, true, "Asia/Kolkata").format();
  } else{
    utcEndTime =  moment.tz(`${req.query.date} ${"18:30"}`, true, "Asia/Kolkata").format();
  }
 
  
  let completedHoursTotalTime ;

  let workingMinutes;

  workingMinutes = (req.query.minutes);
  
  if (parseInt(workingMinutes) < parseInt(user.totalMinutes)) {
    completedHoursTotalTime = (Math.floor(workingMinutes / 60) + ':' + workingMinutes % 60);
  }else{
    if ((parseInt(workingMinutes) >=parseInt(user.totalMinutes)) && parseInt(workingMinutes)<=(parseInt(user.overTimeMinute) + parseInt(user.totalMinutes))) {
      completedHoursTotalTime = (Math.floor(workingMinutes / 60) + ':' + workingMinutes % 60);
    }
    else{
      completedHoursTotalTime = (Math.floor(workingMinutes / 60) + ':' + workingMinutes % 60);
      overTime = (workingMinutes - user.totalMinutes);
    }
  }
  const startDate = moment(new Date(req.query.date)).startOf('day').toDate();
  const endDate = moment(new Date(req.query.date)).endOf('day').toDate();

  const query = {
    $set: {
      endTime : utcEndTime,
      end : true,
      totalTime : completedHoursTotalTime,
      overTime : overTime,
    },
  };

  await ATTENDANCE.findOneAndUpdate(
    {_id : temp._id, user: id, date: temp.date, createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false},
    query,{ new: true }
  );

  
  
  await ATTENDANCELOGS.findOneAndUpdate(
    { user: id, createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false },
    {$set: { endTime: utcEndTime}},
    { new: true }
  );
  

  res.status(200).json({
    status: true,
    message: "Exit is done !!",
  });
}
exports.barcode = async (req, res, next) => {
  try {    
    const code = req.query.code;
    const user = await USER.findOne({ attendanceCode: code, isDeleted: false, isLeft: false });
    let today; 
    if(req.query.date){
      today = new Date(req.query.date);
      today = today.toDateString();    
    }else{      
      today = new Date();
      today = today.toDateString();    
    }   

    if(user){
      
      /* check user is available in attendance table or not.*/
      const attendanceTest = await ATTENDANCE.findOne({ user:user._id, date: today,isDeleted: false });      
      if (!attendanceTest) {  
        let utcStartTime;
        if(req.query.startTime){
          
          utcStartTime =  moment.tz(`${req.query.date} ${req.query.startTime}`, true, "Asia/Kolkata").format();
          
        } else{
          
          utcStartTime =  moment.tz(`${req.query.date} ${"09:30"}`, true, "Asia/Kolkata").format();
        }

        const attendance = new ATTENDANCE({
          startTime : utcStartTime,
          date : today,
          user : user._id,
          start : true,
          totalTime : '00:00',
          attendanceType : user.attendanceType,  
          totalMinutes: user.totalMinutes,
          createdAt : utcStartTime
        });
        attendance.save(function (err, data) {});
     
        const attendanceLog = new ATTENDANCELOGS({
          attendanceMode : user.attendanceType,
          startTime : utcStartTime,
          user : user._id,
          createdAt : utcStartTime
        });
        attendanceLog.save(function (err, data) {});
        res.status(200).json({
          status  : true,
          message : "Entry is done !!",
        });
        
      } 
      
      else if(!attendanceTest.end){
        /* if users start time availabe in attendance table then insert users endtime. */      
        
        endTimeEntry(req, res,attendanceTest ,user);
      } 
                  
     
    } 
    else{
      /* if user not available then... */    
      res.status(422).json({
        status  : false,
        message : "User not available !!",
        error : true,
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};

