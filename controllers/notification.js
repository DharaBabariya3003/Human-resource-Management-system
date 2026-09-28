const NOTIFICATION = require("../models/notification");
const INTERVIEWNOTIFICATION = require("../models/interviewNotification");
const LEAVE = require("../models/leave");
const USER = require("../models/user");
const PAYROLL = require("../models/payroll");
const moment = require("moment");
const ROLE = require("../models/role");
const { NOTIFICATION_TYPES } = require('../enum');
const { getAllUserIds,createNotificationObject,getUserAndHrId,createEmpAnniversayObject } = require("../utils/notification");

exports.showNotification = async (req, res, next) => {
  try {
    const allNotifications = await NOTIFICATION.find({user: req.session.user._id},'-__v -updatedAt').sort({createdAt: -1});
    return res.sendRender("admin/notification", null, null, {sideTab: "notification",notificationRecords: allNotifications,moment: moment});
  } catch (error) {
    next(error);
  }
};

exports.showInterviewNotification = async (req, res, next) => {
  try {
    const interview = await INTERVIEWNOTIFICATION.find({},'-__v -updatedAt').populate('interviewUser').sort({createdAt: -1});
    return res.sendRender("admin/interviewNotification", null, null, {sideTab: "interviewNotification",interviewData: interview,moment: moment});
  } catch (error) {
    next(error);
  }
};

exports.employeeNotification = async (req, res, next) => {
  try {
    const allNotifications = await NOTIFICATION.find({user: req.session.user._id},'-__v -updatedAt').sort({createdAt: -1});
    return res.sendRender("employee/notification", null, null, {
      notificationRecords: allNotifications,
      moment: moment,
      sideTab: "userNotifications",
    });
  } catch (error) {
    next(error);
  }
};
exports.headerNotification = async (req, res, next) => {
  try {
    let adminSideNotifications = await NOTIFICATION.find({user: req.session.user._id,isRead: false},'-_id message notificationType').sort({createdAt: -1});
    const notificationLength = adminSideNotifications.length;
    
    let adminNotifications = [];
    if(notificationLength == 0){
      adminNotifications.push({message:'Notification is not available right now!'});
    }else{
      let attendanceLength;
      if(notificationLength > 4){
        attendanceLength = 4;
      }else{
        attendanceLength = notificationLength;
      }
      for(let i=0;i<attendanceLength;i++){
        adminNotifications.push(adminSideNotifications[i]);
      }
    }

    // Interview notification Counter
    const startDate = moment().startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();
    const interview = await INTERVIEWNOTIFICATION.find(
      {createdAt:{ $gte :startDate ,$lte :endDate }},'-__v -createdAt -updatedAt'
    );
    const interviewNotificationLength = interview.length;

    //Leave request notifications
    const _query = { approve: false, isDeleted: false,decline:false };
    const approveLeave = await LEAVE.find(
      _query,'-__v -isDeleted -isLeft -createdAt -updatedAt -deletedAt -deletedBy'
      );
    const leaveRequestNotification = approveLeave.length;

    res.send({sideMenuNotificationLength: notificationLength,leaveRequestCount: leaveRequestNotification,headerNotifications: adminNotifications,interviewNotification: interviewNotificationLength});
  } catch (error) {
    next(error);
  }
};

exports.employeeHeaderNotification = async (req, res, next) => {
  try {
    let employee = await NOTIFICATION.find({user: req.session.user._id,isRead: false},'-_id message notificationType').sort({createdAt: -1});
    const notificationLength = employee.length;
    
    let employeeNotifications = [];
    if(notificationLength == 0){
      employeeNotifications.push({message:'Notification is not available right now!'});
    }else{
      let attendanceLength;
      if(notificationLength > 4){
        attendanceLength = 4;
      }else{
        attendanceLength = notificationLength;
      }
      for(let i=0;i<attendanceLength;i++){
        employeeNotifications.push(employee[i]);
      }
    }
    res.send({allEmpsideNotification: employeeNotifications,employeeNotificationCount:notificationLength});

  } catch (error) {
    next(error);
  }
};

exports.viewdNotification = async (req, res, next) => {
  try {
    if(req.query.page){
      let pageName = req.query.page;
      pageName = pageName.trim();
      if(pageName === 'notificationPage'){
        let notificationReadStatus = await NOTIFICATION.updateMany(
          { user: req.session.user._id,isRead: false },
          { $set: { isRead : true }},
          { new: true });
      }
    }else{
      if(req.query.header){
        let adminSideNotifications = await NOTIFICATION.find({user: req.session.user._id,isRead: false}).sort({createdAt: -1});
        const notificationLength = adminSideNotifications.length;
        let adminNotifications = [],attendanceLength=0, status;
        
        if(notificationLength > 4){
          attendanceLength = 4;
        }else{
          attendanceLength = notificationLength;
        }
        if(attendanceLength > 0){
          for(let i=0;i<attendanceLength;i++){
            adminNotifications.push(adminSideNotifications[i]);
          }
          for (const element of adminNotifications) {
            await NOTIFICATION.findOneAndUpdate(
              { _id: element._id },
              { $set: { isRead : true } },
              { new: true }
            );
          }
        }
        const totalNotification = (notificationLength - attendanceLength);
        
        (totalNotification > 0)? status = true : status = false;
        res.send({status : status,totalNotification: totalNotification});
      }
    }
  } catch (error) {
    next(error);
  }
};

