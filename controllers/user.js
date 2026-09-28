const APIError = require("../utils/APIError");
const { generateJwt } = require("../utils/helper");
const USER = require("../models/user");
const ROLE = require("../models/role");
const BANKNAME = require("../models/bankName");
const ATTENDANCE = require("../models/attendance");
const ATTENDANCELOGS = require("../models/attendanceLogs");
const ATTENDANCECODE = require("../models/attendanceCode");
const PAYROLL = require("../models/payroll");
const DOCUMENT = require("../models/document");
const INCREMENT = require("../models/increment");
const HOLIDAY = require("../models/holiday"); 
const SALARY = require("../models/payslip");
const DEPARTMENT = require("../models/department");
const DESIGNATION = require("../models/designation");
const moment = require("moment");
const { uploadFile, deleteFile, getSignedURL } = require("../services/s3");
const momentWeek = require("moment-weekdaysin");
const axios = require("axios").default;
const {
  validateRegister,
  validateUpdatedEmployee,
} = require("../validations/user");
const XLSHEET = require("../models/xlsSheet");
let pdf = require("pdf-creator-node");  
const fs = require("fs");
const sharp = require('sharp');
const excel = require("exceljs");
const {
  initialPayroll
} = require("../middlewares/payrollHandler");
const { sendMail } = require("../utils/sendMail");
const { baseUrl,organizationAccountNumber } = require("../config");
const QRCode = require('qrcode');
const { getSalaryInformation,generateXlsSheet,getXlsRecord,getOvertimeRecordsOfUser } = require("../controllers/attendance");
const { getHolidays } = require("../utils/getAllHolidays");
const { createExcelSheet } = require("../utils/generateXlsSheet");
const { ORGANIZATION_TYPES } = require('../enum');
const { afterEmpUpdateNotification } = require("../controllers/notification");
const INTERVIEW = require("../models/interview");

exports.register = async (req, res, next) => {
  try {
    const payload = req.body;
    let dummyDeptId = payload.bankId;
    delete payload['bankId'];
    let roleValue;

    if (payload.status === "Single") {
      payload.marriageDate = '';
    }
    if (payload.role === "User") {
      roleValue = 'user';
    }else if(payload.role === "HR"){
      roleValue = 'HR';
    }else{
      roleValue = 'HR Recruiter';
    }

    
   const role = await ROLE.findOne({ name: new RegExp(roleValue, "i") }, "_id");
   
    
    /* get all departments */
    let allDepartments = await DEPARTMENT.find({});
    allDepartments= JSON.parse(JSON.stringify(allDepartments));
   
    let allBankNames = await BANKNAME.find({isDeleted:false});
   
   payload.correspondenceAddress = payload.correspondenceAddress.trim();
   payload.permanentAddress = payload.permanentAddress.trim();

   if (!role) {
    payload.allDept = allDepartments;
    payload.allBanks = allBankNames;
    payload.bankId = dummyDeptId;
    throw new APIError({
      message: "It seems that the system role are not generated yet.",
      template: "admin/addEmployee",
      oldValues: payload,
    });
  }

   if((moment(new Date(payload.birthDate)).isSame(moment(), 'day')) || (moment(new Date(payload.birthDate)).isAfter(moment(), 'day'))){
    payload.allDept = allDepartments;
    payload.allBanks = allBankNames;
    payload.bankId = dummyDeptId;
    throw new APIError({
      message: "select valid DOB.",
      template: "admin/addEmployee",
      oldValues: payload,
    });
  }
  if(parseInt(payload.totalMinutes)<=0){
    payload.allDept = allDepartments;
    payload.allBanks = allBankNames;
    payload.bankId = dummyDeptId;
    throw new APIError({
      message: "Total minutes must be greater than 0.",
      template: "admin/addEmployee",
      oldValues: payload,
    });
  }

  if(payload.bankName || dummyDeptId){
    if(!payload.bankName || !dummyDeptId){
      payload.allDept = allDepartments;
      payload.allBanks = allBankNames;
      payload.bankId = dummyDeptId;
      throw new APIError({
        message: "select bank name from dropdown",
        template: "admin/addEmployee",
        oldValues: payload,
      });
    }
  }   

    let record = await USER.findOne({
      email: payload.email,
      isDeleted: false,
      isLeft: false,
    });
    let leftRecord = await USER.findOne({
      email: payload.email,
      isDeleted: false, 
      isLeft: true,
    });
    if (record || leftRecord) {
      payload.allDept = allDepartments;
      payload.allBanks = allBankNames;
      payload.bankId = dummyDeptId;
      throw new APIError({
        message: "email already exist",
        template: "admin/addEmployee",
        oldValues: payload,
      });
    }
    const validateError = validateRegister.body.validate(payload).error;

    if (validateError) {
      payload.allDept = allDepartments;
      payload.allBanks = allBankNames;
      payload.bankId = dummyDeptId;
      throw new APIError({
        message: validateError.message,
        template: "admin/addEmployee",
        oldValues: payload,
      });
    }

    const entryTime = payload.officeStartTime;
    const entryTimeSplitArray = entryTime.split(":");
    const entryTimeMinutes = (parseInt(entryTimeSplitArray[0])*60)+parseInt(entryTimeSplitArray[1]);

    const lateReasonTime = payload.lateReasonMinute;
    const lateReasonTimeSplitArray = lateReasonTime.split(":");
    const lateReasonMinutes = (parseInt(lateReasonTimeSplitArray[0])*60)+parseInt(lateReasonTimeSplitArray[1]);

    if(lateReasonMinutes <= entryTimeMinutes){
      payload.allDept = allDepartments;
      payload.allBanks = allBankNames;
      payload.bankId = dummyDeptId;
      throw new APIError({
        message: "Invalid late entry reason time.",
        template: "admin/addEmployee",
        oldValues: payload,
      });
    }

    /* validate password and confirm password */
    if(payload.password!=payload.confirmPassword){
      payload.allDept=allDepartments;
      payload.allBanks = allBankNames;
      payload.bankId = dummyDeptId;
      throw new APIError({
        message: "password and confirm password is not same",
        template: "admin/addEmployee",
        oldValues: payload,
      });
    }
    delete payload['confirmPassword'];
    delete payload['bankName'];
    payload.role = role._id;
    /* create attendance code */
    const attendanceCode = await ATTENDANCECODE.findOne({ index: 0 });
    payload.attendanceCode = "BS" + attendanceCode.code;

    const todayDate = moment(new Date()).format("YYYY-MM-DD");
    if(dummyDeptId){
    payload['bankId'] = dummyDeptId;
    }
    if(payload.overtime == 'false'){
      payload.overTimeMinute = '15';
    }
    payload.officeStartTime = moment.tz(`${todayDate} ${payload.officeStartTime}`, true, "Asia/Kolkata").format();
    payload.officeEndTime = moment.tz(`${todayDate} ${payload.officeEndTime}`, true, "Asia/Kolkata").format();
    payload.lateReasonMinute =moment.tz(`${todayDate} ${payload.lateReasonMinute}`, true, "Asia/Kolkata").format();

    const user = await USER.create(payload);

    await ATTENDANCECODE.findOneAndUpdate(
      { index: 0 },
      { $set: { code: ++attendanceCode.code } },
      { new: true }
    );
    /*  upload photo*/
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
        let originalFilePath = `users/${user._id}/documents/original/${fileName}`;
        responseData = await uploadFile(originalFilePath, thumbnail, fileType);
        if(responseData){
          await USER.findOneAndUpdate(
              { _id: user._id, isDeleted: false },
              { $set: { photo: fileName } },
              { new: true }
            );
          }
      }
    });
    return res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

