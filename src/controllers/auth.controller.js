// Auth route handlers
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const authService = require('../services/auth.service');

// Handles user registration
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const message = await authService.register(name, email, password);
  return ok(res, null, message, 201);
});

// Handles OTP verification
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOtp(email, otp);
  return ok(res, result);
});

// Handles OTP resend requests
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const message = await authService.resendOtp(email);
  return ok(res, null, message);
});

// Handles user login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return ok(res, result);
});

module.exports = { register, verifyOtp, resendOtp, login };
