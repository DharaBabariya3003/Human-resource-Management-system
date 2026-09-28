const APIError = require("../utils/APIError");
const moment = require("moment");
const INTERVIEW = require("../models/interview");
const USER = require("../models/user");
const { validateInterview, validateInterviewUpdate } = require("../validations/interview");
const DATATABLEWEB = require('../utils/dataTable');
const ROLE = require("../models/role");
const { createExcelSheet } = require("../utils/generateXlsSheet");

exports.interviewAll = async (req, res, next) => {
  try {
    return res.sendRender("admin/interview", null, null, {
      currentMonth: moment().format("YYYY-MM"),
      interviewMonth: moment().format("YYYY-MM"),
      moment: moment,
      sideTab: "interview"
    });   
  } catch (error) {
    next(error);
  }
};

const storeInterviewPayload = async(req) =>{
  try{
    let payload = req.body;
    payload.remark = payload.remark.trim();

    let technicalRoundUserName = payload.technicalRoundUserName;
    let hrRoundUserName = payload.hrRoundUserName;
    let referenceUserName = payload.referenceUserName;
    delete payload['technicalRoundUserName'];
    delete payload['hrRoundUserName'];
    delete payload['referenceUserName'];
    
    if(referenceUserName && !payload.referenceUser){
      payload.technicalRoundUserName = technicalRoundUserName;
      payload.hrRoundUserName = hrRoundUserName;
      payload.referenceUserName = referenceUserName;

      let systemUsers = await getUserAndHrRoleForInterview();
      let technicalRound = systemUsers.technicalRound;
      let hrRound = systemUsers.hrRound;

      const userRole = await ROLE.findOne({_id: req.session.user.role});
      const loginUserRoleName = userRole.name;

      return {
        status: false,
        message: "Please select reference user name from dropdown.",
        oldValues: {payload,technicalRound,hrRound,loginUserRoleName},
      }
    }
    
    const validateError = validateInterview.body.validate(payload).error;
    if (validateError) {
      payload.technicalRoundUserName = technicalRoundUserName;
      payload.hrRoundUserName = hrRoundUserName;
      payload.referenceUserName = referenceUserName;

      let systemUsers = await getUserAndHrRoleForInterview();
      let technicalRound = systemUsers.technicalRound;
      let hrRound = systemUsers.hrRound;

      const userRole = await ROLE.findOne({_id: req.session.user.role});
      const loginUserRoleName = userRole.name;

      return {
        status: false,
        message: validateError.message,
        oldValues: {payload,technicalRound,hrRound,loginUserRoleName},
      }
    }
    if(!payload.referenceUser){
      delete payload['referenceUser'];
    }
    payload.dateOfBirth = (payload.dateOfBirth.split("-").reverse().join("-"));
    payload.callDate = (payload.callDate.split("-").reverse().join("-"));

    let interviewTime = moment(payload.interviewTime, ["DD-MM-YYYY hh:mm A"]).format("YYYY-MM-DD HH:mm");
    payload.interviewTime = moment.tz(`${interviewTime}`, true, "Asia/Kolkata").format();
    return {
      status: true,
      data: payload
    }
  }catch(error){}
}

exports.storeInterviewDetails = async (req, res, next) => {
  try {

    let createInterviewResponse = await storeInterviewPayload(req);
    
    if(createInterviewResponse.status){
     await INTERVIEW.create(createInterviewResponse.data);
     return res.redirect("/admin/interview");
    }else{
      throw new APIError({
        message: createInterviewResponse.message,
        template: "admin/addInterviewDetail",
        oldValues: createInterviewResponse.oldValues,
      });
    }

  } catch (error) {
    next(error);
  }
};

