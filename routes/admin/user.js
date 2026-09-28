const router = require('express').Router();
const USERREGISTER=require('../../controllers/user');
const { isAuth } = require('../../middlewares/authentication');
const { upload } = require('../../middlewares/imageUpload');

router.get('/',USERREGISTER.all);    
router.post('/departments',isAuth(['admin','HR']),USERREGISTER.allDepartments);
router.get('/bankdetails',isAuth(['admin','HR']),USERREGISTER.allBankName);  
router.get('/bankdetails/:id/delete',isAuth(['admin','HR']),USERREGISTER.deleteBankDetails);
router.post('/designations',isAuth(['admin','HR']),USERREGISTER.allDesignation);
router.get('/departmentDesignation',isAuth(['admin','HR']),USERREGISTER.allDesignationAndDepartment);   
router.get('/searchMonthlyRecord',isAuth(['admin','HR']),USERREGISTER.searchMonthRecord);
router.get('/create/employee', isAuth(['admin','HR']),USERREGISTER.showAddEmployee);
router.post('/store/employee',isAuth(['admin','HR']),upload.fields([
  {name: 'photo', maxCount: 1},
]),USERREGISTER.register);
router.get('/create/department', isAuth(['admin','HR']),USERREGISTER.showDepartments);
router.post('/store/department',isAuth(['admin','HR']),USERREGISTER.storeDepartments);
router.get('/create/designation', isAuth(['admin','HR']),USERREGISTER.showDesignation);
router.post('/store/designation',isAuth(['admin','HR']),USERREGISTER.storeDesignation);
router.get('/view/designation', isAuth(['admin','HR']),USERREGISTER.showSearchDesignation);
router.post('/view/designation', isAuth(['admin','HR']),USERREGISTER.searchDesignation);
router.get('/view/designation/employees', isAuth(['admin','HR']),USERREGISTER.showSearchEmpDesignation);
router.post('/view/designation/employees', isAuth(['admin','HR']),USERREGISTER.getSearchEmpDesignation);

//Bank routes
router.get('/create/bankdetails', isAuth(['admin','HR']),USERREGISTER.showBankDetails);
router.post('/store/bankdetails',isAuth(['admin','HR']),USERREGISTER.storeBankName);

router.post('/left',isAuth(['admin','HR']),USERREGISTER.left);   
router.get('/:id/employee',isAuth(['admin','HR']),USERREGISTER.showUpdate);
router.post('/:id/employee',isAuth(['admin','HR']),upload.fields([
  {name: 'photo', maxCount: 1},
]),USERREGISTER.update);
router.get('/view/:selectedTab/:id',isAuth(['admin','HR']),USERREGISTER.showView);

router.post('/:id/increment',isAuth(['admin','HR']),USERREGISTER.storeIncrement);
router.get('/resignEmployee',USERREGISTER.resignation);
router.get('/storeAttendanceRecord',USERREGISTER.storeAttendanceRecord);
router.get('/storeSingleAttendanceRecord',USERREGISTER.storeSingleAttendanceRecord);
router.get('/salary-details',isAuth(['admin','HR']),USERREGISTER.getSalaryDetails);

router.get('/logs',isAuth(['admin','HR']),USERREGISTER.showLogs);
router.get('/logs/view',isAuth(['admin','HR']),USERREGISTER.logAccess);


router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router 

