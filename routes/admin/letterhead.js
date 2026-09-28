const router = require('express').Router();
const LETTERHEAD=require('../../controllers/letterhead');
const { isAuth } = require('../../middlewares/authentication');
const { upload } = require('../../middlewares/imageUpload');

router.get('/letterhead-type/all', isAuth(['admin','HR']),LETTERHEAD.showAllLetterHeadType);
router.get('/letterhead-type', isAuth(['admin','HR']),LETTERHEAD.showLetterHeadType);
router.put('/letterhead-type', isAuth(['admin','HR']),LETTERHEAD.editLetterHeadTypes);
router.post('/letterhead-type', isAuth(['admin','HR']),LETTERHEAD.createLetterHeadType);

router.get('/', isAuth(['admin','HR']),LETTERHEAD.showLetterHead);
router.get('/:letterheadId', isAuth(['admin','HR']),LETTERHEAD.showSingleLetterHead);
router.post('/', isAuth(['admin','HR']),upload.fields([
  {name: 'letterHeadDocument', maxCount: 1},
]),LETTERHEAD.createLetterHead);

router.delete('/delete', isAuth(['admin','HR']),LETTERHEAD.deleteLetterHead);
router.put('/', isAuth(['admin','HR']),upload.fields([
  {name: 'letterHeadDocument', maxCount: 1},
]),LETTERHEAD.updateLetterHead);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router 


