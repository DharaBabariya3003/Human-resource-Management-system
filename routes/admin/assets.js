const router = require('express').Router();
const ASSETS=require('../../controllers/assets');
const { isAuth } = require('../../middlewares/authentication');
const { validateAsset, validateSearchAsset, validateUserId } = require("../../validations/asset");
const { validate } = require('express-validation');

router.get('/', isAuth(['admin','HR','HR Recruiter']),ASSETS.all);
router.get('/xls', isAuth(['admin','HR','HR Recruiter']),ASSETS.xlsSheet);
router.get('/assetTypes', isAuth(['admin','HR','HR Recruiter']),ASSETS.allAssetTypes);
router.post('/assetTypes/store', isAuth(['admin','HR','HR Recruiter']),ASSETS.storeAssetTypes);
router.put('/assetTypes/edit', isAuth(['admin','HR','HR Recruiter']),ASSETS.editAssetTypes);
router.get('/assetNames', isAuth(['admin','HR','HR Recruiter']),ASSETS.allAssetNames);
router.post('/assetNames/store', isAuth(['admin','HR','HR Recruiter']),ASSETS.storeAssetName);
router.put('/assetNames/edit', isAuth(['admin','HR','HR Recruiter']),ASSETS.editAssetName);
router.get('/assetUsers', isAuth(['admin','HR','HR Recruiter']),ASSETS.allAssetUsers);
router.post('/store', isAuth(['admin','HR','HR Recruiter']),validate(validateAsset),ASSETS.storeAsset);
router.get('/search', isAuth(['admin','HR','HR Recruiter']),validate(validateSearchAsset),ASSETS.searchAsset);
router.get('/user-asset-info/:assetType/:user', isAuth(['admin','HR','HR Recruiter']),ASSETS.userAssetInfo);
router.get('/user', isAuth(['admin','HR','user','HR Recruiter']),validate(validateUserId),ASSETS.searchEmpAssetRecord);
router.delete('/delete', isAuth(['admin','HR','HR Recruiter']),ASSETS.deleteAsset);
router.get('*', (req, res)=>{res.sendRender('page404');});

module.exports = router 
