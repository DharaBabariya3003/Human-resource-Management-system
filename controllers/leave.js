const LEAVE = require("../models/leave");
const moment = require("moment");
const DATATABLEWEB = require('../utils/dataTable');
const { storeLeaveNotification } = require('../controllers/notification');
const { NOTIFICATION_TYPES, ORGANIZATION_TYPES} = require('../enum');
const USER = require("../models/user");

exports.register = async (req, res, next) => {
  try {
    const user = req.session.user;
    let payload=req.body;
    payload.leaveReason = payload.leaveReason.trim();
    if(payload.multiOrhalfDay==='Multiple'){
      if(!payload.multiFromDate || !payload.multiToDate || !payload.leaveReason){
        return res.sendRender("employee/leaveRequest", null, null,{status:'No',sideTab: "sendLeaveRequest"});
      }else{
        payload.user= user._id,
        payload.halfDayDate=null;
        payload.halfDayFromTime=null;
        payload.halfDayToTime=null;
        let multiFromDateval=payload.multiFromDate.split("/");
        let multiToDateval=payload.multiToDate.split("/");
        payload.multiFromDate=multiFromDateval[2]+"-"+multiFromDateval[1]+"-"+multiFromDateval[0];
        payload.multiToDate=multiToDateval[2]+"-"+multiToDateval[1]+"-"+multiToDateval[0];
        await LEAVE.create(payload);
        await storeLeaveNotification(`${user.firstName+' '+user.middleName+' '+user.lastName}`,NOTIFICATION_TYPES.LEAVE_REQUEST);
        return res.sendRender("employee/leaveRequest", null, null,{status:'Yes',sideTab: "sendLeaveRequest",});
      }
    }
    if(payload.multiOrhalfDay==='Half'){
      if(!payload.halfDayDate || !payload.halfDayFromTime || !payload.halfDayToTime || !payload.leaveReason){
        return res.sendRender("employee/leaveRequest", null, null,{status:'No',sideTab: "sendLeaveRequest",});
      }else{
        payload.user= user._id,
        payload.multiFromDate=null;
        payload.multiToDate=null;
        let haalfDayDate=payload.halfDayDate.split("/");
        let newhaldDayDate=haalfDayDate[2]+"-"+haalfDayDate[1]+"-"+haalfDayDate[0];
        payload.halfDayDate=newhaldDayDate;
        await LEAVE.create(payload);
        await storeLeaveNotification(`${user.firstName+' '+user.middleName+' '+user.lastName}`,NOTIFICATION_TYPES.LEAVE_REQUEST);
        return res.sendRender("employee/leaveRequest", null, null,{
          status:'Yes',
          sideTab: "sendLeaveRequest",
        });
      }
    }
    
  } catch (error) {
    next(error);
  }
};

exports.leave = async (req, res, next) => {
  try {
    let selectedYear,selectedChoice,selectedLeaveId,selectedStatus,selectedLeaveRecords = [];
    if (req.query.year || req.query.option) {
      selectedYear= req.query.year;
      selectedChoice= req.query.option;
    }
    if (req.query.leaveId || req.query.status) {
      selectedLeaveId= req.query.leaveId;
      selectedStatus= req.query.status;
      let _id=selectedLeaveId;
      const _query = { _id, isDeleted: false };
      if(selectedStatus=='approve'){
        const approveLeave = await LEAVE.findOneAndUpdate(
        _query,
        { $set: {approve:true} },
        { new: true }
        );
      }
      else if(selectedStatus=='decline'){
        const declineLeave = await LEAVE.findOneAndUpdate(
          _query,
          { $set: {decline:true} },
          { new: true }
          );
      }
      else{
        const deleteLeave = await LEAVE.findOneAndUpdate(
          _query,
          { $set: {isDeleted:true} },
          { new: true }
          );
      }
    }
  
    const sideTab = "leaveRequest";
    return res.sendRender("admin/leaveRequest", null, null, {
      leaveRecord: selectedLeaveRecords,
      moment: moment,
      selectedYear:selectedYear,
      selectedChoice:selectedChoice,      
      sideTab,
    });
  } catch (error) {
    next(error);
  }
};