const getInterviewUpdateUser = async(id,req)=>{
  try{
    let interview = await INTERVIEW.findOne({ _id: id }).populate('technicalRoundUser hrRoundUser referenceUser');
    let systemUsers = await getUserAndHrRoleForInterview();
    const userRole = await ROLE.findOne({_id: req.session.user.role});
    interview.technicalRound = systemUsers.technicalRound;
    interview.hrRound = systemUsers.hrRound;
    interview.sideTab = "interview";
    interview.moment = moment;
    interview.loginUserRoleName = userRole.name;
    return interview;
  }catch(error){
  }
}

exports.showInterviewUpdate = async (req, res, next) => {
  try {
    let interviewUpdateDetails = await getInterviewUpdateUser(req.params.id,req);
    return res.sendRender("admin/updateInterviewDetail", null, null, interviewUpdateDetails);
  } catch (error) {
    next(error);
  }
};

exports.showInterview = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const interview = await INTERVIEW.findOne({ _id, isDeleted: false }).populate('technicalRoundUser hrRoundUser referenceUser');

    interview.sideTab = "interview";
    interview.moment = moment;
    return res.sendRender("admin/showInterviewDetail", null, null, interview);
  } catch (error) {
    next(error);
  }
};

exports.updateInterview = async (req, res, next) => {
  try {
    const _id = req.params.id;
    let payload = req.body;
    payload.remark = payload.remark.trim();

    let technicalRoundUserName = payload.technicalRoundUserName;
    let hrRoundUserName = payload.hrRoundUserName;
    let referenceUserName = payload.referenceUserName;
    delete payload['technicalRoundUserName'];
    delete payload['hrRoundUserName'];
    delete payload['referenceUserName'];
    
    if(referenceUserName && !payload.referenceUser){
      payload.technicalRoundUserName = technicalRoundUserName;
      payload.hrRoundUserName = hrRoundUserName;
      payload.referenceUserName = referenceUserName;

      payload.moment = moment;
      payload._id = _id;
      
      let systemUsers = await getUserAndHrRoleForInterview();
      let technicalRound = systemUsers.technicalRound;
      let hrRound = systemUsers.hrRound;
      const userRole = await ROLE.findOne({_id: req.session.user.role});
      
      payload.technicalRound = technicalRound;
      payload.hrRound = hrRound;
      payload.loginUserRoleName = userRole.name;

      throw new APIError({
        message: 'Please select reference user name from dropdown.',
        template: "admin/updateInterviewDetail",
        oldValues: payload,
      });
    }
    const validateError = validateInterviewUpdate.body.validate(payload).error;
    if (validateError) {
      payload.technicalRoundUserName = technicalRoundUserName;
      payload.hrRoundUserName = hrRoundUserName;
      payload.referenceUserName = referenceUserName;

      payload.moment = moment;
      payload._id = _id;
      
      let systemUsers = await getUserAndHrRoleForInterview();
      let technicalRound = systemUsers.technicalRound;
      let hrRound = systemUsers.hrRound;
      const userRole = await ROLE.findOne({_id: req.session.user.role});
      
      payload.technicalRound = technicalRound;
      payload.hrRound = hrRound;
      payload.loginUserRoleName = userRole.name;

      throw new APIError({
        message: validateError.message,
        template: "admin/updateInterviewDetail",
        oldValues: payload,
      });
    }
    if(!payload.referenceUser){
      payload.referenceUser = null;
    }
    if (payload.interviewStatus === "No") {
      payload.practicalTestStatus = null;
      payload.communicationSkill = null;
      payload.confidenceOrBodyLang = null;
      payload.logicalSkills = null;
      payload.interviewStatus = false;
    } else {
      payload.interviewStatus = true;
    }

    if(payload.practicalTestStatus == "Done") {
      payload.practicalTestStatus = true;
    }else{
      payload.practicalTestStatus = false;
    }

    
    payload.dateOfBirth = (payload.dateOfBirth.split("-").reverse().join("-"));
    payload.callDate = (payload.callDate.split("-").reverse().join("-"));
    
    let interviewTime = moment(payload.interviewTime, ["DD-MM-YYYY hh:mm A"]).format("YYYY-MM-DD HH:mm");
    payload.interviewTime = moment.tz(`${interviewTime}`, true, "Asia/Kolkata").format();
    


    const _query = { _id, isDeleted: false };
    await INTERVIEW.findOneAndUpdate(
      _query,
      { $set: payload },
      { new: true }
    );
    
    return res.redirect(`/admin/interview/${_id}/view`);
    
  } catch (error) {
    next(error);
  }
};

