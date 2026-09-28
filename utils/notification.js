const USER = require("../models/user");
const ROLE = require("../models/role");
const NOTIFICATION = require("../models/notification");
const moment = require("moment");
const { NOTIFICATION_TYPES } = require('../enum');


exports.createNotificationObject = (allUsers,elementId,notificationType,userRecord)=>{
  let empNotificationData = [],msg;
  for (let user of allUsers) {
    if(String(user) === String(elementId)){
      msg = `Wish you a happy ${notificationType}`;
    }else{
      msg = `Today is ${userRecord.firstName+' '+userRecord.middleName+' '+userRecord.lastName}'s ${notificationType}`;
    }
    empNotificationData.push({
      notificationType: notificationType,
      user: user,
      message: msg
    })
  }
  return empNotificationData;
}

exports.createEmpAnniversayObject = (usersId,payrollData,roleID,notificationType)=>{
  let empAnniversayArr = [],msg;
  for (let user of usersId) {
    if(roleID.includes(user)){
      if(String(user) === String(payrollData.user._id)){
        if(notificationType == NOTIFICATION_TYPES.EMPLOYEE_ANNIVERSARY){
          msg = `Wish you a happy Employee Anniversary`;
        }else if(notificationType == NOTIFICATION_TYPES.EMPLOYMENT){
          msg = `Your Employment is going to be start from ${moment(new Date(payrollData.joiningDate)).calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'DD/MM/YYYY'
          })}`;
        }else{
          msg = `Your Bond is going to be complete on ${moment(new Date(payrollData.bondCompletedDate)).calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'DD/MM/YYYY'
          })}`;
        }
      }else{
        if(notificationType == NOTIFICATION_TYPES.EMPLOYEE_ANNIVERSARY){
          msg = `Today is ${payrollData.user.firstName+' '+payrollData.user.middleName+' '+payrollData.user.lastName}'s Employee Anniversary`;
        }else if(notificationType == NOTIFICATION_TYPES.EMPLOYMENT){
          msg = `Employment of ${payrollData.user.firstName+' '+payrollData.user.middleName+' '+payrollData.user.lastName} is going to be start from ${moment(new Date(payrollData.joiningDate)).calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'DD/MM/YYYY'
          })}`;
        }else{
          msg = `Bond of ${payrollData.user.firstName+' '+payrollData.user.middleName+' '+payrollData.user.lastName} is going to be complete on ${moment(new Date(payrollData.bondCompletedDate)).calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'DD/MM/YYYY'
          })}`;
        }
      }
    }else{
      if(notificationType == NOTIFICATION_TYPES.EMPLOYEE_ANNIVERSARY){
        msg = `Wish you a happy Employee Anniversary`;
      }else if(notificationType == NOTIFICATION_TYPES.EMPLOYMENT){
        msg = `Your Employment is going to be start from ${moment(new Date(payrollData.trainingEndDate)).calendar(null, {
          sameDay: '[Today]',
          nextDay: '[Tomorrow]',
          nextWeek: 'dddd',
          lastDay: '[Yesterday]',
          lastWeek: '[Last] dddd',
          sameElse: 'DD/MM/YYYY'
        })}`;
      }else{
        msg = `Your Bond is going to be complete on ${moment(new Date(payrollData.bondCompletedDate)).calendar(null, {
          sameDay: '[Today]',
          nextDay: '[Tomorrow]',
          nextWeek: 'dddd',
          lastDay: '[Yesterday]',
          lastWeek: '[Last] dddd',
          sameElse: 'DD/MM/YYYY'
        })}`;
      }
    }
    empAnniversayArr.push({
      notificationType: notificationType,
      user: user,
      message: msg
    })
  }
  return empAnniversayArr;
}

exports.getAllUserIds = async()=>{
  try {
  const allUser = await USER.find({ isDeleted: false, isLeft: false },'_id');
  let result = [];
    for (let user of allUser) {
      result.push(user._id);
    };
    return result ;
  }catch (error) {}
}

exports.getUserAndHrId = async()=>{
  const givenRole = ['admin','HR'];
  let hrAndadminIdArray = [];
  for (const role of givenRole) {
    const roleRecord = await ROLE.findOne({ name: new RegExp(role, "i") });
    const users = await USER.find({ role: roleRecord._id});
    if(users.length > 0){
      for (const user of users) {
        hrAndadminIdArray.push(user._id);
      }
    }
  }
  return hrAndadminIdArray;
}

exports.storeResignationNotification = async(employee,notificationTypeValue)=>{
  const givenRole = ['admin','HR'];
  
  for (const role of givenRole) {
    const roleRecord = await ROLE.findOne({ name: new RegExp(role, "i") });
    const users = await USER.find({ role: roleRecord._id});
    if(users.length > 0){
      for (const user of users) {
        let empLastDate = moment(new Date(employee.lastDate));
        let todaysDate = moment().format("YYYY-MM-DD");
        let dayDiff = empLastDate.diff(todaysDate, "days");
        
        await NOTIFICATION.create({
          notificationType: notificationTypeValue,
          user: user._id,
          message:`Notice period of ${employee.firstName+" "+employee.middleName+" "+employee.lastName}'s going to be complete on ${moment(new Date(employee.lastDate)).calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'DD/MM/YYYY'
          })} `
        });
      }
    }
  }
}

exports.storeInterviewNotification = async(notificationOfInterviewUser,interviewUser,notificationTypeValue)=>{
  try{
    for (const user of notificationOfInterviewUser) {
      await NOTIFICATION.create({
        notificationType: notificationTypeValue,
        user: user._id,
        message:`Interview of ${interviewUser.name} scheduled on ${moment(new Date(interviewUser.interviewTime)).calendar(null, {
          sameDay: '[Today]',
          nextDay: '[Tomorrow]',
          nextWeek: 'dddd',
          lastDay: '[Yesterday]',
          lastWeek: '[Last] dddd',
          sameElse: 'DD/MM/YYYY'
        })}`
      });
    }
    // Send notification to technical user.
    await NOTIFICATION.create({
      notificationType: notificationTypeValue,
      user: interviewUser.technicalRoundUser,
      message:`Interview of ${interviewUser.name} scheduled on ${moment(new Date(interviewUser.interviewTime)).calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'DD/MM/YYYY'
      })}`
    });
  }catch(error){}
}
