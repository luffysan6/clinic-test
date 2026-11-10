// Controller for user profile endpoints
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const userService = require('../services/user.service');

// Returns the authenticated user's profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  ok(res, user);
});

// Updates the authenticated user's profile (name only)
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  ok(res, user);
});

// Changes the authenticated user's password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.user.id, currentPassword, newPassword);
  ok(res, null, 'Password changed successfully');
});

// Uploads a profile image for the authenticated user
const uploadProfileImage = asyncHandler(async (req, res) => {
  const user = await userService.uploadProfileImage(req.user.id, req.file);
  ok(res, user);
});

// Streams the authenticated user's profile image
const getProfileImage = asyncHandler(async (req, res) => {
  const filePath = await userService.getProfileImage(req.user.id);
  res.sendFile(path.resolve(filePath));
});

// Deletes the authenticated user's profile image
const deleteProfileImage = asyncHandler(async (req, res) => {
  await userService.deleteProfileImage(req.user.id);
  ok(res, null, 'Profile image deleted');
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  getProfileImage,
  deleteProfileImage,
};
