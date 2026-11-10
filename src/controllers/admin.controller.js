'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const adminService = require('../services/admin.service');
const userService = require('../services/user.service');
const fileService = require('../services/file.service');

/** List users with pagination and optional search */
const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);
  ok(res, result);
});

/** Get detailed user info including health record and files */
const getUserDetail = asyncHandler(async (req, res) => {
  const result = await adminService.getUserDetail(req.params.userId);
  ok(res, result);
});

/** Stream or redirect to a user's profile image */
const getUserProfileImage = asyncHandler(async (req, res) => {
  const image = await userService.getProfileImage(req.params.userId);
  if (image.isRemote) {
    return res.redirect(image.url);
  }
  res.sendFile(image.path);
});

/** Download a specific file belonging to a user */
const downloadUserFile = asyncHandler(async (req, res) => {
  const { filePath, metadata } = await fileService.download(
    req.params.userId,
    req.params.fileId,
    true
  );
  res.set('Content-Type', metadata.mimeType);
  res.set('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
  res.sendFile(filePath);
});

/** Delete a user and all their associated data */
const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.userId);
  ok(res, null, 'User deleted');
});

module.exports = {
  listUsers,
  getUserDetail,
  getUserProfileImage,
  downloadUserFile,
  deleteUser,
};
