const crypto = require("crypto");
const algorithm = "aes-256-ctr";
const secretKey = "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3";
const iv = crypto.randomBytes(16);
let payrollObj = {};

exports.setPayroll = function setPayroll(payrollPayload) {
  payrollObj = payrollPayload;
};
exports.getPayroll = function getPayroll() {
  return payrollObj;
};
exports.initialPayroll = function initialPayroll() {
  payrollObj = {};
};
exports.decryptPayroll = function decryptPayroll(payroll, ivv) {
  for (var prop in Object.keys(payroll)) {
    let key = Object.keys(payroll)[prop];
    let str = Object.values(payroll)[prop];
    if (
      key === "__v" ||
      key === "user" ||
      key === "isDeleted" ||
      key === "_id" ||
      key === "createdAt" ||
      key === "updatedAt" ||
      key === "joiningDate" ||
      key === "bondCompletedDate" ||
      key === "lastUpdated" ||
      key === "sNo" ||
      key === "isMailSend" ||
      key === "payDate" ||
      key === "iv"
    ) {
      continue;
    } else {
      const decipher = crypto.createDecipheriv(
        algorithm,
        secretKey,
        Buffer.from(ivv, "hex")
      );
      const decrpyted = Buffer.concat([
        decipher.update(Buffer.from(str, "hex")),
        decipher.final(),
      ]);
      payroll[key] = decrpyted.toString();
    }
  }
};
exports.encryptPayroll = function encryptPayroll(payroll, op) {
  for (var prop in Object.keys(payroll)) {
    let key = Object.keys(payroll)[prop];
    let str = Object.values(payroll)[prop];
    if (
      key === "__v" ||
      key === "user" ||
      key === "isDeleted" ||
      key === "_id" ||
      key === "createdAt" ||
      key === "updatedAt" ||
      key === "joiningDate" ||
      key === "bondCompletedDate" ||
      key === "lastUpdated" ||
      key === "sNo" ||
      key === "isMailSend" ||
      key === "payDate" ||
      key === "iv"
    ) {
      continue;
    } else {
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      const encrypted = Buffer.concat([
        cipher.update("" + str),
        cipher.final(),
      ]);
      if (key === "iv") {
        payroll[key] = iv.toString("hex");
      } else {
        payroll[key] = encrypted.toString("hex");
      }
    }
  }

  payroll["iv"] = iv.toString("hex");
};