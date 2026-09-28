const APIError = require("../utils/APIError");
const DATATABLEWEB = require('../utils/dataTable');
const ATTENDANCE = require("../models/attendance");
const LEAVE = require("../models/leave");
const INTERVIEW = require("../models/interview");
const moment = require("moment");
const USER = require("../models/user");
const ROLE = require("../models/role");
const LOGS = require("../models/log");
const { getHolidays,getSundays } = require("../utils/getAllHolidays");
const PAYROLL = require("../models/payroll");
const LETTERHEAD_TYPE = require("../models/letterheadType");
const LETTERHEAD = require("../models/letterhead");
const { tdsAmount } = require('../config/index');
const { createExcelSheet } = require("../utils/generateXlsSheet");

exports.serverEmployeeTable = async (req, res, next) => {
  try{
    const role = await ROLE.findOne({ name: new RegExp("admin", "i") });
    const modelObj = USER;
    const searchFields = ['attendanceCode','firstName','middleName','lastName','email','contactNumber','vehicalNumber'];
    let conditionQuery = { isLeft: false, isDeleted: false };
    
    //Selected Attendance Mode.
    if(req.query && req.query.selectedAttendanceType){
      if(req.query.selectedAttendanceType.trim() !='All'){
      conditionQuery.attendanceType = req.query.selectedAttendanceType;
      }
    }

    // Selected Organization
    if(req.query && req.query.selectedOrganizationType){
      if(req.query.selectedOrganizationType.trim() !='All'){
      conditionQuery.organizationType = req.query.selectedOrganizationType.trim();
      }
    }

    //Selected Gender
    if(req.query && req.query.selectedGender){
      if(req.query.selectedGender.trim() !='All'){
      conditionQuery.gender = req.query.selectedGender.trim();
      }
    }

    conditionQuery.role = { $nin : [role._id] };

    const projectionQuery = '-__v -isDeleted -isLeft -createdAt -updatedAt -deletedAt -deletedBy';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = null;

    // If TDS is selected from dropdown.
    if(req.query && req.query.tdsUsers){
      if(req.query.tdsUsers.trim() !='All'){
        // TDS type
        // From TDS get one month salary.
        let oneMonthSalaryFromTdsAmt = (tdsAmount/12);
        oneMonthSalaryFromTdsAmt = (Math.round(oneMonthSalaryFromTdsAmt));


        let payrollUsers = await PAYROLL.find(
          { isDeleted: false, salary:{ $gt: oneMonthSalaryFromTdsAmt }},
          '-isDeleted',
          { skip: Number(req.query.start), limit: Number(req.query.length), sort: {'createdAt': 1} }
          ).populate({
          path: "user",
          match: conditionQuery,
          select: '-__v -isDeleted -isLeft -createdAt -updatedAt -deletedAt -deletedBy'
        });
        
        
        // Store all TDS users.
        let tdsUsers = [];
        payrollUsers.map(element=>{
          if(element.user){
            tdsUsers.push(element.user);
          }
        })

        
        // Get total users.
        const allTdsUsers = await PAYROLL.find(
          { isDeleted: false, salary:{ $gt: oneMonthSalaryFromTdsAmt }},'user -_id'
        );
        
        var allTdsUsersIds = allTdsUsers.map(function (obj) {
          return obj.user;
        });

        let totalRecordsCount = await USER.countDocuments({ _id: { $in: allTdsUsersIds }, isLeft: false, isDeleted:false })
        
        let payrollObject = {};
        payrollObject.draw = req.query.draw;
        payrollObject.recordsFiltered = totalRecordsCount;
        payrollObject.recordsTotal = totalRecordsCount;
        payrollObject.data = tdsUsers;
        const payrollJsonString = JSON.stringify(payrollObject);
        return res.send(payrollJsonString);
      }
    }

    DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString); 
    });
  }catch(error){
    next(error);
  }
};

