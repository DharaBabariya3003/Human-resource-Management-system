const router = require('express').Router();
const USERREGISTER=require('../../controllers/user');
const { isAuth } = require('../../middlewares/authentication');
const { upload} = require('../../middlewares/excelUpload');

router.get('/xlsxDownload',isAuth(['admin','HR']),USERREGISTER.xlsxShow);
router.post('/xlsxDownload',isAuth(['admin','HR']),USERREGISTER.xlsxUpload);
router.get('/:id/salary-slip',isAuth(['admin','HR']),USERREGISTER.sendSalarySlip);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router 