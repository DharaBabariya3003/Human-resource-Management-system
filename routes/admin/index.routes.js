const router = require("express").Router();

router.use("/payroll", require("./payroll"));
router.use("/documents", require("./document"));
router.use("/paySalary", require("./paySlip"));
router.use("/leftEmployees", require("./leftEmployee"));
router.use("/notification", require("./notification"));
router.use("/leaveRequests", require("./leaveRequest"));
router.use("/interview", require("./interview"));
router.use("/attendance", require("./attendance"));
router.use("/holidays", require("./holidays"));
router.use("/assets", require("./assets"));
router.use("/letterhead", require("./letterhead"));
router.use("/api", require("./api"));
router.use("", require("./user"));

module.exports = router;
