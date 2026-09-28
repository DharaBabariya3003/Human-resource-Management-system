const router = require('express').Router();
const HOLIDAYS=require('../../controllers/holidays');
const { isAuth } = require('../../middlewares/authentication');

router.get('/', isAuth(['admin','HR']),HOLIDAYS.all);
router.get('/create', isAuth(['admin','HR']),HOLIDAYS.create);
router.post('/create', isAuth(['admin','HR']),HOLIDAYS.save);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router 

