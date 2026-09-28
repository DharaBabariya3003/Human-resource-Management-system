const router = require('express').Router();
const USERREGISTER=require('../../controllers/user');
const { isAuth } = require('../../middlewares/authentication');

router.get('/',isAuth(['admin','HR']),USERREGISTER.leftEmployee);
router.get('/view/:selectedTab/:id',isAuth(['admin','HR']),USERREGISTER.viewDeleted);
router.get('/:id/delete',isAuth(['admin','HR']),USERREGISTER.deleteEmployee);
router.get('/:id/restore',isAuth(['admin','HR']),USERREGISTER.restore);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router
    