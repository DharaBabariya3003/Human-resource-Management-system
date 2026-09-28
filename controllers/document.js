const DOCUMENT = require("../models/document");
const USER = require("../models/user");
const fs = require("fs");
const { uploadFile, getSignedURL } = require('../services/s3');
const sharp = require("sharp");

exports.store = async (req, res, next) => {
  try {
    let payload = req.body;   
    let docFiles=req.files;   
    let otherDocumentArray = [],i=0;
    Object.keys(docFiles).forEach(async(properties)=>{    

      if(properties == "otherDocument"){        
        docFiles[properties].forEach(async otherDocumentElement => {        
          let buffer=otherDocumentElement.buffer;          
          let originalFileName=otherDocumentElement.originalname;          
          let originalFileNameSplit=originalFileName.split(".");
          let fileType=originalFileNameSplit[1];
          let fileName=originalFileNameSplit[0]+"_"+new Date().valueOf()+"."+fileType;                                   
          otherDocumentArray[i] = fileName;
          i = (i+1); 
          if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {                
            let thumbnail;        
            if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
            if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();        
            let originalFilePath = `users/${payload.user}/documents/original/${fileName}`;
            await uploadFile(originalFilePath, thumbnail,fileType);                
          }
          else {                
            let originalFilePath = `users/${payload.user}/documents/original/${fileName}`;
            await uploadFile(originalFilePath, buffer,fileType);        
         }    
        });        
      }else{        
          let buffer=docFiles[properties][0].buffer;          
          let originalFileName=docFiles[properties][0].originalname;          
          let originalFileNameSplit=originalFileName.split(".");
          let fileType=originalFileNameSplit[1];
          let fileName=originalFileNameSplit[0]+"_"+new Date().valueOf()+"."+fileType;                  
          payload[properties] = fileName;        
          if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {                
            let thumbnail;        
            if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
            if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();        
            let originalFilePath = `users/${payload.user}/documents/original/${fileName}`;
            await uploadFile(originalFilePath, thumbnail,fileType);                
          }
          else {               
            let originalFilePath = `users/${payload.user}/documents/original/${fileName}`;
            await uploadFile(originalFilePath, buffer, fileType);        
          }      
      }     
    })    
    payload.otherDocument = otherDocumentArray;    
    const _id = req.body.user;
    const document = await DOCUMENT.create(payload);
    const _query = { _id, isDeleted: false };
    const documentid = document._id;
    const user = await USER.findOneAndUpdate(
      _query,
      { $set: { documentID: documentid } },
      { new: true }
    );
    return res.redirect("/admin/view/" + "document/" + _id);      
  } catch (error) {
    next(error);
  }
};

exports.showDocument = async (req, res, next) => {
  const _id = req.params.id;
  const employee = await USER.findOne({ _id, isDeleted: false });
  return res.sendRender("admin/addDocument", null, null, {
    employeeData: employee,
    sideTab: "employee",
  });
};

exports.destroy = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDeleted: false };
    const _delete = { $set: { isDeleted: true } };
    const document = await DOCUMENT.findOneAndUpdate(_query, _delete);
    const uid = document.user;
    return res.redirect("/admin/view/" + "document/" + uid);
  } catch (error) {
    next(error);
  }
};