exports.doneInterview = async (req, res, next) => {
  try {
    return res.sendRender("admin/doneInterview", null, null, {
      currentMonth: moment().format("YYYY-MM"),
      interviewMonth: moment().format("YYYY-MM"),
      moment: moment,
      sideTab: "done"
    });    
  } catch (error) {
    next(error);
  }
};

exports.deleteInterviewDetails = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDeleted: false };
    const _delete = { $set: { isDeleted: true } };
    await INTERVIEW.findOneAndUpdate(_query, _delete);
    return res.redirect("/admin/interview/");
  } catch (error) {
    next(error);
  }
};

exports.deleteDoneInterviewDetails = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDone: true, isDeleted: false };
    const _delete = { $set: { isDeleted: true } };
    await INTERVIEW.findOneAndUpdate(_query, _delete);
    return res.redirect("/admin/interview/done");
  } catch (error) {
    next(error);
  }
};

const getUserAndHrRoleForInterview = async ()=>{
  try{
    // Get user role.
    const employeeRoleId = await ROLE.findOne({name : new RegExp('user',"i")});
    let employees = await USER.find(
      { isDeleted: false, isLeft: false,role: employeeRoleId },
      "_id firstName middleName lastName attendanceCode"
    );

    // Get HR and HR Recruiter role.
    var roleObj = {HR_Recruiter:"HR Recruiter",HR:"HR"};
    const hrRoleIDs = await ROLE.find({ name: new RegExp(Object.keys(roleObj).join("|"), "i") }, "_id");
    let hrObject = await USER.find(
      { isDeleted: false, isLeft: false,role : { $in : hrRoleIDs } },
      "_id firstName middleName lastName attendanceCode"
    );
    return { technicalRound: employees , hrRound: hrObject}
  }catch(error){}
}

