const LEAVE=require('../../controllers/leave');
const ATTENDANCE=require('../../controllers/attendance');
const HOLIDAYS=require('../../controllers/holidays');
const INTERVIEW=require('../../controllers/interview');
const AUTH=require('../../controllers/auth');
const NOTIFICATION=require('../../controllers/notification');
const BARCODE=require('../../controllers/barcode');
const BIGDESKATTENDANCE=require('../../controllers/bigdeskAttendance');
const BARCODEFINAL=require('../../controllers/singleRecordBarcode');
const SALARY=require('../../controllers/salary');
const ASSETS=require('../../controllers/assets');
const router = require('express').Router();
const { isAuth } = require('../../middlewares/authentication');
const { verifyToken } = require("../../utils/helper");
const { upload } = require('../../middlewares/imageUpload');

router.post('/leaveRequest/store',isAuth(['user','HR Recruiter']),LEAVE.register);
router.get('/leaveRequest',isAuth(['user','HR Recruiter']),LEAVE.sendLeaveRequest);
router.get('/leaveRequest/history',isAuth(['user','HR Recruiter']),LEAVE.employeeLeaveHistory);
router.get('/approveLeaveRequest',isAuth(['user','HR Recruiter']),LEAVE.show);
router.get('/attendance',isAuth(['user','HR Recruiter']),ATTENDANCE.show);
router.get('/leaveDetails',isAuth(['user','HR Recruiter']),ATTENDANCE.leaveDetails);
router.get('/holidays',isAuth(['user','HR Recruiter']),HOLIDAYS.employeeAll);
router.get('/notification',isAuth(['user','HR Recruiter']),NOTIFICATION.employeeNotification);
router.get('/notification/view',isAuth(['user','HR Recruiter']),NOTIFICATION.employeeHeaderNotification);
router.get('/notification/viewed',isAuth(['user','HR Recruiter']),NOTIFICATION.viewdNotification);
router.get('/attendanceDetails',isAuth(['user','HR Recruiter']),ATTENDANCE.showDetails);
router.get('/interview',isAuth(['user','HR Recruiter']),INTERVIEW.interviewSchedule);
router.get('/api/interview',isAuth(['user','HR Recruiter']),INTERVIEW.interviewScheduleAPI);
router.get('/api/attendanceDetails',isAuth(['user','HR Recruiter']),ATTENDANCE.showDetailsAPI);
router.get('/api/leaveRequestHistoryTable',isAuth(['user','HR Recruiter']),LEAVE.empLeaveRequestHistoryTable);
router.get('/interview/create', isAuth(['HR Recruiter']),INTERVIEW.createInterviewByHr);//
router.post('/interview/create',isAuth(['HR Recruiter']),INTERVIEW.storeInterviewDetailsByHr);//
router.get('/interview/:id/view',isAuth(['user','HR Recruiter']),INTERVIEW.showInterviewEmployee);
router.get('/interview/:id/edit',isAuth(['user','HR Recruiter']),INTERVIEW.showInterviewUpdateEmployee);
router.post('/interview/:id/edit',isAuth(['user','HR Recruiter']),INTERVIEW.updateInterviewEmployee);
router.get('/interview/:id/delete',isAuth(['user','HR Recruiter']),INTERVIEW.deleteInterviewDetailsByHR);
router.get('/assets',isAuth(['user','HR Recruiter']),ASSETS.employeeAllAssets);


router.get('/change-password/:id',isAuth(['user','HR Recruiter']),AUTH.changePassword)
router.post('/change-password',isAuth(['user','HR Recruiter']),AUTH.change )


router.post('/getCode',upload.fields([{name: 'photo', maxCount: 1}]),BARCODE.barcode);
router.post('/getAttendance',verifyToken,BIGDESKATTENDANCE.bigdesk);
router.post('/getCodeapi',BARCODEFINAL.barcode);
router.get('/getSalary',SALARY.getSalary);


module.exports = router;