exports.showUpdate = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const document = await DOCUMENT.findOne({ _id, isDeleted: false });
    return res.sendRender("admin/updateDocument", null, null, {
      documentUpdateRecords: document,
      sideTab: "employee",
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const payload = req.body;
    let docFiles=req.files;   
    let otherDocumentArray = [],i=0;
    const doc = await DOCUMENT.findOne({ _id: _id });
    Object.keys(docFiles).forEach(async(properties)=>{    

      if(properties == "otherDocument"){        
        docFiles[properties].forEach(async otherDocumentElement => {        
          let buffer=otherDocumentElement.buffer;          
          let originalFileName=otherDocumentElement.originalname;          
          let originalFileNameSplit=originalFileName.split(".");
          let fileType=originalFileNameSplit[1];
          let fileName=originalFileNameSplit[0]+"_"+new Date().valueOf()+"."+fileType;                                   
          otherDocumentArray[i] = fileName;
          i = (i+1); 
          if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {                
            let thumbnail;        
            if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
            if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();        
            let originalFilePath = `users/${doc.user}/documents/original/${fileName}`;
            await uploadFile(originalFilePath, thumbnail,fileType);                
          }
          else {                
            let originalFilePath = `users/${doc.user}/documents/original/${fileName}`;
            await uploadFile(originalFilePath, buffer,fileType);        
         }    
        });        
      }else{        
          let buffer=docFiles[properties][0].buffer;          
          let originalFileName=docFiles[properties][0].originalname;          
          let originalFileNameSplit=originalFileName.split(".");
          let fileType=originalFileNameSplit[1];
          let fileName=originalFileNameSplit[0]+"_"+new Date().valueOf()+"."+fileType;                  
          payload[properties] = fileName;        
          if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {    
            let thumbnail;        
            if(fileType === "png") thumbnail = await sharp(buffer).withMetadata().png({ quality: 30 }).toBuffer();
            if(fileType === "jpg" || fileType === "jpeg") thumbnail = await sharp(buffer).withMetadata().jpeg({ quality: 30 }).toBuffer();        
            let originalFilePath = `users/${doc.user}/documents/original/${fileName}`;
            await uploadFile(originalFilePath, thumbnail, fileType);                          
          }
          else {                
            let originalFilePath = `users/${doc.user}/documents/original/${fileName}`;
            await uploadFile(originalFilePath, buffer, fileType);        
          }      
      }     
    }) 

    if (req.files.otherDocument) {
      if (doc.otherDocument.length == 0) {
        payload.otherDocument = otherDocumentArray;
        payload.otherDocumentName = req.body.otherDocumentName;
        payload.otherRemark = req.body.otherRemark;
        
      } else {
        payload.otherDocument = doc.otherDocument.concat(otherDocumentArray);
        payload.otherDocumentName= doc.otherDocumentName.concat(req.body.otherDocumentName);
        payload.otherRemark= doc.otherRemark.concat(req.body.otherRemark);
      }
    }
    
    const _query = { _id, isDeleted: false };
    const document = await DOCUMENT.findOneAndUpdate(
      _query,
      { $set: payload },
      { new: true }
    );
    const uid = document.user;
    return res.redirect("/admin/view/" + "document/" + uid);
  } catch (error) {
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const _query = { _id, isDeleted: false };
    let payload = {};

    if (req.query.doc === "offerLetterDocument") {
      payload.offerLetterDocument = null;
    }
    if (req.query.doc === "appoinmentLetterDocument") {
      payload.appoinmentLetterDocument = null;
    }
    if (req.query.doc === "marksheet10Document") {
      payload.marksheet10Document = null;
    }
    if (req.query.doc === "marksheet12Document") {
      payload.marksheet12Document = null;
    }
    if (req.query.doc === "bachelorsCertificateDocument") {
      payload.bachelorsCertificateDocument = null;
    }
    if (req.query.doc === "mastersCertificateDocument") {
      payload.mastersCertificateDocument = null;
    }
    if (req.query.doc === "IDproofDocument") {
      payload.IDproofDocument = null;
    }
    if (req.query.doc === "photo") {
      payload.photo = null;
    }
    if (req.query.doc >= 0) {
      const doc = await DOCUMENT.findOne({ _id: _id });
      doc.otherDocument.splice(req.query.doc, 1);
      doc.otherDocumentName.splice(req.query.doc, 1);
      doc.otherRemark.splice(req.query.doc, 1);
      payload.otherDocument = doc.otherDocument;
      payload.otherDocumentName = doc.otherDocumentName;
      payload.otherRemark = doc.otherRemark;
    }
    const document = await DOCUMENT.findOneAndUpdate(
      _query,
      { $set: payload },
      { new: true }
    );
    const uid = document.user;
    return res.redirect("/admin/view/" + "document/" + uid);
  } catch (error) {
    next(error);
  }
};
