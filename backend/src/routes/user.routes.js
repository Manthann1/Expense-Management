const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/', authenticateToken, authorizeRoles('Admin'), userController.createUser);
router.get('/', authenticateToken, authorizeRoles('Admin', 'Manager'), userController.getUsers);
router.get('/:id', authenticateToken, userController.getUserById);

module.exports = router;
