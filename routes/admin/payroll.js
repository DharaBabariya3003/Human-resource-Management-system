const router = require('express').Router();
const PAYROLLREGISTER = require('../../controllers/payroll');
const { isAuth } = require('../../middlewares/authentication');

router.get('/:id/create',isAuth(['admin','HR']),PAYROLLREGISTER.showPayroll);
router.post('/create',isAuth(['admin','HR']),PAYROLLREGISTER.store);
router.get('/:id/delete',isAuth(['admin','HR']),PAYROLLREGISTER.destroy);
router.get('/:id/edit',isAuth(['admin','HR']),PAYROLLREGISTER.showUpdate);
router.post('/:id/edit',isAuth(['admin','HR']),PAYROLLREGISTER.update);
router.get('/bond-completed',isAuth(['admin','HR']),PAYROLLREGISTER.bondCompletedUsers);
router.get('/view/:id',isAuth(['admin','HR']),PAYROLLREGISTER.showView);
router.get('/:userId/increment/:id/delete',isAuth(['admin','HR']),PAYROLLREGISTER.deleteIncrement);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router