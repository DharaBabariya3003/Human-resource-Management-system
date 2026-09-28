const { setHttpContextValue } = require("../utils/log");
const USER = require("../models/user");
const ROLE = require("../models/role");

exports.isAuth = (routeRoles) => (req, res, next) => {
  if(req?.session?.user?._id) {
    USER.findOne({_id: req.session.user._id, isDeleted: false }).then(user=>{
      ROLE.findOne({ _id: user.role }).then(role=>{
        if(role && role.name && routeRoles.includes(role.name.trim())){
          setHttpContextValue(req.session.user._id)
          req.session.user = user;
          next();
        }else{
          res.redirect("/auth/login");
        }
      }).catch(error=>{
        res.redirect("/auth/login");
      });
    }).catch(error=>{
      res.redirect("/auth/login");
    });
  } else {
    res.redirect("/auth/login");
  }
};