exports.createInterview = async (req, res, next) => {
  try {
    
    let systemUsers = await getUserAndHrRoleForInterview();
    const userRole = await ROLE.findOne({_id: req.session.user.role});
    
    
    return res.sendRender('admin/addInterviewDetail',null,null,{
      sideTab: 'interview',
      moment: moment,
      technicalRound: systemUsers.technicalRound,
      hrRound: systemUsers.hrRound,
      loginUserRoleName: userRole.name
    });
    
  } catch (error) {
    next(error);
  }
};
exports.interviewSchedule = async (req, res, next) => {
  try {
    const userRole = await ROLE.findOne({_id: req.session.user.role});
    const roleName = userRole.name;

    return res.sendRender('employee/interview',null,null,{
      moment:moment,
      currentMonth: moment().format("YYYY-MM"),
      interviewMonth: moment().format("YYYY-MM"),
      roleName: roleName,
      sideTab: "interview",
    });

  } catch (error) {
    next(error);
  }
};
exports.interviewScheduleAPI = async (req, res, next) => {
  try {
    let _id = req.session.user._id;
    const userRole = await ROLE.findOne({_id: req.session.user.role});
    const modelObj = INTERVIEW;
    const searchFields = ['name','email'];
    let conditionQuery = { isDeleted: false };
    const projectionQuery = '-__v -isDeleted -createdAt -updatedAt';
    const sortingQuery = {'createdAt': -1};
    const populateQuery = null;

    if(userRole.name == 'user'){
      conditionQuery.technicalRoundUser = _id;
    }

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
      let jsonString = JSON.stringify(data);
      res.send(jsonString);
    });

  } catch (error) {
    next(error);
  }
};
exports.showInterviewEmployee = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const interview = await INTERVIEW.findOne({ _id, isDeleted: false }).populate('technicalRoundUser hrRoundUser referenceUser');

    interview.sideTab = "interview";
    interview.moment = moment;
    return res.sendRender("employee/showInterviewDetail", null, null, interview);
  } catch (error) {
    next(error);
  }
};
exports.showInterviewUpdateEmployee = async (req, res, next) => {
  try {
    let interviewUpdateDetails = await getInterviewUpdateUser(req.params.id,req);
    return res.sendRender("admin/updateInterviewDetail", null, null, interviewUpdateDetails);
  } catch (error) {
    next(error);
  }
};
exports.updateInterviewEmployee = async (req, res, next) => {
  try {
    const _id = req.params.id;
    let payload = req.body;
    payload.remark = payload.remark.trim();

    let technicalRoundUserName = payload.technicalRoundUserName;
    let hrRoundUserName = payload.hrRoundUserName;
    let referenceUserName = payload.referenceUserName;
    delete payload['technicalRoundUserName'];
    delete payload['hrRoundUserName'];
    delete payload['referenceUserName'];
    
    if(referenceUserName && !payload.referenceUser){
      payload.technicalRoundUserName = technicalRoundUserName;
      payload.hrRoundUserName = hrRoundUserName;
      payload.referenceUserName = referenceUserName;

      payload.moment = moment;
      payload._id = _id;
      
      let systemUsers = await getUserAndHrRoleForInterview();
      let technicalRound = systemUsers.technicalRound;
      let hrRound = systemUsers.hrRound;
      const userRole = await ROLE.findOne({_id: req.session.user.role});
      
      payload.technicalRound = technicalRound;
      payload.hrRound = hrRound;
      payload.loginUserRoleName = userRole.name;

      throw new APIError({
        message: 'Please select reference user name from dropdown.',
        template: "admin/updateInterviewDetail",
        oldValues: payload,
      });
    }
    
    const validateError = validateInterviewUpdate.body.validate(payload).error;
    if (validateError) {
      payload.technicalRoundUserName = technicalRoundUserName;
      payload.hrRoundUserName = hrRoundUserName;
      payload.referenceUserName = referenceUserName;
      
      payload.moment = moment;
      payload._id = _id;
      
      let systemUsers = await getUserAndHrRoleForInterview();
      let technicalRound = systemUsers.technicalRound;
      let hrRound = systemUsers.hrRound;
      const userRole = await ROLE.findOne({_id: req.session.user.role});
      
      payload.technicalRound = technicalRound;
      payload.hrRound = hrRound;
      payload.loginUserRoleName = userRole.name;

      throw new APIError({
        message: validateError.message,
        template: "admin/updateInterviewDetail",
        oldValues: payload,
      });
    }
    if(!payload.referenceUser){
      payload.referenceUser = null;
    }
    if (payload.interviewStatus === "No") {
      payload.practicalTestStatus = null;
      payload.communicationSkill = null;
      payload.confidenceOrBodyLang = null;
      payload.logicalSkills = null;
      payload.interviewStatus = false;
    } else {
      payload.interviewStatus = true;
    }

    if(payload.practicalTestStatus == "Done") {
      payload.practicalTestStatus = true;
    }else{
      payload.practicalTestStatus = false;
    }

    
    payload.dateOfBirth = (payload.dateOfBirth.split("-").reverse().join("-"));
    payload.callDate = (payload.callDate.split("-").reverse().join("-"));
    
    let interviewTime = moment(payload.interviewTime, ["DD-MM-YYYY hh:mm A"]).format("YYYY-MM-DD HH:mm");
    payload.interviewTime = moment.tz(`${interviewTime}`, true, "Asia/Kolkata").format();
    


    const _query = { _id, isDeleted: false };
    await INTERVIEW.findOneAndUpdate(
      _query,
      { $set: payload },
      { new: true }
    );
    
    return res.redirect(`/dashboard/interview/${_id}/view`);

  } catch (error) {
    next(error);
  }
};