exports.viewLeftEmployee = async (req, res, next) => {
  try {
    const modelObj = USER;
    const searchFields = ['firstName', 'middleName', 'lastName'];
    const conditionQuery = { isLeft: true, isDeleted: false };
    const projectionQuery = '-__v -isDeleted -isLeft -createdAt -updatedAt -deletedAt -deletedBy';
    const sortingQuery = {'createdAt': 1};
    const populateQuery = null;
    
    DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });
  } catch (error) {
    next(error);
  }
};

exports.attendanceTable = async (req, res, next) => { 
  try {
    const modelObj = ATTENDANCE;
    const searchFields = ['user.attendanceCode', 'user.firstName','user.middleName','user.lastName','attendanceType'];
    const conditionQuery = { isDeleted: false };
    const projectionQuery = '-__v -isDeleted -createdAt -updatedAt';
    const sortingQuery = {'createdAt': 1};
    const populateQuery = [{ path: 'user'}];
    
    if(req.query.overtimeCheckUserId && req.query.checkStatus){
      let status = req.query.checkStatus;
      status = status.trim();
      let attendanceId = req.query.overtimeCheckUserId;
      if(status == 'unChecked'){
        let attendance = await ATTENDANCE.findOneAndUpdate(
          { _id:  attendanceId },
          { $set: { overtimeCheckout : false }},
          { new: true });
      }else{
        let attendance = await ATTENDANCE.findOneAndUpdate(
          { _id:  attendanceId },
          { $set: { overtimeCheckout : true }},
          { new: true });
      }
    }
    if(req.query && req.query.selectedDate) {        
      let dateSelected = new Date(req.query.selectedDate);
      let selectedDate = dateSelected.toDateString();
      conditionQuery.date = selectedDate;
    }
    if(req.query.selectedOption == "overTimeRecord") conditionQuery.overTime = { $ne: null };    

    DATATABLEWEB.fetchDatatableRecordsForPopulateData(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });

  } catch (error) {
    next(error);
  }
};

exports.monthlyAttendanceTable = async (req, res, next) => {  
  try {
    const modelObj = ATTENDANCE;
    const searchFields = ['date'];
    const conditionQuery = { isDeleted: false };
    const projectionQuery = '-__v -isDeleted -createdAt -updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = null;


    if(req.query && req.query.userId) {
      conditionQuery.user = req.query.userId;
    }
    if(req.query && req.query.attendanceMonth){
      currentDate = new Date(moment(req.query.attendanceMonth).format('YYYY-MM'));
      let startMonth = moment(currentDate).startOf('month').toDate();
      let endMonth = moment(currentDate).endOf('month').toDate();

      startMonth = (moment(startMonth).format("YYYY-MM-DD"));
      endMonth = (moment(endMonth).format("YYYY-MM-DD"));

      startMonth = (moment.tz(`${startMonth} ${"00:00:59"}`, true, "Asia/Kolkata").format());
      endMonth = (moment.tz(`${endMonth} ${"23:59:59"}`, true, "Asia/Kolkata").format());

      conditionQuery.createdAt = { $gte :startMonth ,$lte :endMonth}
    }

    DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });
  } catch (error) { 
    next(error);
  }
}

exports.interviewTable = async (req, res, next) => {
  try{  
    const modelObj = INTERVIEW;
    const searchFields = ['name','email'];
    const conditionQuery = { isDeleted: false };
    const projectionQuery = '-__v -isDeleted -createdAt -updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = null;

     // Interview Status
     if(req.query && req.query.selectedInterviewStatus){
      if(req.query.selectedInterviewStatus.trim() !='All'){
        if(req.query.selectedInterviewStatus.trim() == 'Done'){
          conditionQuery.interviewStatus = true;
        }else{
          conditionQuery.interviewStatus = false;
        }
      }
    }

    if(req.query && req.query.interviewMonth) {
      let selectedMonth = new Date(moment(req.query.interviewMonth).format('YYYY-MM'));
      const startMonth = moment(selectedMonth).startOf('month').toDate();
      const endMonth = moment(selectedMonth).endOf('month').toDate(); 
      conditionQuery.interviewTime = { $gte :startMonth ,$lte :endMonth}
    }

    DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString); 
    });
  }catch(error){
    next(error);
  }
}

