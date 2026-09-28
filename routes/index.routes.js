const { isAuth } = require("../middlewares/authentication");
const router = require("express").Router();

router.get("/", (req, res) => {return res.redirect("/admin");});
router.use("/auth", require("./auth"));
router.use("/admin", require("./admin/index.routes"));
router.use("/dashboard", require("./employees/index.routes"));

router.get("*", (req, res) => {
  res.sendRender("page404");
});
  
module.exports = router;
  