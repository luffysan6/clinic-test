// Auth route definitions
const { Router } = require('express');
const validate = require('../middlewares/validate');
const { authLimiter, strictLimiter } = require('../middlewares/rateLimiters');
const { registerSchema, verifyOtpSchema, resendOtpSchema, loginSchema } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

const router = Router();

router.use(authLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', strictLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', strictLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
