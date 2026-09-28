const router = require('express').Router();
const INTERVIEW=require('../../controllers/interview');
const NOTIFICATION=require('../../controllers/notification');
const { isAuth } = require('../../middlewares/authentication');

router.get('/',isAuth(['admin','HR']),INTERVIEW.interviewAll);
router.get('/create', isAuth(['admin','HR']),INTERVIEW.createInterview);
router.post('/create',isAuth(['admin','HR']),INTERVIEW.storeInterviewDetails);
router.get('/:id/view',isAuth(['admin','HR']),INTERVIEW.showInterview);
router.get('/:id/edit',isAuth(['admin','HR']),INTERVIEW.showInterviewUpdate);
router.post('/:id/edit',isAuth(['admin','HR']),INTERVIEW.updateInterview);
router.get('/notification',isAuth(['admin','HR']),NOTIFICATION.showInterviewNotification);
router.get('/done',isAuth(['admin','HR']),INTERVIEW.doneInterview);
router.get('/done/:id/delete',isAuth(['admin','HR']),INTERVIEW.deleteDoneInterviewDetails);
router.get('/:id/delete',isAuth(['admin','HR']),INTERVIEW.deleteInterviewDetails);
router.get('/xls',isAuth(['admin','HR','HR Recruiter']),INTERVIEW.interviewXlsSheet);

router.get('*', (req, res)=>{res.sendRender('page404');});
module.exports = router