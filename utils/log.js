const APIError = require("../utils/APIError");
const LOG = require("../models/log");
const httpContext = require('express-http-context');


exports.setHttpContextValue =  (seesionId) => {
  try {
    if (!httpContext.ns.active) {
      let context = httpContext.ns.createContext();
      httpContext.ns.context = context;
      httpContext.ns.active = context;
    }
    httpContext.set('userSessionId', seesionId);
  }
  catch (error) {throw new APIError({ message: "There is some issue while set http context." }); }
};

exports.getHttpContextValue =  () => {
  try {
    return httpContext.get('userSessionId');
  }
  catch (error) {throw new APIError({ message: "There is some issue while get http context." }); }
};

exports.storeLog = async (user,oldRecord,newRecord,tableName,action) => {
  try {
    let payload = {
      user: user,
      oldRecord: oldRecord,
      newRecord: newRecord,
      tableName: tableName,
      action: action,
    };
    
    //Store log object
    return await LOG.create(payload);
  }
  catch (error) {throw new APIError({ message: "There is some issue in storing log." }); }
};

exports.updateLog = async (logId,newupdatedRecord) => {
  try {
    //Update log object
    return await LOG.findOneAndUpdate(
      { _id: logId },
      { $set: { newRecord: newupdatedRecord } },
      { new: true }
    );
  }
  catch (error) {throw new APIError({ message: "There is some issue in updating log." }); }
};