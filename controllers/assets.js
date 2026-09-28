const ASSETS = require("../models/assets");
const ASSET_TYPE = require("../models/assetType");
const ASSETNAME = require("../models/assetName");
const USER = require("../models/user");
const ROLE = require("../models/role");
const { createExcelSheet } = require("../utils/generateXlsSheet");
const moment = require("moment");

exports.all = async(req, res, next) =>{
  try{
    const role = await ROLE.findOne({ _id: req.session.user.role });
    
    return res.sendRender("admin/assets", null, null, {
      sideTab: "assets",
      userRole: role.name
    });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.allAssetTypes = async(req, res, next) =>{
  try{
    const assetTypes = await ASSET_TYPE.find({},'_id assetType');
    res.send({ assetTypes: assetTypes });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.allAssetNames = async(req, res, next) =>{
  try{
    const assetTypeId = req.query.assetTypeId;
    const assetNames = await ASSETNAME.find({ assetType: assetTypeId },'_id assetName');
    res.send({ assetNames: assetNames });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.allAssetUsers = async(req, res, next) =>{
  try{
    const role = await ROLE.findOne({ name: new RegExp('admin', "i") }, "_id");
    const users = await USER.find({ role: { $ne: role } },'_id firstName middleName lastName attendanceCode');
    res.send({ users: users });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.storeAsset = async(req, res, next) =>{
  try{
    const asset = await ASSETS.create(req.body);
    res.send({ asset: asset });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.searchAsset = async(req, res, next) =>{
  try{
    const assetType = req.query.assetType;
    const assetName = req.query.assetName;
    let _query = { isDeleted: false, assetType: assetType };
    if(assetName){
      _query.assetName = assetName;
    }
    let assestUsers = await ASSETS.find(_query).populate({
      path: "user",
      select: {'firstName': 1, 'middleName': 1, 'lastName': 1, 'attendanceCode': 1}
    }).populate('assetName');
    res.send(assestUsers);
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.searchEmpAssetRecord = async(req, res, next) =>{
  try{
    const user = req.query.user;
    let usersAssetRecord = await ASSETS.find({ isDeleted: false, user: user }).populate({
      path: "user",
      select: {'firstName': 1, 'middleName': 1, 'lastName': 1, 'attendanceCode': 1}
    }).populate('assetType assetName');
    res.send(usersAssetRecord);
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.deleteAsset = async(req, res, next) =>{
  try{
    const assetId = req.query.assetId;
    await ASSETS.findOneAndUpdate(
      { _id: assetId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );
    res.send({ status: true});
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.userAssetInfo = async(req, res, next) =>{
  try{
    let usersAssetRecord = await ASSETS.find({ isDeleted: false, user: req.params.user, assetType: req.params.assetType });
    res.send({ totalAssets: usersAssetRecord.length });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.employeeAllAssets = async(req, res, next) =>{
  try{
    const role = await ROLE.findOne({ _id: req.session.user.role });
    
    if(role.name == 'user'){
      return res.sendRender("employee/assets", null, null, {
        sideTab: "assets",
        user: req.session.user._id
      });
    }else{
      return res.redirect("/admin/assets");
    }
    
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.storeAssetTypes = async(req, res, next) =>{
  try{
    let assetTypeName = req.body.assetTypeName;
    assetTypeName = assetTypeName.trim();
    // check asset type already exist or not.
    let assetTypes = await ASSET_TYPE.find({ assetType: new RegExp(assetTypeName,'i')});
    if(assetTypes.length > 0){
      res.send({ status: false });
    }else{
      assetTypeName = assetTypeName.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
      await ASSET_TYPE.create({ assetType: assetTypeName });
      res.send({ status: true });
    }
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.storeAssetName = async(req, res, next) =>{
  try{
    let assetType = req.body.assetType;
    let assetName = req.body.assetName;
    assetName = assetName.trim();
    // check asset name already exist or not.
    let assetNames = await ASSETNAME.find({ assetName: new RegExp(assetName,'i'), assetType: assetType });
    if(assetNames.length > 0){
      res.send({ status: false });
    }else{
      assetName = assetName.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
      await ASSETNAME.create({ assetType: assetType, assetName: assetName });
      res.send({ status: true });
    }
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.editAssetTypes = async(req, res, next) =>{
  try{
    let assetTypeName = req.body.replacedAssetTypeName;
    assetTypeName = assetTypeName.trim();
    // check asset type already exist or not.
    let assetTypes = await ASSET_TYPE.find({ assetType: new RegExp(assetTypeName,'i'), _id: { $ne: req.body.assetTypeId }});
    if(assetTypes.length > 0){
      res.send({ status: false });
    }else{
      assetTypeName = assetTypeName.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
      await ASSET_TYPE.findOneAndUpdate(
        { _id: req.body.assetTypeId },
        { $set: { assetType: assetTypeName } },
        { new: true }
      );
      res.send({ status: true });
    }
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.editAssetName = async(req, res, next) =>{
  try{
    let assetName = req.body.replacedAssetName;
    assetName = assetName.trim();
    // check asset name already exist or not.
    let assetNames = await ASSETNAME.find({ assetName: new RegExp(assetName,'i'), assetType: req.body.assetTypeId, _id: { $ne: req.body.assetNameId }});
    if(assetNames.length > 0){
      res.send({ status: false });
    }else{
      assetName = (assetName.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' '));
      await ASSETNAME.findOneAndUpdate(
        { _id: req.body.assetNameId },
        { $set: { assetName: assetName } },
        { new: true }
      );
      res.send({ status: true });
    }
  }catch(error){
    console.log(error);
    next(error);
  }
}

// Create asset object for xls.
const assetDataForXls = (attendanceCode, userName, assetType, assetName, issueDate, remark) => {
  let assetXlsObject = {};
  let givenDate;
  assetXlsObject.attendanceCode = attendanceCode;
  assetXlsObject.userName = userName;
  assetXlsObject.assetType = assetType;
  assetXlsObject.assetName = assetName;
  if(issueDate){
    givenDate = moment(new Date(issueDate)).format("DD/MM/YYYY").toString()
  }else{
    givenDate = "";
  };
  assetXlsObject.givenDate = givenDate;
  assetXlsObject.remark = remark;  
  return assetXlsObject;
}

exports.xlsSheet = async(req, res, next) =>{
  try{
    // Generate xls sheet of asset data.
    let assetUsers = await ASSETS.find({ isDeleted: false },'user').distinct( "user" );
    let assetXlsRecord = [];
    for(const userId of assetUsers){
      // let assetXlsObject = {};
      let userAssetData = await ASSETS.find({ user: userId, isDeleted: false }).populate('user assetType assetName');
      
      // Push first Object with user Name
      let assetXlsData = assetDataForXls(
        userAssetData[0].user.attendanceCode,
        userAssetData[0].user.firstName+" "+userAssetData[0].user.middleName+" "+userAssetData[0].user.lastName,
        userAssetData[0].assetType.assetType,
        userAssetData[0].assetName.assetName,
        userAssetData[0].givenDate,
        userAssetData[0].remark
      );
      assetXlsRecord.push(assetXlsData);

      // Remove first object from array of an object.
      userAssetData = userAssetData.slice(1);

      // Push remaining objects.
      if(userAssetData.length > 0){
        for(assetData of userAssetData){
          assetXlsData = assetDataForXls(
            "",
            "",
            assetData.assetType.assetType,
            assetData.assetName.assetName,
            assetData.givenDate,
            assetData.remark
          );
          assetXlsRecord.push(assetXlsData);
        }
      }

      assetXlsData = assetDataForXls("","","","","","");
      assetXlsRecord.push(assetXlsData);
      
    }

    // Asset Xls sheet
    let worksheetColumnsAsset = [
      { header: "Attendance Code", key: "attendanceCode", width: 10 },
      { header: "Name", key: "userName", width: 10 },
      { header: "Asset Category", key: "assetType", width: 10 },
      { header: "Brand/Model", key: "assetName", width: 10 },
      { header: "Issue Date", key: "givenDate", width: 10 },
      { header: "Remark", key: "remark", width: 10 },
    ];
    
    let xlsSheetObjectAsset = assetXlsRecord;
    let bottomAssetSheet = {};
    let xlsFileNameAsset = "assetsExcelSheet";
    await createExcelSheet(worksheetColumnsAsset,xlsSheetObjectAsset,bottomAssetSheet,xlsFileNameAsset);

    let assetXlsStatus = false;
    if(assetXlsRecord.length > 0){
      assetXlsStatus = true;
    }
    res.send({ status: assetXlsStatus, xlsFileNameAsset: xlsFileNameAsset });
  }catch(error){
    console.log(error);
    next(error);
  }
}