exports.storeLeaveNotification = async(userName,notificationTypeValue)=>{
  const givenRole = ['admin','HR'];
  
  for (const role of givenRole) {
    const roleRecord = await ROLE.findOne({ name: new RegExp(role, "i") });
    const users = await USER.find({ role: roleRecord._id});
    if(users.length > 0){
      for (const user of users) {
        await NOTIFICATION.create({
          notificationType: notificationTypeValue,
          user: user._id,
          message:`${userName} has send you leave request`
        });
      }
    }
  }
}

const storeEmpUpdateNotification = async(employeeId,notificationType,employeeObject) => {
  try {
    let allUsers = await getAllUserIds();
    let result = createNotificationObject(allUsers,employeeId,notificationType,employeeObject);
    await NOTIFICATION.insertMany(result);
  }catch (error) {
    next(error);
  }
}

exports.afterEmpUpdateNotification = async (employeeObject) => {
  try {
    // Send Notification.
    //Get todays's date
    let todaysDay = new Date().getDate();
    let todaysMonth = new Date().getMonth();
    let todayDateForNotification = `${todaysDay}:${todaysMonth + 1}`;

    const startDate = moment().startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    //Birthday
    let birthDay = new Date(employeeObject.birthDate).getDate();
    let birthMonth = new Date(employeeObject.birthDate).getMonth();
    let birthDate = `${birthDay}:${birthMonth + 1}`;
    if (todayDateForNotification == birthDate) {
      //Check notification already available or not for birthday.
      let notificationMsg = `Today is ${employeeObject.firstName+' '+employeeObject.middleName+' '+employeeObject.lastName}'s ${NOTIFICATION_TYPES.BIRTHDAY}`
      let userBirthDayNotifications = await NOTIFICATION.find({ 
        message: notificationMsg,
        createdAt:{ $gte :startDate ,$lte :endDate },
        notificationType:NOTIFICATION_TYPES.BIRTHDAY
        }
      );
      if(userBirthDayNotifications.length == 0){
        await storeEmpUpdateNotification(employeeObject._id,NOTIFICATION_TYPES.BIRTHDAY,employeeObject);
      }
    }

    //Marriage Annevarsary
    let marriageDay = new Date(employeeObject.marriageDate).getDate();
    let marriageMonth = new Date(employeeObject.marriageDate).getMonth();
    let marriageDate = `${marriageDay}:${marriageMonth + 1}`;

    if (todayDateForNotification == marriageDate) {
      //Check notification already available or not for marriage anniversary.
      let notificationMsg = `Today is ${employeeObject.firstName+' '+employeeObject.middleName+' '+employeeObject.lastName}'s ${NOTIFICATION_TYPES.MARRIAGE_ANNIVERSARY}`
      let userMarriageNotifications = await NOTIFICATION.find({ 
        message: notificationMsg,
        createdAt:{ $gte :startDate ,$lte :endDate },
        notificationType:NOTIFICATION_TYPES.MARRIAGE_ANNIVERSARY
        }
      );
      if(userMarriageNotifications.length == 0)  {
        await storeEmpUpdateNotification(employeeObject._id,NOTIFICATION_TYPES.MARRIAGE_ANNIVERSARY,employeeObject);
      }
    } 
  } catch (error) {
    next(error);
  }
};

exports.afterPayrollUpdateNotification = async (payroll) => {
  try {
    // Send Notification.
    //Get todays's date
    let todaysDay = new Date().getDate();
    let todaysMonth = new Date().getMonth();
    let todayDateForNotification = `${todaysDay}:${todaysMonth + 1}`;

    const adminAndHrId = await getUserAndHrId();
    let empAnnevarsary_day = new Date(payroll.joiningDate).getDate();
    let empAnnevarsary_month = new Date(payroll.joiningDate).getMonth();
    let empAnnevarsaryDate = `${empAnnevarsary_day}:${empAnnevarsary_month + 1}`;

    let empAnnevarsaryMsgUsers = [];
    if (todayDateForNotification == empAnnevarsaryDate) {
      if(!(String(adminAndHrId)).includes(String(payroll.user))){
        empAnnevarsaryMsgUsers.push(payroll.user);
      }
      empAnnevarsaryMsgUsers = empAnnevarsaryMsgUsers.concat(adminAndHrId);
      let populatedPayroll = await PAYROLL.findOne({ _id:payroll._id, isDeleted: false }).populate('user');

      const startDate = moment().startOf('day').toDate();
      const endDate = moment().endOf('day').toDate();
      //Check notification already available or not for emp anniversary.
      let notificationMsg = `Today is ${populatedPayroll.user.firstName+' '+populatedPayroll.user.middleName+' '+populatedPayroll.user.lastName}'s Employee Anniversary`;
      let userEmpAnnyNotifications = await NOTIFICATION.find({ 
        message: notificationMsg,
        createdAt:{ $gte :startDate ,$lte :endDate },
        notificationType:NOTIFICATION_TYPES.EMPLOYEE_ANNIVERSARY
        }
      );
      
      if(userEmpAnnyNotifications == 0){
        let result = createEmpAnniversayObject(empAnnevarsaryMsgUsers,populatedPayroll,adminAndHrId,NOTIFICATION_TYPES.EMPLOYEE_ANNIVERSARY);
        await NOTIFICATION.insertMany(result);
      }
    }    
     
  } catch (error) {
    next(error);
  }
};