const userController = require('../controllers/userControllers')
const auth = require('../auth');
const express = require('express');
const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/getAccessToken', userController.handleRefreshToken);
router.get('/logout', userController.logout);
router.get('/getLists', auth.authenticateToken, userController.getList);
router.post('/addList', auth.authenticateToken, userController.addList);
router.post('/addTaskToList', auth.authenticateToken, userController.addTaskToList);
router.delete('/deleteList', auth.authenticateToken, userController.deleteList);
router.delete('/deleteTaskFromList', auth.authenticateToken, userController.deleteTaskFromList);
router.patch('/setTaskComplete', auth.authenticateToken, userController.setTaskComplete);


module.exports = router;