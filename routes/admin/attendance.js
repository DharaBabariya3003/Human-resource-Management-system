const router = require('express').Router();
const ATTENDANCE=require('../../controllers/attendance'); 
const { isAuth } = require('../../middlewares/authentication');

router.get('/', isAuth(['admin','HR']),ATTENDANCE.all);
router.get('/report', isAuth(['admin','HR']),ATTENDANCE.monthlyReport);  
router.get('/mode', isAuth(['admin','HR']),ATTENDANCE.attendanceMode);
router.get('/settings', isAuth(['admin','HR']),ATTENDANCE.settings);
router.get('/settings/create', isAuth(['admin','HR']),ATTENDANCE.showAddAtteSetting);
router.post('/settings/create', isAuth(['admin','HR']),ATTENDANCE.createSetting);
router.get('/settings/:id/edit',isAuth(['admin','HR']),ATTENDANCE.showAttSettingEdit);
router.post('/settings/:id/edit',isAuth(['admin','HR']),ATTENDANCE.AttSettingEdit);

router.get('/create', isAuth(['admin','HR']),ATTENDANCE.addShowAttendance);
router.post('/create', isAuth(['admin','HR']),ATTENDANCE.addNewAttendance);
  
//update Attendance Logs table
router.get('/:id/edit',isAuth(['admin','HR']),ATTENDANCE.showUpdate);
router.post('/:id/edit',isAuth(['admin','HR']),ATTENDANCE.update);

router.get('/:id/show',isAuth(['admin','HR']),ATTENDANCE.showView);
router.get('/:id/overtimeCheck',isAuth(['admin','HR']),ATTENDANCE.overTimeCheck);

router.get('/:id/salary',isAuth(['admin','HR']),ATTENDANCE.showSalary);
router.post('/:id/salary/edit',isAuth(['admin','HR']),ATTENDANCE.editSalary);

router.get('/:id/paySlip/edit',isAuth(['admin','HR']),ATTENDANCE.showEditSalary);
router.post('/:id/paySlip/edit',isAuth(['admin','HR']),ATTENDANCE.editPayslip);

router.get('/salary-slip', isAuth(['admin','HR']),ATTENDANCE.getSalarySlip);
router.post('/extra-minutes', isAuth(['admin','HR']),ATTENDANCE.addExtraMinutes);
router.get('/unset-extra-minutes', isAuth(['admin','HR']),ATTENDANCE.unsetExtraMinutes);
router.post('/checkOverTime', isAuth(['admin','HR']),ATTENDANCE.checkOverTime);

router.delete('/attendanceLog/delete', isAuth(['admin']),ATTENDANCE.deleteAttendanceLog);
router.delete('/delete', isAuth(['admin']),ATTENDANCE.deleteAttendance);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router 