exports.doneInterviewTable = async (req, res, next) => {
  try{  
    if(req.query.interviewDate)
    {
      let currentInterviewDate = req.query.interviewDate;
      
      let startDate = moment(new Date(currentInterviewDate)).startOf('day').toDate();
      let endDate = moment(new Date(currentInterviewDate)).endOf('day').toDate();
      
      const modelObj = INTERVIEW;
      const searchFields = ['name','email'];
      let conditionQuery = {isDeleted: false, isDone: true,interviewTime: {$gte :startDate ,$lte :endDate }};
      const projectionQuery = '-createdAt -updatedAt';
      const sortingQuery = {'createdAt': -1};
      const populateQuery = null;
      
      DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
        if(err) throw new APIError({message: "Something went wrong while fetch user list."});
        let jsonString = JSON.stringify(data);
        res.send(jsonString);
      });
    }
  }catch(error){
    next(error);
  }
}

exports.resignEmployeeTable = async (req, res, next) => {
  try{  
    
    const modelObj = USER;
    const searchFields = ['firstName','lastName'];
    const conditionQuery = { isDeleted: false };
    const projectionQuery = '-createdAt -updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = null;

    let currentDate = moment().format("YYYY-MM-DD");
    const startDay = moment(currentDate).startOf('day').toDate();

    let nextDate = moment().add(3,'days').format("YYYY-MM-DD");
    const endDay = moment(nextDate).endOf('day').toDate();
    
    conditionQuery.lastDate = { $gte :startDay ,$lte :endDay};    
    DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);   
    });
  }catch(error){
    next(error);
  }
}

exports.leaveRequestTable = async (req, res, next) => {
  try{
    const modelObj = LEAVE;    
    const searchFields = ['user.attendanceCode', 'user.firstName','user.middleName','user.lastName','leaveReason','multiOrhalfDay'];
    let conditionQuery ;
    const projectionQuery = '-updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = [{ path: 'user'}];

    if(req.query && (req.query.year || req.query.option)) {
      let selectedYear = req.query.year;
      let selectedChoice = req.query.option;

      let year =  moment(new Date(selectedYear)).format('YYYY');
      const startYear = moment(year).startOf('year').toDate();
      const endYear = moment(year).endOf('year').toDate();

      if (selectedChoice == "All") {
        conditionQuery = {
          isDeleted: false,
          $or: [
            { multiFromDate: { $gte: startYear, $lte: endYear } }, 
            { multiToDate: { $gte: startYear, $lte: endYear } },
            { halfDayDate: { $gte: startYear, $lte: endYear } }
          ],
        };
      } else if (selectedChoice == "Halfday") {
        conditionQuery = {
          isDeleted: false,
          halfDayDate: { $gte: startYear, $lte: endYear },
        };
      } else {
        let search = selectedYear + "-" + selectedChoice;
        let monthAndYear = moment(new Date(search)).format("YYYY-MM");
        const startMonth = moment(new Date(monthAndYear)).startOf("month").toDate();
        const endMonth = moment(new Date(monthAndYear)).endOf("month").toDate();       
        conditionQuery = {
          isDeleted: false,
          $or: [
            { multiFromDate: { $gte: startMonth, $lte: endMonth } }, 
            { multiToDate: { $gte: startMonth, $lte: endMonth } },
            { halfDayDate: { $gte: startMonth, $lte: endMonth } }
          ],
        };
      }
    }

    DATATABLEWEB.fetchDatatableRecordsForPopulateData(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });
  }catch(error){
    next(error);
  }
}