exports.deleteInterviewDetailsByHR = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDeleted: false };
    const _delete = { $set: { isDeleted: true } };
    await INTERVIEW.findOneAndUpdate(_query, _delete);
    return res.redirect("/dashboard/interview/");
  } catch (error) {
    next(error);
  }
};

exports.createInterviewByHr = async (req, res, next) => {
  try {
    const userRole = await ROLE.findOne({_id: req.session.user.role});
    let systemUsers = await getUserAndHrRoleForInterview();
    return res.sendRender('admin/addInterviewDetail',null,null,{
      sideTab: 'interview',
      moment: moment,
      technicalRound: systemUsers.technicalRound,
      hrRound: systemUsers.hrRound,
      loginUserRoleName: userRole.name 
    });
  } catch (error) {
    next(error);
  }
};

exports.storeInterviewDetailsByHr = async (req, res, next) => {
  try {

   let createInterviewResponse = await storeInterviewPayload(req);
    
   if(createInterviewResponse.status){
     await INTERVIEW.create(createInterviewResponse.data);
     return res.redirect("/dashboard/interview");
   }else{
     throw new APIError({
      message: createInterviewResponse.message,
      template: "admin/addInterviewDetail",
      oldValues: createInterviewResponse.oldValues,
     });
   }

  } catch (error) {
    next(error);
  }
};

