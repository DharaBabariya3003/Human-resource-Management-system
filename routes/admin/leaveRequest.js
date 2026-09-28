const router = require('express').Router();
const LEAVE=require('../../controllers/leave');
const { isAuth } = require('../../middlewares/authentication');

router.get('/',isAuth(['admin','HR']),LEAVE.leave);
router.get('/history',isAuth(['admin','HR']),LEAVE.leaveHistory);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router
        