exports.leaveRequestHistoryTable = async (req, res, next) => {  
  try{      
    const modelObj = LEAVE;    
    const searchFields = ['user.attendanceCode','user.firstName','user.middleName','user.lastName','multiOrhalfDay','leaveReason'];
    let conditionQuery ;
    const projectionQuery = '-updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = [{ path: 'user'}];
   
    if(req.query && (req.query.year || req.query.option)) {
      let selectedYear = req.query.year;
      let selectedChoice = req.query.option;

      let year =  moment(new Date(selectedYear)).format('YYYY');
      const startYear = moment(year).startOf('year').toDate();
      const endYear = moment(year).endOf('year').toDate();

      if (selectedChoice == 'All') {
        conditionQuery = {
          isDeleted: false,
          $or: [
            { multiFromDate: { $gte: startYear, $lte: endYear } }, 
            { multiToDate: { $gte: startYear, $lte: endYear } },
            { halfDayDate: { $gte: startYear, $lte: endYear } }
          ],
        };
      }else if (selectedChoice == 'Halfday') {
        conditionQuery = {
          isDeleted: false,
          halfDayDate: { $gte: startYear, $lte: endYear },
        };
      }else{
        let search = selectedYear + "-" + selectedChoice;
        let monthAndYear = moment(new Date(search)).format("YYYY-MM");
        const startMonth = moment(new Date(monthAndYear)).startOf("month").toDate();
        const endMonth = moment(new Date(monthAndYear)).endOf("month").toDate();       
        conditionQuery = {
          isDeleted: false,
          $or: [
            { multiFromDate: { $gte: startMonth, $lte: endMonth } }, 
            { multiToDate: { $gte: startMonth, $lte: endMonth } },
            { halfDayDate: { $gte: startMonth, $lte: endMonth } }
          ],
        };
      }
    }
    
    DATATABLEWEB.fetchDatatableRecordsForPopulateData(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);   
    });
  }catch(error){
    next(error);
  }
}

exports.overtimeRecords = async (req, res, next) => {  
  try {
    const _id = req.query.userIDForOvertime;
    
    const selectedDate = moment(new Date(req.query.attendanceMonth)).format("YYYY-MM"); //2021-06

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

    
    const modelObj = ATTENDANCE;
    const searchFields = [];
    const conditionQuery = { 
      user: _id, 
      createdAt: {$gte :prevStartDate ,$lte :prevEndDate },
      $or: [{ overTime:{ $ne: null } }, { date:{ $in: holidayDatetoString } }],
      isDeleted: false };
      
    const projectionQuery = '-__v -isDeleted -createdAt -updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = [{ path: 'user'}];
    
    if(req.query.overtimeCheckUserId && req.query.checkStatus){
      let status = req.query.checkStatus;
      status = status.trim();
      let attendanceId = req.query.overtimeCheckUserId;
      if(status === 'unChecked'){
        let attendance = await ATTENDANCE.findOneAndUpdate(
          { _id:  attendanceId },
          { $set: { overtimeCheckout : false }},
          { new: true });
      }else if(status === 'checked'){
        let attendance = await ATTENDANCE.findOneAndUpdate(
          { _id:  attendanceId },
          { $set: { overtimeCheckout : true }},
          { new: true });
      }
    }


    // Get Total checked records length
    const totalCheckedAttendanceRecords = await ATTENDANCE.count({ 
      user: _id, 
      createdAt: {$gte :prevStartDate ,$lte :prevEndDate },
      $or: [{ overTime:{ $ne: null } }, { date:{ $in: holidayDatetoString } }],
      overtimeCheckout: true,
      isDeleted: false });

    DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      data.totalCheckedAttendanceRecords = totalCheckedAttendanceRecords;
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });
  } catch (error) { 
    next(error);
  }
}