exports.all = async (req, res, next) => {
  try {
    if(!req.session.user){
      res.redirect("/auth/login");
    }else{
      const user = await USER.findOne({ _id: req.session.user._id, isDeleted: false }).populate('designation role bankId department');
      if (['admin','HR'].includes(user.role.name)) {
        //User full Name and position
        const firstName = (user.firstName)? user.firstName : "";
        const middleName = (user.middleName)? user.middleName : "";
        const lastName = (user.lastName)? user.lastName : "";
        const userPosition = (user.designation)? user.designation.designationName : 'Head of Company';
        return res.sendRender("admin/employee", null, null, {
          userName: firstName+" "+middleName+" "+lastName,
          userDesignation: userPosition,
          email: user.email,
          sideTab: "employee",
        });
      } else {
        let userProfileImage = null;
        if (user.photo) {
          let originalFilePath = `users/${user._id}/documents/original/${user.photo}`;
          let documentURL = await getSignedURL(originalFilePath);
          userProfileImage = documentURL.signedUrl;
        }
        
        return res.sendRender("employee/employeeDashboard", null, null, {
          userUpdateRecords: user,
          userProfileImage : userProfileImage,
          moment: moment,
          sideTab: "userProfile",
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

const getUpdateData = (userId)=>{
  return new Promise(async (resolve, reject) => {
    try {
      const _id = userId;
      const employee = await USER.findOne({ _id, isDeleted: false }).populate('bankId role');
      employee.sideTab = "employee";
      let allDepartments = await DEPARTMENT.find({});
      employee.allDept = allDepartments;
      
      let allDesignation=await DESIGNATION.find({departmentId:employee.department});
      employee.allDesg=allDesignation;

      let allBankNames = await BANKNAME.find({isDeleted: false});
      employee.allBanks=allBankNames;
      employee.moment=moment;

      if (employee.photo) {
        let originalFilePath = `users/${employee._id}/documents/original/${employee.photo}`;
        let documentURL = await getSignedURL(originalFilePath);
        employee.photo = documentURL.signedUrl;
      }

      return resolve(employee);
    }catch (error) {
      return reject(error);
    }
  });  
}
exports.showUpdate = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const employee = await getUpdateData(_id);
    return res.sendRender("admin/updateEmployee", null, null, employee);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const payload = req.body;
    let roleValue;

    const employeePrevAttendanceType = await USER.findOne({ _id, isDeleted: false },'attendanceType');

    let dummyDeptId = payload.bankId;
    delete payload['bankId'];
    const todayDate = moment(new Date()).format("YYYY-MM-DD");
    
    if (payload.status === "Single") {
      payload.marriageDate = '';
    }
    if (payload.role === "User") {
      roleValue = 'user';
    }else if(payload.role === "HR"){
      roleValue = 'HR';
    }else{
      roleValue = 'HR Recruiter';
    }
   
    const role = await ROLE.findOne({ name: new RegExp(roleValue, "i") }, "_id");
    payload.correspondenceAddress = payload.correspondenceAddress.trim();
    payload.permanentAddress = payload.permanentAddress.trim();
    const _query = { _id, isDeleted: false };
    
    const record = await USER.find(
      { isDeleted: false, isLeft: false },
      "_id firstName email"
    );
    
    const lerfRecord = await USER.find(
      { isDeleted: false, isLeft: true },
      "_id firstName email"
    );
    
    let editableID = JSON.stringify(_id), flag = 0, leftFlag = 0;

    record.forEach((element) => {
      let strId = JSON.stringify(element._id);
      if (editableID != strId) {
        if (element.email === payload.email) {
          flag = 1;
        }
      }
    });

    lerfRecord.forEach((element) => {
      let strIdLeft = JSON.stringify(element._id);
      if (editableID != strIdLeft) {
        if (element.email === payload.email) {
          leftFlag = 1;
        }
      }
    });

    if (flag == 1 || leftFlag == 1) {
      let employee = await getUpdateData(_id);
      throw new APIError({
        message: "email already exist",
        template: "admin/updateEmployee",
        oldValues: employee,
      });
    }
    
    if(employeePrevAttendanceType.attendanceType !== payload.attendanceType){
      const todaysDateFormate = moment().format("YYYY-MM-DD");
      const todaysStartDate = moment(moment(todaysDateFormate)).startOf('day').toDate();
      const todaysEndDate = moment(moment(todaysDateFormate)).endOf('day').toDate();
      const todaysAttendanceTableRecord = await ATTENDANCE.findOne({ user: _id,createdAt:{ $gte :todaysStartDate ,$lte :todaysEndDate }});
      if(todaysAttendanceTableRecord){
        let employee = await getUpdateData(_id);
        throw new APIError({
          message: "You can change attendance mode tomorrow.",
          template: "admin/updateEmployee",
          oldValues: employee,
        });
      }



      const prevAttendanceTableRecord = await ATTENDANCE.findOne({ user: _id}).sort({createdAt: -1});
      if(prevAttendanceTableRecord){
        const prevDate = prevAttendanceTableRecord.startTime;
        const prevDateFormate = moment(prevDate).format("YYYY-MM-DD");
        const prevStartDate = moment(moment(prevDateFormate)).startOf('day').toDate();
        const prevEndDate = moment(moment(prevDateFormate)).endOf('day').toDate();
        const prevDayAttendanceLogRecord = await ATTENDANCELOGS.findOne({ user: _id ,createdAt:{ $gte :prevStartDate ,$lte :prevEndDate }}).sort({createdAt: -1});
        if(prevDayAttendanceLogRecord){
          if(!prevDayAttendanceLogRecord.endTime){
            let employee = await getUpdateData(_id);
            throw new APIError({
              message: "Previous session of this user is not end till now.",
              template: "admin/updateEmployee",
              oldValues: employee,
            });
          }
        }
      }
    }




    if((moment(new Date(payload.birthDate)).isSame(moment(), 'day')) || (moment(new Date(payload.birthDate)).isAfter(moment(), 'day'))){
      let employee = await getUpdateData(_id);
      throw new APIError({
        message: "select valid DOB.",
        template: "admin/updateEmployee",
        oldValues: employee,
      });
    }

    if(payload.bankName || dummyDeptId){
      if(!payload.bankName || !dummyDeptId){
        let employee = await getUpdateData(_id);
        throw new APIError({
          message: "select bank name from dropdown.",
          template: "admin/updateEmployee",
          oldValues: employee,
        });
      }
    }

    if(parseInt(payload.totalMinutes)<=0){
      let employee = await getUpdateData(_id);
      throw new APIError({
        message: "Total minutes must be greater than 0.",
        template: "admin/updateEmployee",
        oldValues: employee,
      });
    }
  
  /* check late reason valid or not */
  const entryTime = payload.officeStartTime;
  const entryTimeSplitArray = entryTime.split(":");
  const entryTimeMinutes = (parseInt(entryTimeSplitArray[0])*60)+parseInt(entryTimeSplitArray[1]);

  const lateReasonTime = payload.lateReasonMinute;
  const lateReasonTimeSplitArray = lateReasonTime.split(":");
  const lateReasonMinutes = (parseInt(lateReasonTimeSplitArray[0])*60)+parseInt(lateReasonTimeSplitArray[1]);

  if(lateReasonMinutes <= entryTimeMinutes){
    let employee = await getUpdateData(_id);
    throw new APIError({
      message: "Invalid late entry reason time.",
      template: "admin/updateEmployee",
      oldValues: employee,
    });
  }

    const validateError = validateUpdatedEmployee.body.validate(payload).error;
    if (validateError) {
      let employee = await getUpdateData(_id);
      throw new APIError({
        message: validateError.message,
        template: "admin/updateEmployee",
        oldValues: employee,
      });        
    }
    delete payload['bankName'];
    if(dummyDeptId){
      payload['bankId'] = dummyDeptId;
    }else{
      payload['bankId'] = null;
    }
    if(payload.overtime == 'false'){
      payload.overTimeMinute = '15';
    }
    payload.role = role._id;
    payload.officeStartTime = moment.tz(`${todayDate} ${payload.officeStartTime}`, true, "Asia/Kolkata").format();
    payload.officeEndTime = moment.tz(`${todayDate} ${payload.officeEndTime}`, true, "Asia/Kolkata").format();
    payload.lateReasonMinute = moment.tz(`${todayDate} ${payload.lateReasonMinute}`, true, "Asia/Kolkata").format();
    /*  upload photo*/
    let docFiles = req.files, fileName;
    Object.keys(docFiles).forEach(async (properties) => {
      const user = await USER.findOne(_query);
      //Upload File to S3      
      let buffer = docFiles[properties][0].buffer;
      let originalFileName = docFiles[properties][0].originalname;
      let originalFileNameSplit = originalFileName.split(".");
      let fileType = originalFileNameSplit[1];
      fileName =originalFileNameSplit[0] + "_" + new Date().valueOf() + "." + fileType;
      if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
        let thumbnail;        
        if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
        if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();        
        let originalFilePath = `users/${_id}/documents/original/${fileName}`;
        let responseData = await uploadFile(originalFilePath, thumbnail, fileType);
        if(responseData){
          await USER.findOneAndUpdate(
            _query,
            { $set: { photo: fileName } },
            { new: true }
          );
            //Delete existing profile photo
        let deleteFilePath = `users/${_id}/documents/original/${user.photo}`;
        await deleteFile(deleteFilePath); 
        }             
      }
      
    });   

    const employee = await USER.findOneAndUpdate(
      _query,
      { $set: payload },
      { new: true }
    );

    await afterEmpUpdateNotification(employee);
     
    return res.redirect("/admin/view/" + "profile" + "/" + _id+ "?profileUpdated=true");
    
  } catch (error) {
    next(error);
  }
};

exports.left = async (req, res, next) => {
  try {
    const payload = req.body;
    const _id = payload.leftUserId;
    const _query = { _id, isDeleted: false, isLeft: false };
    const _delete = {
      $set: {
        isLeft: true,
        leftReason: payload.leftReason,
        leftLetter: payload.leftLetter,
        leftDate: payload.leftDate,
        resignDate: payload.resignDate,
      },
    };
    await USER.findOneAndUpdate(_query, _delete, { new: true });
    return res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

exports.showView = async (req, res, next) => {
  try {
    initialPayroll();
    const _id = req.params.id;
    let payroll = await PAYROLL.findOne({ user: _id, isDeleted: false });
    //payroll = JSON.parse(JSON.stringify(payroll));
    if (payroll) {
      //decryptPayroll(payroll, payroll.iv);
    }
    const document = await DOCUMENT.findOne({ user: _id, isDeleted: false });
    if (document) {
     
      if (document.offerLetterDocument) {
        let originalFilePath = `users/${document.user}/documents/original/${document.offerLetterDocument}`;
        let documentURL = await getSignedURL(originalFilePath);
        document.offerLetterDocument = documentURL.signedUrl;
      }
      if (document.appoinmentLetterDocument) {
        let originalFilePath = `users/${document.user}/documents/original/${document.appoinmentLetterDocument}`;
        let documentURL = await getSignedURL(originalFilePath);
        document.appoinmentLetterDocument = documentURL.signedUrl;
      }
      if (document.marksheet10Document) {
        let originalFilePath = `users/${document.user}/documents/original/${document.marksheet10Document}`;
        let documentURL = await getSignedURL(originalFilePath);
        document.marksheet10Document = documentURL.signedUrl;
      }
      if (document.marksheet12Document) {
        let originalFilePath = `users/${document.user}/documents/original/${document.marksheet12Document}`;
        let documentURL = await getSignedURL(originalFilePath);
        document.marksheet12Document = documentURL.signedUrl;
      }
      if (document.bachelorsCertificateDocument) {
        let originalFilePath = `users/${document.user}/documents/original/${document.bachelorsCertificateDocument}`;
        let documentURL = await getSignedURL(originalFilePath);
        document.bachelorsCertificateDocument = documentURL.signedUrl;
      }
      if (document.mastersCertificateDocument) {
        let originalFilePath = `users/${document.user}/documents/original/${document.mastersCertificateDocument}`;
        let documentURL = await getSignedURL(originalFilePath);
        document.mastersCertificateDocument = documentURL.signedUrl;
      }
      if (document.IDproofDocument) {
        let originalFilePath = `users/${document.user}/documents/original/${document.IDproofDocument}`;
        let documentURL = await getSignedURL(originalFilePath);
        document.IDproofDocument = documentURL.signedUrl;
      }
      if (document.otherDocument) {
        for (let i = 0; i < document.otherDocument.length; i++) {
          let originalFilePath = `users/${document.user}/documents/original/${document.otherDocument[i]}`;
          let documentURL = await getSignedURL(originalFilePath);
          document.otherDocument[i] = documentURL.signedUrl;
        }
      }
    }
    let allIncrements = null;
    let previousAllIncrements = null;
    if(!payroll){
      previousAllIncrements = await INCREMENT.find({ user: _id, isDeleted: false});
    }
    if(payroll){
      previousAllIncrements = await INCREMENT.find({ user: _id, isDeleted: false, payrollID:{$ne :payroll._id}});
      allIncrements = await INCREMENT.find({ user: _id, isDeleted: false, payrollID:{$eq :payroll._id}});
      allIncrements = JSON.parse(JSON.stringify(allIncrements));
    }

    
    /* last increment */
    const lastIncrementRecord = await INCREMENT.findOne({ user: _id, isDeleted:false }).sort({createdAt: -1});
    const user = await USER.findOne({ _id, isDeleted: false, isLeft: false }).populate('bankId role');
    
    if (req.query.isError) {
      user.isError = true;
    }
    if (req.query.profileUpdated) {
      user.profileUpdated = true;
    }
    if (user.photo) {
      let originalFilePath = `users/${user._id}/documents/original/${user.photo}`;
      let documentURL = await getSignedURL(originalFilePath);
      user.photo = documentURL.signedUrl;
    }
    
    let departmentID = await DEPARTMENT.findOne({ _id: user.department });
    departmentID = JSON.stringify(departmentID);
    departmentID = JSON.parse(departmentID);
    let deptName = departmentID.departmentName;
    user.departmentName = deptName;

    let designationID = await DESIGNATION.findOne({ _id: user.designation });
    designationID = JSON.stringify(designationID);
    designationID = JSON.parse(designationID);
    let designName = designationID.designationName;
    user.designationName = designName;

    let allDepartments = await DEPARTMENT.find({});
    user.allDept = allDepartments;

    let allBankNames = await BANKNAME.find({isDeleted: false});
    user.allBanks=allBankNames;

    let allDesignation = await DESIGNATION.find({
      departmentId: user.department,
    });
    user.allDesg = allDesignation;

    // Qr code Generation
    const qrCodeResponse=await QRCode.toDataURL(user.attendanceCode);
    if(qrCodeResponse){
      if (!fs.existsSync("./public/uploadqrCode")) {
        fs.mkdirSync("./public/uploadqrCode");
      }
      const qrCodeHtml = fs.readFileSync("./views/qrCodeTemplate.html", "utf8");
      const qrCodeOptions = {
        format: "A4",
        orientation: "portrait",
        border: "10mm",
        footer: {
          height: "0mm",
          contents: {},
        },
      };
      let qrCodeDocument = {
        html: qrCodeHtml,
        data: {
          users: 
         [ { firstName : user.firstName + " " + user.middleName + " " + user.lastName,
          url : qrCodeResponse }]
        },
        path: "./public/uploadqrCode/qrCode.pdf",
      };
      pdf
        .create(qrCodeDocument, qrCodeOptions)
        .then((res) => {})
        .catch((error) => {
          next(error);
        });
    }

    const selectAttMonth = moment().format("YYYY-MM");
    let findMonthAttendance;
    if(req.query.salaryMonth){
      findMonthAttendance = req.query.salaryMonth;
    }else{
      findMonthAttendance = moment().format("YYYY-MM")
    }

    // Get salary from payroll if trainee then stipend else take salary.
    let salary_amount = 0, empPayrollJoiningDate = null;
    if(user.position == 'Trainee'){
      if(payroll){if(payroll.stipend){salary_amount = parseInt(payroll.stipend)}else{salary_amount = 0;}
      }else{
        salary_amount = 0;
      }
    }
    else{
      if(payroll){
        if(payroll.salary){
          let fromIncrementGetSalary = await INCREMENT.find({ user: _id, isDeleted: false, payrollID: payroll._id }).sort({createdAt: -1});
          let flag = 0;
          for (const element of fromIncrementGetSalary) {
            let matchDate = moment(new Date(element.effectiveFrom)).format("YYYY-MM");
            if((moment(findMonthAttendance).isSame(matchDate)) || (moment(findMonthAttendance).isAfter(matchDate))){
              salary_amount = element.totalSalary;
              flag = 1;
              break;
            }
          }
          if(flag == 0){
            salary_amount = fromIncrementGetSalary[0].totalSalary;
          }
        }else{
        salary_amount = 0;
        }
      }else{salary_amount =0;}
    }
    
    let salary_Info_Obj;
    // Get all salary information.
    if(payroll && payroll.trainingStartDate){
      empPayrollJoiningDate = payroll.trainingStartDate;
    }else if(payroll && payroll.joiningDate){
      empPayrollJoiningDate = payroll.joiningDate;
    }
    salary_Info_Obj = await getSalaryInformation(_id,findMonthAttendance,salary_amount, user.leaveCreditType,user.createdAt,empPayrollJoiningDate);
    
    // Generate salary slip
    let html = fs.readFileSync("./views/pdfTemplate.html", "utf8");
    let options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
      footer: {
        height: "0mm",
        contents: {},
      },
    };
    let joiningDate = "-";
    let bankName = "-";
    let accountNumber = "-";
    if (user.accountNumber) {
      accountNumber = user.accountNumber;
    }
    if (user.bankId) {
      bankName = user.bankId.bankName;
    }
    if (payroll) {
      if(payroll.joiningDate){
      joiningDate = payroll.joiningDate;
      joiningDate = moment(joiningDate).format("DD-MM-YYYY");
      }
    }
    

    let salary_slip_object = {};
    let salaryslip = await SALARY.findOne({ user: _id, monthYear: findMonthAttendance});
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
    
    salary_slip_object.employeeCode = user.attendanceCode;
    salary_slip_object.firstName = user.firstName + " " + user.middleName + " " + user.lastName;
    salary_slip_object.birthDate = moment(user.birthDate).format("DD-MM-YYYY");
    salary_slip_object.department = deptName;
    salary_slip_object.designation = designName;
    salary_slip_object.daysWorked = (salary_Info_Obj.empPresentDays+salary_Info_Obj.totalHolidays)+'/'+salary_Info_Obj.totalDays;
    salary_slip_object.joiningDate = joiningDate;
    salary_slip_object.basicPay =  (salary_Info_Obj.total_salary + salary_Info_Obj.holiday_rupees + salary_Info_Obj.deductedLeaveEncashment);
    salary_slip_object.overtimeAllowance = salary_Info_Obj.overtime_rupees;
    salary_slip_object.specialAllowane = specialAllowance;
    salary_slip_object.leaveEncashment = salary_Info_Obj.leave_cashment;
    salary_slip_object.patrol = petrolAllowance;
    salary_slip_object.shift = shift;
    salary_slip_object.bonus = bonus;
    salary_slip_object.professionalTax = professionalTax;
    salary_slip_object.securityDeposit = securityDeposit;
    salary_slip_object.tds = tds;
    let earings = (salary_Info_Obj.finalSalary+specialAllowance+bonus+petrolAllowance+shift);
    let deduction = (professionalTax + esic + securityDeposit + tds + pf + other);
    salary_slip_object.netPay = ( earings - deduction);
    salary_slip_object.bankName = bankName;
    salary_slip_object.accountNumber = accountNumber;
    salary_slip_object.payDate = moment(findMonthAttendance+"-01").format("DD-MM-YYYY");
    salary_slip_object.headerDate = moment(findMonthAttendance).format("MMMM YYYY");
    salary_slip_object.pf = pf;
    salary_slip_object.other = other;
    salary_slip_object.esic = esic;
    salary_slip_object.basicAmount = salary_Info_Obj.finalSalary;
    
    // Pass rounded value to salary slip
    salary_slip_object.basicPayAmount =  parseFloat(salary_Info_Obj.total_salary + salary_Info_Obj.holiday_rupees + salary_Info_Obj.deductedLeaveEncashment).toFixed(3);
    salary_slip_object.leaveEncashmentAmount = parseFloat(salary_Info_Obj.leave_cashment).toFixed(3);
    salary_slip_object.overtimeAllowanceAmnount = parseFloat(salary_Info_Obj.overtime_rupees).toFixed(3);

    let users = [];
    users.push(salary_slip_object);

    let excelDocument = {
      html: html,
      data: {
        users: users,
      },
      path: "./public/uploadPDF/paySlip.pdf",
    };
    pdf
      .create(excelDocument, options)
      .then((res) => {})
      .catch((error) => {
        next(error);
      }); 



    let selectedTab = req.params.selectedTab;
    
    
    let overtimeRecord;
    let overtimeRecordLength = 0
    if(user.overtime){
      // Overtime
      overtimeRecord = await getOvertimeRecordsOfUser(_id,findMonthAttendance);
      overtimeRecordLength = overtimeRecord.length;
    }
    
    // Get all holidays
    let monthHolidays = await getHolidays(findMonthAttendance);

    //Increment effective month range.
      // Min date for increment
    let minEffectiveDateIncrement = null;
    if(lastIncrementRecord && lastIncrementRecord.effectiveFrom){
      minEffectiveDateIncrement = lastIncrementRecord.effectiveFrom;
    }
     
     
     return res.sendRender("account", null, null, {
      userUpdateRecords: user,
      payrollUpdateRecords: payroll,
      documentUpdateRecords: document,
      incrementData: allIncrements,
      prevIncrementData:previousAllIncrements,
      lastIncrementData : lastIncrementRecord,
      selectedTab: { status: selectedTab },
      sideTab: "employee",
      moment: moment,
      max_selectAttendance: selectAttMonth,
      findMonthAttendance: findMonthAttendance,
      salary_Information: salary_Info_Obj,
      editSalarySlip: salary_slip_object,
      payrollStatus: salary_amount,
      isCurrentMonth: moment(new Date(findMonthAttendance)).isSame(moment(), 'month'),
      sendMailStatus: (req.query.sendMailStatus)? true : false,
      overtimeRecordLength: overtimeRecordLength,
      holidayOfMonth: monthHolidays,
      minEffectiveDateIncrement: minEffectiveDateIncrement,
      effectiveFromDefaultDate: moment().format("YYYY-MM")
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.viewDeleted = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const user = await USER.findOne({ _id, isDeleted: false });
    let selectedTab = req.params.selectedTab;
    if (user.photo) {
      let originalFilePath = `users/${user._id}/documents/original/${user.photo}`;
      let documentURL = await getSignedURL(originalFilePath);
      user.photo = documentURL.signedUrl;
    }
    return res.sendRender("admin/leftEmployeeDashboard", null, null, {
      userUpdateRecords: user,
      selectedTab: { status: selectedTab },
      left: { status: "yes" },
      sideTab: "left",
      moment: moment,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDeleted: false, isLeft: true };
    const _delete = { $set: { isDeleted: true } };
    await USER.findOneAndUpdate(_query, _delete);
    await PAYROLL.findOneAndUpdate({ user: _id, isDeleted: false }, _delete);
    await DOCUMENT.findOneAndUpdate({ user: _id, isDeleted: false }, _delete);
    return res.redirect("/admin/leftEmployees/");
  } catch (error) {
    next(error);
  }
};

exports.restore = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDeleted: false, isLeft: true };
    const _delete = { $set: { isLeft: false } };
    await USER.findOneAndUpdate(_query, _delete);
    await PAYROLL.findOneAndUpdate({ user: _id, isDeleted: false }, _delete);
    await DOCUMENT.findOneAndUpdate({ user: _id, isDeleted: false }, _delete);
    return res.redirect("/admin/leftEmployees");
  } catch (error) {
    next(error);
  }
};

exports.leftEmployee = async (req, res, next) => {
  try {
    const employees = {};
    employees.sideTab = "left";
    return res.sendRender("admin/leftEmployees", null, null, employees);
  } catch (error) {
    next(error);
  } 
};

exports.storeIncrement = async (req, res, next) => {
  try {
    const _id = req.params.id;
    let incrementData = req.body;
    if (
      req.body.previousSalary <= 0 ||
      req.body.salaryInPercentage <= 0 ||
      req.body.salaryInRupees <= 0 ||
      req.body.totalSalary <= 0
    ) {
      return res.redirect("/admin/view/" + "increment" + "/" + _id);
    }  
    // incrementData.incrementDate = moment(new Date(incrementData.incrementDate)).format("DD MMM YYYY");
    incrementData.lastUpdated = moment(new Date()).format("DD MMM YYYY");
    incrementData.user = _id;
    let payloadUpdated = {};
    payloadUpdated.salary = incrementData.totalSalary;
    incrementData = JSON.parse(JSON.stringify(incrementData));

    await INCREMENT.create(incrementData);
    const _query = { user: _id, isDeleted: false };

    await PAYROLL.findOneAndUpdate(_query, { $set: payloadUpdated }, { new: true });
    return res.redirect("/admin/view/" + "increment" + "/" + _id);
  } catch (error) {
    next(error);
  }
};

exports.searchMonthRecord = async (req, res, next) => {
  try {
    let queryMonth = "Jan";
    if (req.query.month) {
      queryMonth = req.query.month;
    }
    let months = [
      "Jan",
      "Feb",
      "mar",
      "april",
      "may",
      "june",
      "july",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    let monthIndex = months.findIndex((month) => month === queryMonth);
    const users = await USER.find({ isDeleted: false });
    let payrolls = await PAYROLL.find({ isDeleted: false });
    payrolls = JSON.parse(JSON.stringify(payrolls));
    if (payrolls.length > 0) {
      payrolls.forEach(function (obj) {
        //decryptPayroll(obj, obj.iv);
      });
    }
    let birthdateRecord = [];
    let incrementRecord = [];
    let annevarsaryRecord = [];
    for (const user of users) {
      let month = new Date(user.birthDate).getMonth();
      if (month === monthIndex) {
        birthdateRecord.push(user);
      }
    }
    for (const payroll of payrolls) {
      let month = new Date(payroll.joiningDate).getMonth();
      if (month === monthIndex) {
        incrementRecord.push(payroll);
      }
    }
    for (const annevarsary of users) {
      if (annevarsary.marriageDate) {
        let month = new Date(annevarsary.marriageDate).getMonth();
        if (month === monthIndex) {
          annevarsaryRecord.push(annevarsary);
        }
      }
    }
    return res.sendRender("admin/searchMonthlyRecord", null, null, {
      birthdateRecord,
      incrementRecord,
      annevarsaryRecord,
      userRecord: users,
      month: queryMonth,
      sideTab: "searchtab",
      moment: moment,
    });
  } catch (error) {
    next(error);
  }
};

exports.xlsxShow = async (req, res, next) => {
  try {
    let monthAndYearFormat = moment().format("YYYY-MM");
    return res.sendRender("admin/downloadExcelsheet", null, null, {
      sideTab: "xls",
      monthAndYearFormat: monthAndYearFormat,
      moment : moment
    });
  } catch (error) {
    next(error);
  }
};

exports.xlsxUpload = async (req, res, next) => {
  try {         
    let monthAndYearFormat = req.body.excelMonth;
    let employeeJoiningDate = moment(new Date(monthAndYearFormat)).add(1,'months').format("YYYY-MM");

    // Bigscal xls sheet calculation.
    let basicPayTotal = 0,specialAllowaneTotal = 0,petrolTotal = 0,shiftTotal = 0,bonusTotal=0,leaveEncashmentTotal=0;
    let overtimeAllowanceTotal = 0,tdsTotal = 0,professionalTaxTotal=0,securityDepositTotal=0,pfTotal=0;
    let otherTotal=0,esicTotal=0,netPayTotal=0;

    // HealthRay xls sheet calculation.
    let basicPayTotalHealthRay = 0,specialAllowaneTotalHealthRay = 0,petrolTotalHealthRay = 0,shiftTotalHealthRay = 0,bonusTotalHealthRay = 0,leaveEncashmentTotalHealthRay = 0;
    let overtimeAllowanceTotalHealthRay = 0,tdsTotalHealthRay = 0,professionalTaxTotalHealthRay = 0,securityDepositTotalHealthRay = 0,pfTotalHealthRay = 0;
    let otherTotalHealthRay = 0,esicTotalHealthRay = 0,netPayTotalHealthRay = 0;

    const employees = await USER.find(
      { isDeleted: false, isLeft: false,createdAt:{ $lte :employeeJoiningDate },position: new RegExp("Employee", "i") },
      "-__v -isDeleted -isLeft -updatedAt -deletedAt -deletedBy"
    ).populate('bankId department designation');

    let xlsSheet = [],xlsSheetBank = [],xlsHealthRaySheet = [];
    let xlsBigscalBankSheet = [],xlsHealthRayBankSheet = [];
    
    for(element of employees){
      // Get payroll of employee
      let salaryAmount = 0;
      let payroll = await PAYROLL.findOne({ user: element._id, isDeleted: false });  
      if(payroll){
        if(payroll.salary){
          let fromIncrementGetSalary = await INCREMENT.find({ user: element._id, isDeleted: false, payrollID: payroll._id }).sort({createdAt: -1});
          let flag = 0;
          for (const element of fromIncrementGetSalary) {
            let matchDate = moment(new Date(element.effectiveFrom)).format("YYYY-MM");
            if((moment(monthAndYearFormat).isSame(matchDate)) || (moment(monthAndYearFormat).isAfter(matchDate))){
              salaryAmount = element.totalSalary;
              flag = 1;
              break;
            }
          }
          if(flag == 0){
            salaryAmount = fromIncrementGetSalary[0].totalSalary;
          }
        }else{
          salaryAmount = 0;
        }
      }else{salaryAmount =0;}
      
      
      // If salary amount greater than 0 then add to xlsSheet array;
      if(salaryAmount > 0){
        // Get all salary information.
        let empPayrollJoiningDate = null;
        if(payroll && payroll.trainingStartDate){
          empPayrollJoiningDate = payroll.trainingStartDate;
        }else if(payroll && payroll.joiningDate){
          empPayrollJoiningDate = payroll.joiningDate;
        }

        let salaryInfoObj = await generateXlsSheet(element._id,monthAndYearFormat,salaryAmount, element.leaveCreditType,element.createdAt,empPayrollJoiningDate);
        if(salaryInfoObj.monthly_attendance > 0){
          let xlsData = await getXlsRecord( element._id, monthAndYearFormat, element, salaryInfoObj)
          // Bank xls object.
          let bankSheetData = {
            FromAccountNo: organizationAccountNumber,
            employeeAccountNo: xlsData.accountNumber,
            beneficiaryName: xlsData.employeeName,
            amount: xlsData.netPay,
            paymentMode: xlsData.payStatus,
            date: '',
            ifscCode: xlsData.ifscCode,
            payableLocation: '',
            printLocation: '',
            mobileNo: '',
            mailID: '',
            bene_Address_1: '',
            bene_Address_2: '',
            bene_Address_3: '',
            bene_Address_4: '',
            add_Detail_1: '',
            add_Detail_2: '',
            add_Detail_3: '',
            add_Detail_4: '',
            add_Detail_5: '',
            remark: xlsData.remark
          };
          xlsSheetBank.push(bankSheetData);

          if(element.organizationType == ORGANIZATION_TYPES.BIGSCAL){
            xlsBigscalBankSheet.push(bankSheetData);
            xlsSheet.push(xlsData);
            //Get total of all amount;
            basicPayTotal = basicPayTotal+Number(xlsData.basicPay);
            specialAllowaneTotal = specialAllowaneTotal+Number(xlsData.specialAllowane);
            petrolTotal = petrolTotal+Number(xlsData.petrol);
            shiftTotal = shiftTotal+Number(xlsData.shift);
            bonusTotal = bonusTotal+Number(xlsData.bonus);
            leaveEncashmentTotal = leaveEncashmentTotal+Number(xlsData.leaveEncashment);

            overtimeAllowanceTotal = overtimeAllowanceTotal+Number(xlsData.overtimeAllowance);
            tdsTotal = tdsTotal+Number(xlsData.tds);
            professionalTaxTotal = professionalTaxTotal+Number(xlsData.professionalTax);
            securityDepositTotal = securityDepositTotal+Number(xlsData.securityDeposit);
            pfTotal = pfTotal+Number(xlsData.pf);

            otherTotal = otherTotal+Number(xlsData.other);
            esicTotal = esicTotal+Number(xlsData.esic);
            netPayTotal = netPayTotal+Number(xlsData.netPay);
          }else if(element.organizationType == ORGANIZATION_TYPES.HEALTHRAY){
            xlsHealthRayBankSheet.push(bankSheetData);
            xlsHealthRaySheet.push(xlsData);
            // HealthRay calculation.
            //Get total of all amount;
            basicPayTotalHealthRay = basicPayTotalHealthRay+Number(xlsData.basicPay);
            specialAllowaneTotalHealthRay = specialAllowaneTotalHealthRay+Number(xlsData.specialAllowane);
            petrolTotalHealthRay = petrolTotalHealthRay+Number(xlsData.petrol);
            shiftTotalHealthRay = shiftTotalHealthRay+Number(xlsData.shift);
            bonusTotalHealthRay = bonusTotalHealthRay+Number(xlsData.bonus);
            leaveEncashmentTotalHealthRay = leaveEncashmentTotalHealthRay+Number(xlsData.leaveEncashment);

            overtimeAllowanceTotalHealthRay = overtimeAllowanceTotalHealthRay+Number(xlsData.overtimeAllowance);
            tdsTotalHealthRay = tdsTotalHealthRay+Number(xlsData.tds);
            professionalTaxTotalHealthRay = professionalTaxTotalHealthRay+Number(xlsData.professionalTax);
            securityDepositTotalHealthRay = securityDepositTotalHealthRay+Number(xlsData.securityDeposit);
            pfTotalHealthRay = pfTotalHealthRay+Number(xlsData.pf);

            otherTotalHealthRay = otherTotalHealthRay+Number(xlsData.other);
            esicTotalHealthRay = esicTotalHealthRay+Number(xlsData.esic);
            netPayTotalHealthRay = netPayTotalHealthRay+Number(xlsData.netPay);
          }
        }
      }
    }

    // Generate Xls Sheet for Bigscal
    let worksheetColumnsBigscal = [
      { header: "Employee Code", key: "employeeCode", width: 10 },
      { header: "Bank Account Number", key: "accountNumber", width: 30 },
      { header: "IFSC Code", key: "ifscCode", width: 10 },
      { header: "Employee Name", key: "employeeName", width: 20 },
      { header: "Basic Pay", key: "basicPay", width: 30 },
      { header: "Special Allow", key: "specialAllowane", width: 30 },
      { header: "Petrol Allow", key: "petrol", width: 30 },
      { header: "Shift Allow", key: "shift", width: 30 },
      { header: "Bonus", key: "bonus", width: 30 },
      { header: "leave Encashment Amount",key: "leaveEncashment",width: 30,},
      { header: "Over Time Amount", key: "overtimeAllowance", width: 30 },
      { header: "TDS", key: "tds", width: 30 },
      { header: "Professional tax", key: "professionalTax", width: 30 },
      { header: "security Deposit", key: "securityDeposit", width: 30 },
      { header: "PF", key: "pf", width: 30 },
      { header: "Other Deduction", key: "other", width: 30 },
      { header: "ESIC", key: "esic", width: 30 },
      { header: "Net", key: "netPay", width: 30 },
      { header: "Pay", key: "payStatus", width: 30 },
      { header: "Remark", key: "remark", width: 50 },
    ];
    let xlsSheetObjectBigscal = xlsSheet;
    let bottomTotalBigscal = {
      employeeCode: "Total",
      accountNumber: "",
      ifscCode: "",
      employeeName: "",
      basicPay: basicPayTotal,
      specialAllowane: specialAllowaneTotal,
      petrol: petrolTotal,
      shift: shiftTotal,
      bonus: bonusTotal,
      leaveEncashment: leaveEncashmentTotal,
      overtimeAllowance: overtimeAllowanceTotal,
      tds: tdsTotal,
      professionalTax: professionalTaxTotal,
      securityDeposit: securityDepositTotal,
      pf: pfTotal,
      other: otherTotal,
      esic: esicTotal,
      netPay: netPayTotal
    };
    let xlsFileNameBigscal = "bigscalExcelSheet";
    await createExcelSheet(worksheetColumnsBigscal,xlsSheetObjectBigscal,bottomTotalBigscal,xlsFileNameBigscal);
    

    // Generate Xls Sheet for HealthRay
    let xlsSheetObjectHealthray = xlsHealthRaySheet;
    let bottomTotalHealthray = {
      employeeCode: "Total",
      accountNumber: "",
      ifscCode: "",
      employeeName: "",
      basicPay: basicPayTotalHealthRay,
      specialAllowane: specialAllowaneTotalHealthRay,
      petrol: petrolTotalHealthRay,
      shift: shiftTotalHealthRay,
      bonus: bonusTotalHealthRay,
      leaveEncashment: leaveEncashmentTotalHealthRay,
      overtimeAllowance: overtimeAllowanceTotalHealthRay,
      tds: tdsTotalHealthRay,
      professionalTax: professionalTaxTotalHealthRay,
      securityDeposit: securityDepositTotalHealthRay,
      pf: pfTotalHealthRay,
      other: otherTotalHealthRay,
      esic: esicTotalHealthRay,
      netPay: netPayTotalHealthRay
    };
    let xlsFileNameHealthray = "healthRayExcelSheet";
    await createExcelSheet(worksheetColumnsBigscal,xlsSheetObjectHealthray,bottomTotalHealthray,xlsFileNameHealthray);
    

    // Generate Xls Sheet for Bank
    let worksheetColumnsBank = [
      { header: "From A/C No.", key: "FromAccountNo", width: 10 },
      { header: "A/C no.", key: "employeeAccountNo", width: 10 },
      { header: "Beneficiary Name", key: "beneficiaryName", width: 10 },
      { header: "Amount", key: "amount", width: 10 },
      { header: "Payment Mode", key: "paymentMode", width: 10 },
      { header: "Date", key: "date", width: 10 },
      { header: "IFSC code", key: "ifscCode", width: 10 },
      { header: "Payable Location", key: "payableLocation", width: 10 },
      { header: "Print Location", key: "printLocation", width: 10 },
      { header: "Mobile No", key: "mobileNo", width: 10 },
      { header: "Mail ID", key: "mailID", width: 10 },
      { header: "Bene Address 1", key: "bene_Address_1", width: 10 },
      { header: "Bene Address 2", key: "bene_Address_2", width: 10 },
      { header: "Bene Address 3", key: "bene_Address_3", width: 10 },
      { header: "Bene Address 4", key: "bene_Address_4", width: 10 },
      { header: "Add Detail 1", key: "add_Detail_1", width: 10 },
      { header: "Add Detail 2", key: "add_Detail_2", width: 10 },
      { header: "Add Detail 3", key: "add_Detail_3", width: 10 },
      { header: "Add Detail 4", key: "add_Detail_4", width: 10 },
      { header: "Add Detail 5", key: "add_Detail_5", width: 10 },
      { header: "Remark", key: "remark", width: 10 },
    ];
    let xlsSheetObjectBank = xlsSheetBank;
    let bottomTotalBank = {};
    let xlsFileNameBank = "bankExcelSheet";
    await createExcelSheet(worksheetColumnsBank,xlsSheetObjectBank,bottomTotalBank,xlsFileNameBank);


    // Generate Xls Sheet for Bigscal Bank account.
    let xlsFileNameBigscalBank = "bigscalBankExcelSheet";
    await createExcelSheet(worksheetColumnsBank,xlsBigscalBankSheet,bottomTotalBank,xlsFileNameBigscalBank);

    // Generate Xls Sheet for HealthRay Bank account.
    let xlsFileNameHealthRayBank = "HealthRayBankExcelSheet";
    await createExcelSheet(worksheetColumnsBank,xlsHealthRayBankSheet,bottomTotalBank,xlsFileNameHealthRayBank);
    
    let result= (xlsSheet.length > 0)?"Yes":"No";

    
    let bigscalExcelFileName = `/public/downloadExcel/${xlsFileNameBigscal}.xlsx`;
    let bankExcelFileName = `/public/downloadExcel/${xlsFileNameBank}.xlsx`;
    let healthRayExcelFileName = `/public/downloadExcel/${xlsFileNameHealthray}.xlsx`;
    let bigscalBankExcelFileName = `/public/downloadExcel/${xlsFileNameBigscalBank}.xlsx`;
    let healthRayBankExcelFileName = `/public/downloadExcel/${xlsFileNameHealthRayBank}.xlsx`;

    return res.sendRender("admin/downloadExcelsheet", null, null, {
      status: true,
      dataLength: result,
      sideTab: "xls",
      bigscalExcelFileName: bigscalExcelFileName,
      bankExcelFileName: bankExcelFileName,
      healthRayExcelFileName: healthRayExcelFileName,
      bigscalBankExcelFileName: bigscalBankExcelFileName,
      healthRayBankExcelFileName: healthRayBankExcelFileName,
      monthAndYearFormat: monthAndYearFormat,
      moment: moment,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


exports.sendSalarySlip = async (req, res, next) => {
  try {
    const user = await USER.findOne({ _id: req.params.id,isDeleted: false, isLeft: false });
    attachments = [];
    const fileFromLocal = fs.readFileSync(
      "./public/uploadPDF/paySlip.pdf",
      "base64"
    );
    const emailObject = {
      toEmail: user.email,
      emailSubject: "Salary Slip",
      emailText: "Salary Slip",
    };
    let attachObj = {
      content: fileFromLocal,
      filename: "paySlip.pdf",
      type: "application/pdf",
      disposition: "attachment",
    };
    await attachments.push(attachObj);
    if (attachments.length) emailObject.attachments = attachments;
    const emailResponse = await sendMail(emailObject);
    
    return res.redirect(`/admin/view/salarySlip/${user._id}?sendMailStatus="+${true}&salaryMonth=${req.query.salaryMonth}`);
  } catch (error) {
    next(error);
  }
};

exports.resignation = async (req, res, next) => {
  try {
    let resignation = [];
    return res.sendRender("admin/resignEmployee", null, null, {
      resignation,
      sideTab: "resignation",
      moment: moment,
    });
  } catch (error) {
    next(error);
  }
};

exports.storeDepartments = async (req, res, next) => {
  try {
    let payload = req.body;
    await DEPARTMENT.create(payload);
    let allDepartments = await DEPARTMENT.find({});
    return res.sendRender("admin/addDepartment", null, null, {
      allDepartments,
      sideTab: "deptAndDes",
      selectedTab: { status: selectedTab },
    });
  } catch (error) {
    next(error);
  }
};

exports.showDepartments = async (req, res, next) => {
  try {
    let allDepartments = await DEPARTMENT.find({});
    selectedTab = "department";
    return res.sendRender("admin/addDepartment", null, null, {
      allDepartments,
      sideTab: "deptAndDes",
      selectedTab: { status: selectedTab },
    });
  } catch (error) {
    next(error);
  }
};

exports.showAddEmployee = async (req, res, next) => {
  try {
   let allDepartments=await DEPARTMENT.find({});
   let allBankNames=await BANKNAME.find({isDeleted: false});
   return res.sendRender('admin/addEmployee',null,null,{sideTab:'employee', allDept:allDepartments,  moment: moment, allBanks: allBankNames});
  } catch (error) {
    next(error);
  }
};

exports.showDesignation = async (req, res, next) => {
  try {
    let allDepartments = await DEPARTMENT.find({});
    let allDesignation = await DESIGNATION.find({});
    selectedTab = "designation";
    let allRenderDesignation = [];

    for (const element of allDesignation) {
      let deptID = element.departmentId;
      let allDepartments = await DEPARTMENT.findOne({ _id: deptID });
      allRenderDesignation.push({
        deptName: allDepartments.departmentName,
        designation: element.designationName,
      });
    }
    return res.sendRender("admin/addDepartment", null, null, {
      allDepartments,
      allRenderDesignation,
      sideTab: "deptAndDes",
      selectedTab: { status: selectedTab },
    });
  } catch (error) {
    next(error);
  }
};

exports.storeDesignation = async (req, res, next) => {
  try {
    let payload = req.body;
    const designation = await DESIGNATION.create(payload);
    selectedTab = "designation";
    let allDepartments = await DEPARTMENT.find({});
    let allDesignation = await DESIGNATION.find({});
    let allRenderDesignation = [];

    for (const element of allDesignation) {
      let deptID = element.departmentId;
      let allDepartments = await DEPARTMENT.findOne({ _id: deptID });
      allRenderDesignation.push({
        deptName: allDepartments.departmentName,
        designation: element.designationName,
      });
    }

    return res.sendRender("admin/addDepartment", null, null, {
      allDepartments,
      allRenderDesignation,
      sideTab: "deptAndDes",
      selectedTab: { status: selectedTab },
    });
  } catch (error) {
    next(error);
  }
};

exports.showSearchDesignation = async (req, res, next) => {
  try {
    let allDepartments = await DEPARTMENT.find({});
    selectedTab = "search";
    return res.sendRender("admin/addDepartment", null, null, {
      allDepartments,
      sideTab: "deptAndDes",
      selectedTab: { status: selectedTab },
    });
  } catch (error) {
    next(error);
  }
};

exports.searchDesignation = async (req, res, next) => {
  try {
    let payload = req.body;
    let allDepartments = await DEPARTMENT.find({});
    let allDesignation = await DESIGNATION.find({
      departmentId: payload.departmentId,
    });
    selectedDept = payload.departmentId;
    selectedTab = "search";
    return res.sendRender("admin/addDepartment", null, null, {
      allDepartments,
      selectedDept,
      allDesignation,
      sideTab: "deptAndDes",
      selectedTab: { status: selectedTab },
    });
  } catch (error) {
    next(error);
  }
};
exports.showSearchEmpDesignation = async (req, res, next) => {
  try {
    let allDepartments = await DEPARTMENT.find({});
    selectedTab = "searchEmployee";
    return res.sendRender("admin/addDepartment", null, null, {
      allDepartments,
      sideTab: "deptAndDes",
      selectedTab: { status: selectedTab },
    });
  } catch (error) {
    next(error);
  }
};
exports.getSearchEmpDesignation = async (req, res, next) => {
  try {
    const payload = req.body;
    let allDepartments = await DEPARTMENT.find({});
    const employees = await USER.find(
      { isDeleted: false, isLeft: false, department:payload.department, designation:payload.designation },
      "-__v -isDeleted -isLeft -createdAt -updatedAt -deletedAt -deletedBy"
    );
    selectedTab = "searchEmployee";
    selectedDept = payload.department;
    selectedDesignation = payload.designation;
    return res.sendRender("admin/addDepartment", null, null, {
      allDepartments,
      employees,
      selectedDept,
      selectedDesignation,
      sideTab: "deptAndDes",
      selectedTab: { status: selectedTab },
    });
  } catch (error) {
    next(error);
  }
};
exports.allDepartments = async (req, res, next) => {
  try {
    
    if(req.query.department){
    let deptID= req.query.department;
    let allDesignation=await DESIGNATION.find({departmentId:deptID},'_id designationName');
    res.send(allDesignation);
    }
  } catch (error) {
    next(error);
  }
};
exports.allDesignation = async (req, res, next) => {
  try {
    if(req.query.department && req.query.designation){
    let deptID= req.query.department;
    let designationID= req.query.designation;
    let allDesignation=await DESIGNATION.find({departmentId:deptID},'_id designationName');
    //res.send(allDesignation);
    res.send({designation: allDesignation, dId: designationID});
    }
  } catch (error) {
    next(error);
  }
};

exports.storeAttendanceRecord = async (req, res, next) => {
  try {
    let port = port.portAddress;    
    const URL = `${baseUrl}/dashboard/getCodeapi?code=BS`;
    for (i = 1; i <= 10; i++) {
      for (j = 1; j <= 30; j++) {
        if (
          j === 4 ||
          j === 11 ||
          j === 18 ||
          j === 25 ||
          (i === 1 && j === 5)
        ) {
          console.log("");
        } else {
          let hour = Math.floor(Math.random() * (11 - 8 + 1)) + 8;
          let minute = Math.floor(Math.random() * (60 - 0 + 1)) + 0;
          let timeFormat = hour + ":" + minute;
          let startTime = moment(timeFormat, "HH:mm").format("HH:mm");
          const response = await axios.post(
            URL + `${i}` + `&date=2021-04-${j}&startTime=${startTime}`
          );
          hour = Math.floor(Math.random() * (20 - 16 + 1)) + 16;
          minute = Math.floor(Math.random() * (60 - 0 + 1)) + 0;
          timeFormat = hour + ":" + minute;
          let endTime = moment(timeFormat, "HH:mm").format("HH:mm");
          const response1 = await axios.post(
            URL + `${i}` + `&date=2021-04-${j}&endTime=${endTime}`
          );
        }
      }
    }
    return res.send("ok");
  } catch (error) {
    console.log(error);
  }
};

exports.storeSingleAttendanceRecord = async (req, res, next) => {
  try {    
    
    let date = req.query.date;
    let startTime = moment(req.query.startTime, "HH:mm").format("HH:mm");
    let endTime = moment(req.query.endTime, "HH:mm").format("HH:mm");              
    const URL = `${baseUrl}/dashboard/getCodeapi?code=${req.query.code}&date=${date}`;
    await axios.post(URL + `&startTime=${startTime}`);
    await axios.post(URL + `&endTime=${endTime}`);
    return res.send("ok");
  } catch (error) {}
};
exports.showBankDetails = async (req, res, next) => {
  try {
    let allBankNames = await BANKNAME.find({isDeleted: false});
    return res.sendRender("admin/addBankName", null, null, {
      allBankNames,
      sideTab: "bankNames",
    });
    
  } catch (error) {
    next(error);
  }
};
exports.storeBankName = async (req, res, next) => {
  try {
    let payload = req.body;
    let convertBankName = payload.bankName;
    convertBankName = convertBankName.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
    const record = await BANKNAME.findOne({
      bankName: convertBankName,
      isDeleted: false,
    });
    payload.bankName = convertBankName;
    let bankStatus;
    if(record){
      bankStatus = "Yes";
    }else{
      await BANKNAME.create(payload);
      bankStatus = "No";
    }
    let allBankNames = await BANKNAME.find({isDeleted: false});
    return res.sendRender("admin/addBankName", null, null, {
      allBankNames,
      status: bankStatus,
      sideTab: "bankNames",
      bankName: convertBankName
    });
  } catch (error) {
    next(error);
  }
};
exports.allBankName = async (req, res, next) => {
  try {
    let allBankNames=await BANKNAME.find({isDeleted: false},'bankName _id');
    res.send(allBankNames);
  } catch (error) {
    next(error);
  }
};
exports.allDesignationAndDepartment = async (req, res, next) => {
  try {
    let allDepartments=await DEPARTMENT.find({},'_id departmentName');
    const deptID = allDepartments[0]._id;
    let allDesignation=await DESIGNATION.find({departmentId:deptID},'_id designationName');
    res.send({designation: allDesignation, department: allDepartments});
  } catch (error) {
    next(error);
  }
};
exports.deleteBankDetails = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDeleted: false };
    const _delete = { $set: { isDeleted: true } };
    const updatedData = await BANKNAME.findOneAndUpdate(_query, _delete);
    return res.redirect("/admin/create/bankdetails");
  } catch (error) {
    next(error);
  }
};

exports.getSalaryDetails = async (req, res, next) => {
  try {
  const _id = req.query.userID;
  const findMonthAttendance = req.query.month_Year;
  const user = await USER.findOne({ _id, isDeleted: false, isLeft: false }).populate('bankId department designation');
  let payroll = await PAYROLL.findOne({ user: _id, isDeleted: false });
  let empPayrollJoiningDate = null;
  if(payroll && payroll.trainingStartDate){
    empPayrollJoiningDate = payroll.trainingStartDate;
  }else if(payroll && payroll.joiningDate){
    empPayrollJoiningDate = payroll.joiningDate;
  }
  
  const salary_Info_Obj = await getSalaryInformation(req.query.userID,req.query.month_Year,req.query.salary_amount,req.query.leaveCreditType,req.query.employeeJoiningDate,empPayrollJoiningDate);
  let salary_slip_object = {};
  let salaryslip = await SALARY.findOne({ user: _id, monthYear: findMonthAttendance});
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
  
  let departmetName = "-",designationName = '-',joiningDate = "-",bankName = "-",accountNumber = "-";
  if (user.bankId) {
    bankName = user.bankId.bankName;
  }
  if (user.designation) {
    designationName = user.designation.designationName;
  }
  if (user.department) {
    departmetName = user.department.departmentName;
  }
  if (payroll) {
    if(payroll.joiningDate){
      joiningDate = moment(payroll.joiningDate).format("DD-MM-YYYY");
    }
  }
  if (user.accountNumber) {
    accountNumber = user.accountNumber;
  }

  salary_slip_object.employeeCode = user.attendanceCode;
  salary_slip_object.firstName = user.firstName + " " + user.middleName + " " + user.lastName;
  salary_slip_object.birthDate = moment(user.birthDate).format("DD-MM-YYYY");
  salary_slip_object.department = departmetName;
  salary_slip_object.designation = designationName;
  salary_slip_object.daysWorked = salary_Info_Obj.empPresentDays+'/'+salary_Info_Obj.totalDays;
  salary_slip_object.joiningDate = joiningDate;
  salary_slip_object.basicPay =  (salary_Info_Obj.total_salary + salary_Info_Obj.holiday_rupees);
  salary_slip_object.overtimeAllowance = salary_Info_Obj.overtime_rupees;
  salary_slip_object.specialAllowane = specialAllowance;
  salary_slip_object.leaveEncashment = salary_Info_Obj.leave_cashment;
  salary_slip_object.patrol = petrolAllowance;
  salary_slip_object.shift = shift;
  salary_slip_object.bonus = bonus;
  salary_slip_object.professionalTax = professionalTax;
  salary_slip_object.securityDeposit = securityDeposit;
  salary_slip_object.tds = tds;
  let earings = (salary_Info_Obj.finalSalary+specialAllowance+bonus+petrolAllowance+shift);
  let deduction = (professionalTax + esic + securityDeposit + tds + pf + other);
  salary_slip_object.netPay = ( earings - deduction);
  salary_slip_object.bankName = bankName;
  salary_slip_object.accountNumber = accountNumber;
  salary_slip_object.payDate = moment(findMonthAttendance+"-01").format("DD-MM-YYYY");
  salary_slip_object.headerDate = moment(findMonthAttendance).format("MMMM YYYY");
  salary_slip_object.pf = pf;
  salary_slip_object.other = other;
  salary_slip_object.esic = esic;
  salary_slip_object.basicAmount = salary_Info_Obj.finalSalary;
  
  // Pass rounded value to salary slip
  salary_slip_object.basicPayAmount =  parseFloat(salary_Info_Obj.total_salary + salary_Info_Obj.holiday_rupees).toFixed(3);
  salary_slip_object.leaveEncashmentAmount = parseFloat(salary_Info_Obj.leave_cashment).toFixed(3);
  salary_slip_object.overtimeAllowanceAmnount = parseFloat(salary_Info_Obj.overtime_rupees).toFixed(3);  
  
  res.send({salaryInformation:salary_Info_Obj,editSalary: salary_slip_object});
  } catch (error) {
    console.log(error);
    next(error);
  }
}

exports.showLogs = async (req, res, next) => {
  try {
    let currentDate = moment(new Date()).format("YYYY-MM-DD");

    var roleObj = {admin:"admin",HR:"HR"};
    const roleIDs = await ROLE.find({ name: new RegExp(Object.keys(roleObj).join("|"), "i") }, "_id");

    const hrAndadminObject = await USER.find({ isDeleted: false,role : { $in : roleIDs }},'_id firstName middleName lastName');
    
    const dateRangePickerDate = `${moment(new Date()).subtract(7,'day').format("DD/MM/YYYY")} - ${moment(new Date()).format("DD/MM/YYYY")}`
    
    return res.sendRender("admin/logs", null, null, {
      logsDate: currentDate,
      moment: moment,  
      sideTab: "logs",
      maxDateOfDatePicker: moment(new Date()).format("YYYY-MM-DD"),
      hrAndadminObject: hrAndadminObject,
      dateRangePickerDateForLog: dateRangePickerDate
    });    
  } catch (error) {
    next(error);
  }
};

exports.logAccess = async (req, res, next) => {
  try {
    let userRole;
    const role = await ROLE.findOne({ name: new RegExp("admin", "i") });
    let adminRoleId = role._id.toString();
    let loginUserSessionRole = req.session.user.role.toString();
    if(adminRoleId == loginUserSessionRole){
      userRole = 'admin';
    }else{
      userRole = 'HR';
    }
    res.send({ logStatus: userRole });
  } catch (error) {
    next(error);
  }
};