exports.leaveHistory = async (req, res, next) => {
  try {
    let selectedYear,selectedChoice;
    if (req.query.year || req.query.option) {
      selectedYear= req.query.year;
      selectedChoice= req.query.option;
    }
    const sideTab = "leaveRequestHistory";
    return res.sendRender("admin/leaveRequestHistory", null, null, {
      moment: moment,
      selectedYear:selectedYear,
      selectedChoice:selectedChoice,
      sideTab,
    });
  } catch (error) {
    next(error);
  }
};

exports.employeeLeaveHistory = async (req, res, next) => {
  try {
    let selectedYear,selectedChoice;
    if (req.query.year || req.query.option) {
      selectedYear= req.query.year;
      selectedChoice= req.query.option;
    }
    const sideTab = "leaveRequestHistory";
    return res.sendRender("employee/leaveRequestHistory", null, null, {
      moment: moment,
      selectedYear:selectedYear,
      selectedChoice:selectedChoice,
      sideTab,
    });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const id = req.session.user._id;
    const leave = await LEAVE.find({ user: id });
    return res.sendRender("employee/approveRequest", null, null, {
      leaveRecord: leave,
      moment:moment,
      sideTab: "leaveRequestStatus",
    });
  } catch (error) {
    next(error);
  }
};

exports.sendLeaveRequest = async (req, res, next) => {
  try {
    return res.sendRender("employee/leaveRequest", null, null, {
      sideTab: "sendLeaveRequest",
    });
  } catch (error) {
    next(error);
  }
};

exports.empLeaveRequestHistoryTable = async (req, res, next) => {
  try {
  
   let _id = req.session.user._id;  
   const modelObj = LEAVE;    
   const searchFields = [];
   let conditionQuery;
   const projectionQuery = '-updatedAt';
   const sortingQuery = {'createdAt': -1};
   const populateQuery = null;
  
   if(req.query && (req.query.year || req.query.option)) {              
     let selectedYear = req.query.year;
     let selectedChoice = req.query.option;

     
     let year = new Date(moment(selectedYear).format('YYYY'));
     const startYear = moment(year).startOf('year').toDate();
     const endYear = moment(year).endOf('year').toDate(); 

     if(selectedChoice == 'All'){  
       conditionQuery = { isDeleted: false,  
         $or:[ { multiOrhalfDay:"Multiple", multiFromDate: {$gte :startYear ,$lte :endYear}, multiToDate:{$gte :startYear ,$lte :endYear} },
           { multiOrhalfDay:"Half", halfDayDate: {$gte :startYear ,$lte :endYear} }
         ]} ;
     }else if(selectedChoice=='Halfday'){
       conditionQuery = {isDeleted: false, halfDayDate:{$gte :startYear ,$lte :endYear} };
     }else{
       let search = selectedYear + "-" + selectedChoice;

       let monthAndYear = moment(search).format("YYYY-MM");
       const startMonth = moment(monthAndYear).startOf("month").toDate();
       const endMonth = moment(monthAndYear).endOf("month").toDate();       

       conditionQuery = {
         isDeleted: false,
         $or: [
           {
             $and: [
               {
                 multiOrhalfDay: "Multiple",
                 $or: [
                   {
                     multiFromDate: { $gte: startMonth, $lte: endMonth }
                   },
                   {
                     multiToDate: { $gte: startMonth, $lte: endMonth },
                   },
                 ],
               }
             ]                          
           },
           {
             multiOrhalfDay: "Half",
             halfDayDate: { $gte: startMonth, $lte: endMonth },
           },
         ],
       };
     }
   }
   
   conditionQuery.user = _id;
   DATATABLEWEB.fetchDatatableRecords(req.query, modelObj, searchFields, conditionQuery, projectionQuery, sortingQuery, populateQuery, function(err, data) {
     if(err) throw new APIError({message: "Something went wrong while fetch user list."});
     const jsonString = JSON.stringify(data);
     res.send(jsonString);   
   });   
  } catch (error) {
    next(error);
  }
};
