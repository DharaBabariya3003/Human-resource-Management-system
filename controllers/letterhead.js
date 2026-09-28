const LETTERHEAD_TYPE = require("../models/letterheadType");
const LETTERHEAD = require("../models/letterhead");
const { uploadFile, deleteFile, getSignedURL } = require("../services/s3");
const sharp = require('sharp');
const {
  validateAddLetterHead,
} = require("../validations/letterhead");
const APIError = require("../utils/APIError");
const { json } = require("body-parser");



exports.showLetterHeadType = async(req, res, next) =>{
  try{
    return res.sendRender("admin/letterHeadType", null, null, {
      sideTab: "letterHeadType",
    });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.createLetterHeadType = async(req, res, next) =>{
  try{
    let status = false;
    let letterheadType = req.body.letterheadType;
    // check LetterHead type already exist or not.
    let availableLetterheadType = await LETTERHEAD_TYPE.findOne({ letterheadType: new RegExp(letterheadType,'i'), isDeleted: false });
    if(!availableLetterheadType){
      letterheadType = letterheadType.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
      await LETTERHEAD_TYPE.create({ letterheadType: letterheadType })
      status = true;
    }
    res.send({ status: status });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.editLetterHeadTypes = async(req, res, next) =>{
  try{
    let status = false;
    let letterheadType = req.body.letterheadType;
    // check LetterHead type already exist or not.
    let availableLetterheadType = await LETTERHEAD_TYPE.findOne({ 
      letterheadType: new RegExp(letterheadType,'i'), 
      isDeleted: false,
      _id: { $ne: req.body._id }
    });
    if(!availableLetterheadType){
      letterheadType = letterheadType.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
      //edit letterhead
      await LETTERHEAD_TYPE.findOneAndUpdate(
        { _id: req.body._id, isDeleted: false },
        { $set: { letterheadType: letterheadType } },
        { new: true }
      );
      status = true;
    }
    res.send({ status: status });    
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.showLetterHead = async(req, res, next) =>{
  try{
    return res.sendRender("admin/letterHead", null, null, {
      sideTab: "letterHead",
    });
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.createLetterHead = async(req, res, next) =>{
  try{
    
    let payload = JSON.parse(req.body.letterHeadObject);

    const validateError = validateAddLetterHead.body.validate(payload).error;
    if (validateError) {
      throw new APIError({
        message: validateError.message,
      });
    }

    // Check letterhead number is unique or not.
    let availableLetterheadNumber = await LETTERHEAD.findOne({ letterHeadNumber: new RegExp(payload.letterHeadNumber,'i'), isDeleted: false });
    if(availableLetterheadNumber){
      throw new APIError({
        message: 'Letterhead number is already available',
      });
    }


    //========> Check Document is uploaded or not.<=======================//
    if(!req.files.letterHeadDocument){
      throw new APIError({
        message: 'Please upload document.',
      });
    }

    //==> Insert <===//
    payload.createdBy = req.session.user._id;
    let letterHeadCreatedObj = await LETTERHEAD.create(payload);




    //===>> Upload document <<====//
    let fileName;
    let responseData;
    let properties = req.files.letterHeadDocument[0];
    let buffer = properties.buffer;
    let originalFileName = properties.originalname;
    let originalFileNameSplit = originalFileName.split(".");
    let fileType = originalFileNameSplit[1];
    fileName =originalFileNameSplit[0] + "_" + new Date().valueOf() + "." + fileType;
    if (fileType === "png" || fileType === "jpg" || fileType === "jpeg" || fileType === 'pdf') {
      let thumbnail;
      if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
      if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();
      let originalFilePath = `letterhead/${letterHeadCreatedObj._id}/documents/original/${fileName}`;
      
      if(thumbnail){
        responseData = await uploadFile(originalFilePath, thumbnail, fileType);
      }else{
        responseData = await uploadFile(originalFilePath, buffer, fileType);
      }
      if(responseData){
        await LETTERHEAD.findOneAndUpdate(
          { _id: letterHeadCreatedObj._id, isDeleted: false },
          { $set: { letterHeadDocument: fileName } },
          { new: true }
        );
      }
    }

    res.send(true);
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.deleteLetterHead = async(req, res, next) =>{
  try{
    const letterHeadId = req.query.letterHeadId;
    await LETTERHEAD.findOneAndUpdate(
      { _id: letterHeadId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );
    res.send({ status: true});
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.showSingleLetterHead = async(req, res, next) =>{
  try{
    let letterHeadRecord = await LETTERHEAD.findOne({ isDeleted: false, _id: req.params.letterheadId}).populate({
      path: "createdBy",
      select: {'firstName': 1, 'middleName': 1, 'lastName': 1, 'attendanceCode': 1}
    }).populate({
      path: "letterheadType",
      select: {'letterheadType': 1}
    })

    //Get document Buffer
    let originalFilePath = `letterhead/${letterHeadRecord._id}/documents/original/${letterHeadRecord.letterHeadDocument}`;
    let documentURL = await getSignedURL(originalFilePath);
    letterHeadRecord.letterHeadDocument = documentURL.signedUrl;

    res.send(letterHeadRecord);
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.updateLetterHead = async(req, res, next) =>{
  try{
    
    let payload = JSON.parse(req.body.letterHeadObject);
    const _id = payload._id;
    delete payload['_id'];
    

    const validateError = validateAddLetterHead.body.validate(payload).error;
    if (validateError) {
      throw new APIError({
        message: validateError.message,
      });
    }

    

    // Check letterhead number is unique or not.

    let availableLetterheadNumber = await LETTERHEAD.findOne({ 
      letterHeadNumber: new RegExp(payload.letterHeadNumber,'i'),
      isDeleted: false,
      _id: { $ne: _id }
    });
    
    if(availableLetterheadNumber){
      throw new APIError({
        message: 'Letterhead number is already available',
      });
    }
    
    //==>Update letterhead<===//
    await LETTERHEAD.findOneAndUpdate(
      { _id: _id, isDeleted: false },
      { $set: payload },
      { new: true }
    );

    //==> Update Image <==/
    if(req.files.letterHeadDocument){
      let fileName;
      let responseData;
      let properties = req.files.letterHeadDocument[0];
      let buffer = properties.buffer;
      let originalFileName = properties.originalname;
      let originalFileNameSplit = originalFileName.split(".");
      let fileType = originalFileNameSplit[1];
      fileName =originalFileNameSplit[0] + "_" + new Date().valueOf() + "." + fileType;
      if (fileType === "png" || fileType === "jpg" || fileType === "jpeg" || fileType === 'pdf') {
        let thumbnail;
        if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
        if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();
        let originalFilePath = `letterhead/${_id}/documents/original/${fileName}`;
        
        if(thumbnail){
          responseData = await uploadFile(originalFilePath, thumbnail, fileType);
        }else{
          responseData = await uploadFile(originalFilePath, buffer, fileType);
        }
        if(responseData){
          await LETTERHEAD.findOneAndUpdate(
            { _id: _id, isDeleted: false },
            { $set: { letterHeadDocument: fileName } },
            { new: true }
          );
        }
      }      
    }

    res.send({ status: true});
  }catch(error){
    console.log(error);
    next(error);
  }
}

exports.showAllLetterHeadType = async(req, res, next) =>{
  try{
    const letterheadTypes = await LETTERHEAD_TYPE.find({ isDeleted: false },'_id letterheadType');
    res.send(letterheadTypes);
  }catch(error){
    console.log(error);
    next(error);
  }
}