exports.logTableRecords = async (req, res, next) => { 
  try {
    
    const modelObj = LOGS;
    const searchFields = ['user.attendanceCode', 'user.firstName','user.middleName','user.lastName','tableName','action'];
    const conditionQuery = { isDeleted: false };
    const projectionQuery = '-__v -isDeleted -updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = [{ path: 'user'}];

    if(req.query && req.query.daterangeForLog) {
      let datePickerRangeDate = req.query.daterangeForLog.split("-");
      let startRangeDate = datePickerRangeDate[0].trim();
      startRangeDate = moment(moment(startRangeDate, 'DD/MM/YYYY')).format('YYYY-MM-DD');
      let endRangeDate = datePickerRangeDate[1].trim();
      endRangeDate = moment(moment(endRangeDate, 'DD/MM/YYYY')).format('YYYY-MM-DD');

      const startMonth = moment(new Date(startRangeDate)).startOf('day').toDate();
      const endMonth = moment(new Date(endRangeDate)).endOf('day').toDate();
      conditionQuery.createdAt = { $gte :startMonth ,$lte :endMonth}
    }

    if(req.query && req.query.selectedOption) {
      if(req.query.selectedOption.trim() !='All'){
        conditionQuery.user = req.query.selectedOption;
      }
    }

    DATATABLEWEB.fetchDatatableRecordsForPopulateData(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });
  } catch (error) {
    next(error);
  }
};

