const router = require('express').Router();
const NOTIFICATION=require('../../controllers/notification');
const { isAuth } = require('../../middlewares/authentication');

router.get('/',isAuth(['admin','HR']),NOTIFICATION.showNotification);
router.get('/view',isAuth(['admin','HR']),NOTIFICATION.headerNotification);
router.get('/viewed',isAuth(['admin','HR']),NOTIFICATION.viewdNotification);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router
