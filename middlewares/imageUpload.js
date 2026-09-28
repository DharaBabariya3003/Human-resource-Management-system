const express = require("express");
const router = require("express").Router();
const multer = require("multer");
router.use(express.static(__dirname + "./public/"));

var upload = multer();

module.exports = {
  upload,
};
