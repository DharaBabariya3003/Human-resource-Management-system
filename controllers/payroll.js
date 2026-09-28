const {
  validatePayroll,
  validateUpdatePayroll,
} = require("../validations/payroll");
const PAYROLL = require("../models/payroll");
const USER = require("../models/user");
const INCREMENT = require("../models/increment");
const moment = require("moment");
const {
  setPayroll,
  getPayroll,
  decryptPayroll,
  encryptPayroll, 
} = require("../middlewares/payrollHandler");
const { afterPayrollUpdateNotification } = require("../controllers/notification");

exports.store = async (req, res, next) => {
  try {    
    let payload = req.body;
    if(!payload.salary){
      payload.salary = "0";
    }
    payload.note = payload.note;
    const validateError = validatePayroll.body.validate(payload).error;
    if (validateError) {
     setPayroll(payload);
      return res.redirect("/admin/payroll/" + req.body.user + "/create");
    }
    if(payload.bond === 'No'){
      payload.bondDuration = '0';
      payload.bondCompletedDate = null;
    }
    const _id = req.body.user;

    const payroll = await PAYROLL.create(payload);
    const _query = { _id, isDeleted: false };
    const payrollid = payroll._id;

    let increment = {};
    increment.previousSalary = 0;
    increment.salaryInPercentage = 0;
    increment.salaryInRupees = 0;
    increment.totalSalary = payload.salary;
    increment.incrementMethod = payload.increment;
    increment.payrollID = payrollid;
    increment.lastUpdated = moment(new Date()).format("DD MMM YYYY");
    increment.effectiveFrom = moment().format("YYYY-MM");
    increment.user = _id;
    increment = JSON.parse(JSON.stringify(increment));
    const incrementData = await INCREMENT.create(increment);
    payload = JSON.parse(JSON.stringify(payload));
    
    const user = await USER.findOneAndUpdate(
      _query,
      { $set: { payrollID: payrollid } },
      { new: true }
    );
    return res.redirect("/admin/view/" + "payroll/" + _id);
  } catch (error) {
    next(error);
  }
};

exports.showPayroll = async (req, res, next) => {
  try {
    let payrollObj = getPayroll();
    if (Object.entries(payrollObj).length === 0) {
      return res.sendRender("admin/addPayroll", null, null, {
        employeeID: req.params.id,
        sideTab: "employee",
      });
    } else {
      return res.sendRender("admin/addPayroll", null, null, {
        employeeID: req.params.id,
        payrollDetail: payrollObj,
        sideTab: "employee",
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.showUpdate = async (req, res, next) => {
  try {
    const _id = req.params.id;
    let payroll = await PAYROLL.findOne({ _id, isDeleted: false });
    return res.sendRender("admin/updatePayroll", null, null, {
      payrollUpdateRecords: payroll,
      sideTab: "employee",
      moment: moment,
    });
  } catch (error) {
    next(error);
  }
};

exports.showView = async (req, res, next) => {
  try {
    const _id = req.params.id;
    let payroll = await PAYROLL.findOne({ _id, isDeleted: false });
    res.render("account", { payrollUpdateRecords: payroll });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const payload = JSON.parse(JSON.stringify(req.body));
    
    payload.note = payload.note;
    
    const validateError = validateUpdatePayroll.body.validate(payload).error;
    if (validateError) {
      return res.redirect("/admin/payroll/" + _id + "/edit");
    }

    if(payload.bond === 'No'){
      payload.bondDuration = '0';
      payload.bondCompletedDate = null;
    }

    const _query = { _id, isDeleted: false };
    const payroll = await PAYROLL.findOneAndUpdate(
      _query,
      { $set: payload },
      { new: true }
    );
    const uid = payroll.user;
    if(payload.salary){
      const incrementRecord = await INCREMENT.findOne({ user: uid, isDeleted:false }).sort({createdAt: -1});
      const incrementUpdateData = await INCREMENT.findOneAndUpdate(
        { _id: incrementRecord._id, },
        { $set: {totalSalary: payload.salary, previousSalary: incrementRecord.totalSalary} },{ new: true }
      );
    }

    // Employee anniversary Notification
    if(payroll.joiningDate && moment(payroll.joiningDate).isBefore(moment(new Date()).format("YYYY-MM-DD"))){
      await afterPayrollUpdateNotification(payroll);
    }
    
    return res.redirect("/admin/view/" + "payroll/" + uid);
  } catch (error) {
    next(error);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDeleted: false };
    const _delete = { $set: { isDeleted: true } };
    const payroll = await PAYROLL.findOneAndUpdate(_query, _delete);
    const uid = payroll.user;
    return res.redirect("/admin/view/" + "payroll" + "/" + uid);
  } catch (error) {
    next(error);
  }
};

exports.deleteIncrement = async (req, res, next) => {
  try {
    if(req.params.id && req.params.userId){
      const incrementID = req.params.id;
      const userId = req.params.userId;
      const incrementDeleteData = await INCREMENT.findOneAndUpdate(
        { _id: incrementID, user:userId, isDeleted: false},
        { $set: {isDeleted: true} },{ new: true }
      );
      const incrementRecord = await INCREMENT.findOne({ user: userId, isDeleted:false }).sort({createdAt: -1});
      /* Update payroll */
      const payroll = await PAYROLL.findOneAndUpdate(
        { user: userId, isDeleted: false},
        { $set: { salary: incrementRecord.totalSalary} },{ new: true }
      );
      return res.redirect("/admin/view/" + "increment" + "/" + userId);
    }
  } catch (error) {
    next(error);
  }
};

exports.bondCompletedUsers = async (req, res, next) => {
  try {
    return res.sendRender("admin/bondCompletedUsers", null, null, {
      sideTab: "bondCompleted",
      moment: moment,
    });
  } catch (error) {
    next(error);
  }
};