exports.interviewXlsSheet = async (req, res, next) => {
  try {
    if(req.query.daterangeForxls){
      let startEndDateRange = req.query.daterangeForxls.split("-");
      let startDateRange = startEndDateRange[0].trim();
      let endDateRange = startEndDateRange[1].trim();

      startDateRange = moment(moment(startDateRange, 'DD/MM/YYYY')).format('YYYY-MM-DD');
      endDateRange = moment(moment(endDateRange, 'DD/MM/YYYY')).format('YYYY-MM-DD');
      
      const startMonth = moment(new Date(startDateRange)).startOf('day').toDate();
      const endMonth = moment(new Date(endDateRange)).endOf('day').toDate();
      const interview = await INTERVIEW.find({ interviewTime:{ $gte :startMonth ,$lte :endMonth },isDeleted: false });
      
      let interviewXlsData = [];
      for(const candidate of interview){
        let candidateInformation = {};
        //name
        candidateInformation.name = candidate.name;
        //dateOfBirth
        candidateInformation.dateOfBirth = candidate.dateOfBirth;
        //address
        candidateInformation.address = candidate.address;
        //email
        candidateInformation.email = candidate.email;
        //previousCompanyName
        candidateInformation.previousCompanyName = candidate.previousCompanyName;
        //yearOfExperience
        candidateInformation.yearOfExperience = candidate.yearOfExperience;
        //currentSalary
        candidateInformation.currentSalary = candidate.currentSalary;
        //expectedSalary
        candidateInformation.expectedSalary = candidate.expectedSalary;
        //qualification
        candidateInformation.qualification = candidate.qualification;
        //technology
        candidateInformation.technology = candidate.technology;
        //interviewDate
        candidateInformation.interviewDate = candidate.interviewTime;
        //interviewTime
        candidateInformation.interviewTime = moment.tz(new Date(candidate.interviewTime), 'Asia/Kolkata').format("hh:mm A");
        //callDate
        candidateInformation.callDate = candidate.callDate;
        //contactNumber
        candidateInformation.contactNumber = candidate.contactNumber;
        //interviewStatus
        candidateInformation.interviewStatus = (candidate.interviewStatus)? 'Done' : 'Pending';
        //interviewMode
        candidateInformation.interviewMode = candidate.interviewMode;
        //practicalTestStatus
        candidateInformation.practicalTestStatus = (candidate.practicalTestStatus)? 'Done' : 'Pending';
        //communicationSkill
        candidateInformation.communicationSkill = candidate.communicationSkill;
        //confidenceOrBodyLang
        candidateInformation.confidenceOrBodyLang = candidate.confidenceOrBodyLang;
        //logicalSkills
        candidateInformation.logicalSkills = candidate.logicalSkills;
        //hrRoundUser
        candidateInformation.hrRoundUser = '-';
        if(candidate.hrRoundUser){
          let hrRoundUserName = await USER.findOne({_id: candidate.hrRoundUser,isDeleted: false});
          candidateInformation.hrRoundUser = hrRoundUserName.firstName+" "+hrRoundUserName.middleName+" "+hrRoundUserName.lastName;
        }
        //technicalRoundUser
        candidateInformation.technicalRoundUser = '-';
        if(candidate.technicalRoundUser){
          let technicalRoundUserName = await USER.findOne({_id: candidate.technicalRoundUser,isDeleted: false});
          candidateInformation.technicalRoundUser = technicalRoundUserName.firstName+" "+technicalRoundUserName.middleName+" "+technicalRoundUserName.lastName;
        }
        //referenceUser
        candidateInformation.referenceUser = '-';
        if(candidate.referenceUser){
          let referenceUserName = await USER.findOne({_id: candidate.referenceUser,isDeleted: false});
          candidateInformation.referenceUser = referenceUserName.firstName+" "+referenceUserName.middleName+" "+referenceUserName.lastName;
        }
        //remark
        candidateInformation.remark = candidate.remark;
        interviewXlsData.push(candidateInformation);
      }

      // Interview Xls sheet
      let worksheetColumnsInterview = [
        { header: "Full Name", key: "name", width: 10 },
        { header: "Birth Date", key: "dateOfBirth", width: 30 },
        { header: "Address / Location", key: "address", width: 10 },
        { header: "Email", key: "email", width: 20 },
        { header: "Previous Company Name", key: "previousCompanyName", width: 30 },
        { header: "Year of Experience", key: "yearOfExperience", width: 30 },
        { header: "Current Salary", key: "currentSalary", width: 30 },
        { header: "Expected Salary", key: "expectedSalary", width: 30 },
        { header: "Qualification", key: "qualification", width: 30 },
        { header: "Technology",key: "technology",width: 30,},
        { header: "Interview Date", key: "interviewDate", width: 30 },
        { header: "Interview Time", key: "interviewTime", width: 30 },
        { header: "Call Date", key: "callDate", width: 30 },
        { header: "Contact number", key: "contactNumber", width: 30 },
        { header: "Interview Status", key: "interviewStatus", width: 30 },
        { header: "Interview Mode", key: "interviewMode", width: 30 },
        { header: "practical Test Status", key: "practicalTestStatus", width: 30 },
        { header: "Communication skill(Out of 10)", key: "communicationSkill", width: 30 },
        { header: "Confidence/Body language(Out of 10)", key: "confidenceOrBodyLang", width: 30 },
        { header: "Logical   skills(Out of 10)", key: "logicalSkills", width: 50 },
        { header: "HR Round User Name", key: "hrRoundUser", width: 30 },
        { header: "Technical Round User Name", key: "technicalRoundUser", width: 30 },
        { header: "Reference User Name", key: "referenceUser", width: 30 },
        { header: "Remark", key: "remark", width: 30 },
      ];
      
      let xlsSheetObjectInterview = interviewXlsData;
      let bottomInterviewSheet = {};
      let xlsFileNameInterview = "interviewExcelSheet";
      await createExcelSheet(worksheetColumnsInterview,xlsSheetObjectInterview,bottomInterviewSheet,xlsFileNameInterview);
      let interviewXlsStatus = false;
      if(interview.length > 0){
        interviewXlsStatus = true;
      }
      res.send({status: interviewXlsStatus, xlsFileNameInterview: xlsFileNameInterview});
    }
  } catch (error) {
    next(error);
  }
};