const fs = require("fs");
const multer = require("multer");
const express = require("express");
const router = require("express").Router();
const path = require("path");
router.use(express.static(__dirname + "./public/"));

const storage = multer.diskStorage({
  destination: "./public/uploadExcel",
  filename: (req, file, cb) => {
    cb(null, "excel" + path.extname(file.originalname));
  },
});
const uploadFilter = function (req, file, cb) {
  var typeArray = file.mimetype.split("/");
  var fileType = typeArray[1];
  if (fileType == "vnd.ms-excel" || fileType == "xls" || fileType == "xlsx") {
    cb(null, true);
  } else {
    req.fileValidationError = "invalid file";
    return cb(null, false, req.fileValidationError);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: uploadFilter,
});

module.exports = {
  storage,
  upload,
};
