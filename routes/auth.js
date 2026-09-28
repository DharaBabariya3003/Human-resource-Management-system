const router = require('express').Router();
const AUTH=require('../controllers/auth');

router.get('/login', (req,res)=>{res.sendRender('login');})
router.post('/login',AUTH.login);
router.get('/logout',AUTH.logout)

router.get('/forgot-password', (req,res)=>{res.sendRender('forgot-password');})
router.post('/forgot-password',AUTH.forgot )

router.get('/reset-password', (req,res)=>{res.sendRender('reset-password');})
router.get('/reset-password/:token',AUTH.reset )
router.post('/reset-password',AUTH.resetPassword )
router.get('*', (req, res)=>{res.sendRender('page404');});

module.exports = router;




