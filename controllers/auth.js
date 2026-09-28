const APIError = require("../utils/APIError");
const {
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword
} = require("../validations/auth");
const USER = require("../models/user");
const bcryptJs = require("bcryptjs");
let crypto = require("crypto");
const { hostUrl } = require("../config");
const { sendMail } = require("../utils/sendMail");
const BANKNAME = require("../models/bankName");


exports.login = async (req, res, next) => {
  try {
    const payload = req.body;
    const validateError = validateLogin.body.validate(payload).error;
    if (validateError) {
      throw new APIError({
        message: validateError.message,
        template: "login",
        oldValues: payload,
      });
    }
    const user = await USER.findOne({ email: payload.email, isDeleted: false ,isLeft: false });
    if (!user) {
      throw new APIError({
        message: "email id does not exist",
        template: "login",
        oldValues: payload,
      });
    }
    const isMatch = await bcryptJs.compare(payload.password, user.password);
    if (isMatch) {
      req.session.user = user;
      return res.redirect("/admin");
    } else {
      throw new APIError({
        message: "Login details are wrong",
        template: "login",
        oldValues: payload,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

exports.forgot = async (req, res, next) => {
  try {
    const payload = req.body;
    const validateError = validateForgotPassword.body.validate(payload).error;
    if (validateError) {
      throw new APIError({
        message: validateError.message,
        template: "forgot-password",
        oldValues: payload,
      });
    }
    const user = await USER.findOne({ email: payload.email, isDeleted: false },'_id email isDeleted resetPassword isLeft');
    if (!user) {
      throw new APIError({
        message:
          "The email address provided is not registered to your organization",
        template: "forgot-password",
        oldValues: payload,
      });
    } 
   
    const _query = { _id: user._id, isDeleted: false };
    let resetPasswordSuccessMsg = {};

    await crypto.randomBytes(20, async function(err, buf) {
      let token = buf.toString("hex");
      
      user.resetPassword.resetPasswordToken = token;
      user.resetPassword.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      
      const updatedForgotPsw = await USER.findOneAndUpdate(
        _query,
        { $set: user },
        { new: true }
      );
      if(updatedForgotPsw){
        const emailObject = {
          toEmail               : payload.email,
          emailSubject          : "HRMS reset password",
          emailText             : "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
              "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
              hostUrl +
              "/auth/reset-password/" +
              token +
              "\n\n" +
              "If you did not request this, please ignore this email and your password will remain unchanged.\n",      
        }                
        const mailsend = await sendMail(emailObject);
        if(mailsend){
          resetPasswordSuccessMsg.message = "“An email has been sent. Please check your inbox.”";
          resetPasswordSuccessMsg.email = payload.email;
          
        }else{
          resetPasswordSuccessMsg.message = "“Mail is not sent.”";
          resetPasswordSuccessMsg.email = payload.email;
        }
      }
      return res.sendRender(
        "forgot-password",
        null,
        null,
        resetPasswordSuccessMsg
      );     
    });      
  } catch (error) { 
    next(error);
  }
};

exports.reset = async (req, res, next) => {
  try {
    USER.findOne(
      { "resetPassword.resetPasswordToken": req.params.token },
      function (err, user) {
        if (!user) {
          return res.redirect("/auth/forgot-password");
        }
        const resetTokenId = {
          resetToken: req.params.token,
          resetUserId: user._id,
        };
        return res.sendRender("reset-password", null, null, resetTokenId);
      }
    );
  } catch (err) {}
};

exports.resetPassword = async (req, res, next) => {
  try {
    const payload = {
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    };
    const secretPayload = {
      userId: req.body.id,
      userToken: req.body.token,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    };
    const validateError = validateResetPassword.body.validate(payload).error;
    if (validateError) {
      throw new APIError({
        message: validateError.message,
        template: "reset-password",
        oldValues: secretPayload,
      });
    }
    if (req.body.password != req.body.confirmPassword) {
      throw new APIError({
        message: "Password and Confirm password are not same",
        template: "reset-password",
        oldValues: secretPayload,
      });
    }
    USER.findOne({ "resetPassword.resetPasswordToken": req.body.token })
      .then(function (doc) {
        if (doc._id != req.body.id) {
          res.redirect("/auth/forgot-password");
        }
        const _id = req.body.id;
        const newPayload = {
          password: req.body.password,
          "resetPassword.resetPasswordToken": undefined,
          "resetPassword.resetPasswordExpires": undefined,
        };
        const _query = { _id, isDeleted: false };
        USER.findOneAndUpdate(_query, { $set: newPayload }, { new: true })
          .then(function (data) {
            res.redirect("/auth/logout");
          })
          .catch(function (err) {
            res.redirect("/auth/forgot-password");
          });
      })
      .catch((err) => {
        res.redirect("/auth/forgot-password");
      });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userID = req.params.id;
    return res.sendRender("change-password", null, null, userID);
  } catch (err) {}
};
exports.change = async (req, res, next) => {
  try {
    const payload = req.body;
    const validateChangePayload = {newPassword : payload.newPassword, newConfirmPassword: payload.newConfirmPassword};
    const validateError = validateChangePassword.body.validate(validateChangePayload).error;
    if(validateError){
      throw new APIError({
        message: validateError.message,
        template: "change-password",
        oldValues: payload,
      });
    }
    if(payload.id === '123'){
      res.redirect("/auth/logout");
    }else{
      const _query = { _id: payload.id, isDeleted: false };
      const newPayload = { password: req.body.newPassword };
      const updatedPassword = await USER.findOneAndUpdate(
        _query,
        { $set: newPayload },
        { new: true }
      );
      res.redirect("/auth/logout");
    }
    
  } catch (error) {
    next(error);
  }
};