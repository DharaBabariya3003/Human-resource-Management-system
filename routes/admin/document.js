const router = require('express').Router();
const { upload } = require('../../middlewares/imageUpload');
const DOCUMENTREGISTER = require('../../controllers/document');
const { isAuth } = require('../../middlewares/authentication');

router.get('/:id/create', isAuth(['admin','HR']),DOCUMENTREGISTER.showDocument)
router.post('/create',isAuth(['admin','HR']),upload.fields([
  {name: 'photo', maxCount: 1},
  {name: 'offerLetterDocument', maxCount: 1},
  {name: 'appoinmentLetterDocument', maxCount: 1},
  {name: 'marksheet10Document', maxCount: 1},
  {name: 'marksheet12Document', maxCount: 1},
  {name: 'bachelorsCertificateDocument', maxCount: 1},
  {name: 'mastersCertificateDocument', maxCount: 1},
  {name: 'IDproofDocument', maxCount: 1},
  {name: 'otherDocument', minCount: 0}
]),DOCUMENTREGISTER.store);
router.get('/:id/edit',isAuth(['admin','HR']),DOCUMENTREGISTER.showUpdate);
router.post('/:id/edit',isAuth(['admin','HR']),upload.fields([
  {name: 'photo', maxCount: 1},
  {name: 'offerLetterDocument', maxCount: 1},
  {name: 'appoinmentLetterDocument', maxCount: 1},
  {name: 'marksheet10Document', maxCount: 1},
  {name: 'marksheet12Document', maxCount: 1},
  {name: 'bachelorsCertificateDocument', maxCount: 1},
  {name: 'mastersCertificateDocument', maxCount: 1},
  {name: 'IDproofDocument', maxCount: 1},
  {name: 'otherDocument', minCount: 0}
]),DOCUMENTREGISTER.update);
router.get('/:id/delete',isAuth(['admin','HR']),DOCUMENTREGISTER.destroy);
router.get('/:id/delete-file',isAuth(['admin','HR']),DOCUMENTREGISTER.deleteDocument);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router;
