// Routes for authenticated user profile management
const { Router } = require('express');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { profileImageUpload } = require('../config/multer');
const { updateProfileSchema, changePasswordSchema } = require('../validators/me.validator');
const meController = require('../controllers/me.controller');

const router = Router();

router.use(authenticate);

router.get('/', meController.getProfile);
router.patch('/', validate(updateProfileSchema), meController.updateProfile);
router.patch('/password', validate(changePasswordSchema), meController.changePassword);
router.put('/profile-image', profileImageUpload, meController.uploadProfileImage);
router.get('/profile-image', meController.getProfileImage);
router.delete('/profile-image', meController.deleteProfileImage);

module.exports = router;
