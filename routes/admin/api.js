const router = require('express').Router();
const API=require('../../controllers/api');
const { isAuth } = require('../../middlewares/authentication');
const { upload } = require('../../middlewares/imageUpload');


router.get("/employeeTable", isAuth(["admin",'HR']), API.serverEmployeeTable);
router.get("/leftEmployeeTable", isAuth(["admin",'HR']), API.viewLeftEmployee);
router.get("/attendanceTable", isAuth(["admin",'HR']), API.attendanceTable);
router.get("/monthlyAttendanceTable", isAuth(["admin",'HR']), API.monthlyAttendanceTable);
router.get("/interviewTable", isAuth(["admin",'HR','user','HR Recruiter']), API.interviewTable);
router.get("/doneInterviewTable", isAuth(["admin",'HR','user','HR Recruiter']), API.doneInterviewTable);
router.get("/resignEmployeeTable", isAuth(["admin",'HR']), API.resignEmployeeTable);
router.get("/leaveRequestTable", isAuth(["admin",'HR']), API.leaveRequestTable);
router.get("/leaveRequestHistoryTable", isAuth(["admin",'HR']), API.leaveRequestHistoryTable);
router.get("/overtimeRecords", isAuth(["admin",'HR']), API.overtimeRecords);
router.get("/logTable", isAuth(["admin",'HR']), API.logTableRecords);
router.get("/salaryAttendanceTable", isAuth(["admin",'HR']), API.salaryAttendanceTable);
router.get("/bondCompletedUsers", isAuth(["admin",'HR']), API.bondCompletedUsersList);
router.get("/letterhead", isAuth(["admin",'HR']), API.showLetterhead);
router.get("/letterhead/letterhead-type", isAuth(["admin",'HR']), API.showLetterheadType);
router.get("/employee-xlsSheet", isAuth(["admin",'HR']), API.employeeXlsSheet);
module.exports = router