exports.salaryAttendanceTable = async (req, res, next) => { 
  try {
    const modelObj = ATTENDANCE;
    const searchFields = ['date'];
    const conditionQuery = { isDeleted: false };
    const projectionQuery = '-__v -isDeleted -createdAt -updatedAt';
    const sortingQuery = {'createdAt': 1};
    const populateQuery = null; 

    if(req.query && req.query.userId){
      let startEndDateRange = req.query.daterangeForSalary.split("-");
      let startDateRange = startEndDateRange[0].trim();
      let endDateRange = startEndDateRange[1].trim();

      startDateRange = moment(moment(startDateRange, 'DD/MM/YYYY')).format('YYYY-MM-DD');
      endDateRange = moment(moment(endDateRange, 'DD/MM/YYYY')).format('YYYY-MM-DD');
      
      let startMonth = moment(new Date(startDateRange)).startOf('day').toDate();
      let endMonth = moment(new Date(endDateRange)).endOf('day').toDate();
      startMonth = (moment(startMonth).format("YYYY-MM-DD"));
      endMonth = (moment(endMonth).format("YYYY-MM-DD"));

      startMonth = (moment.tz(`${startMonth} ${"00:00:59"}`, true, "Asia/Kolkata").format());
      endMonth = (moment.tz(`${endMonth} ${"23:59:59"}`, true, "Asia/Kolkata").format());
      
      conditionQuery.user = req.query.userId;
      conditionQuery.createdAt = { $gte :startMonth ,$lte :endMonth}
    }
    DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.bondCompletedUsersList = async (req, res, next) => { 
  try {
    // Get todays date for compare payroll's bond complete date is less or equals to todays date.
    const todaysDate = moment().endOf('day').toDate();
    
    let payrollUsers = await PAYROLL.find(
      { isDeleted: false, bondCompletedDate: { $lte :todaysDate } },
      '-isDeleted',
      { skip: Number(req.query.start), limit: Number(req.query.length), sort: {'createdAt': 1} }
    ).populate({
      path: "user",
      match: { isLeft: false, isDeleted: false },
      select: {'firstName': 1, 'middleName': 1, 'lastName': 1, 'attendanceCode': 1}
    });

    
    // Get all bond completed users.
    let bondCompletedUsersList = [];
    payrollUsers.map(element=>{
      if(element.user){
        bondCompletedUsersList.push({
          firstName: element.user.firstName,
          middleName: element.user.middleName,
          lastName: element.user.lastName,
          attendanceCode: element.user.attendanceCode,
          bondCompletedDate: element.bondCompletedDate,
        });
      }
    });

    
    // Get total users.
    const bondCompletedUsers = await PAYROLL.find(
      { isDeleted: false, bondCompletedDate: { $lte :todaysDate } },'user -_id'
    );
    
    var bondCompletedUserIds = bondCompletedUsers.map(function (obj) {
      return obj.user;
    });

    let totalRecordsCount = await USER.countDocuments({ _id: { $in: bondCompletedUserIds }, isLeft: false, isDeleted:false })
    
    
    let payrollObject = {};
    payrollObject.draw = req.query.draw;
    payrollObject.recordsFiltered = totalRecordsCount;
    payrollObject.recordsTotal = totalRecordsCount;
    payrollObject.data = bondCompletedUsersList;
    const payrollJsonString = JSON.stringify(payrollObject);
    return res.send(payrollJsonString);

  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.showLetterheadType = async (req, res, next) => {
  try {
    const modelObj = LETTERHEAD_TYPE;
    const searchFields = ['letterheadType'];
    const conditionQuery = { isDeleted: false };
    const projectionQuery = '-__v -isDeleted -createdAt -updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = null;
    
    DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });
  } catch (error) {
    next(error);
  }
};

exports.showLetterhead = async (req, res, next) => {
  try {
    const modelObj = LETTERHEAD;
    const searchFields = ['letterHeadNumber','issuerName','issueTo','letterheadType.letterheadType'];
    const conditionQuery = { isDeleted: false };
    const projectionQuery = '-__v -isDeleted -createdAt -updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = [{ path: 'letterheadType'}];
    
    DATATABLEWEB.fetchDatatableRecordsForPopulateData(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
      if(err) throw new APIError({message: "Something went wrong while fetch user list."});
      const jsonString = JSON.stringify(data);
      res.send(jsonString);
    });
  } catch (error) {
    next(error);
  }
};

exports.employeeXlsSheet = async (req, res, next) => {
  try {
    const organizationType = req.query.organizationType.trim();
    const role = await ROLE.findOne({ name: new RegExp("admin", "i") });

    let users;
    if(organizationType == 'All'){
      users = await USER.find({ isDeleted: false,isLeft: false,role: { $nin : [role._id] } },'firstName middleName lastName attendanceCode department designation email contactNumber').populate('department designation');
    }else{
      users = await USER.find({ organizationType: organizationType, isDeleted: false, isLeft: false, role: { $nin : [role._id] } },'firstName middleName lastName attendanceCode department designation email contactNumber').populate('department designation');
    }
    
    let employeeXlsData = [];
    for(const user of users){
      let employeeInformation = {};
      //attendanceCode
      employeeInformation.attendanceCode = user.attendanceCode;
      //name
      employeeInformation.name = user.firstName+" "+user.middleName+" "+user.lastName;
      //department
      employeeInformation.department = user.department.departmentName;
      //designation
      employeeInformation.designation = user.designation.designationName;
      //email
      employeeInformation.email = user.email;
      //contactNumber
      employeeInformation.contactNumber = user.contactNumber;

      employeeXlsData.push(employeeInformation);
    }    

   // Interview Xls sheet
    let worksheetColumnsEmployee = [
      { header: "Attendance Code", key: "attendanceCode", width: 10 },
      { header: "Full Name", key: "name", width: 30 },
      { header: "Department", key: "department", width: 10 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Email", key: "email", width: 20 },
      { header: "Contact Number", key: "contactNumber", width: 20 },
    ];
    
    let bottomEmployeeSheet = {};
    let xlsFileNameEmployee = "employeeDetailsExcelSheet";
    await createExcelSheet(worksheetColumnsEmployee,employeeXlsData,bottomEmployeeSheet,xlsFileNameEmployee);
    let employeeXlsStatus = false;
    if(users.length > 0){
      employeeXlsStatus = true;
    }
    res.send({status: employeeXlsStatus, xlsFileNameEmployee: xlsFileNameEmployee});    

  } catch (error) {
    next(error);
  }
};
