// Controller for health record and file endpoints
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const healthRecordService = require('../services/healthRecord.service');
const fileService = require('../services/file.service');

// Creates a health record for the authenticated user
const create = asyncHandler(async (req, res) => {
  const record = await healthRecordService.create(req.user.id, req.body);
  ok(res, record, 'Health record created', 201);
});

// Returns the authenticated user's health record
const get = asyncHandler(async (req, res) => {
  const record = await healthRecordService.getByUserId(req.user.id);
  ok(res, record);
});

// Updates the authenticated user's health record
const update = asyncHandler(async (req, res) => {
  const record = await healthRecordService.update(req.user.id, req.body);
  ok(res, record);
});

// Deletes the authenticated user's health record
const remove = asyncHandler(async (req, res) => {
  await healthRecordService.remove(req.user.id);
  ok(res, null, 'Health record deleted');
});

// Uploads files for the authenticated user
const uploadFiles = asyncHandler(async (req, res) => {
  const files = await fileService.upload(req.user.id, req.files, req.body.category);
  ok(res, files, 'Files uploaded', 201);
});

// Lists all file metadata for the authenticated user
const listFiles = asyncHandler(async (req, res) => {
  const files = await fileService.listByUser(req.user.id);
  ok(res, files);
});

// Downloads a specific file for the authenticated user
const downloadFile = asyncHandler(async (req, res) => {
  const { filePath, metadata } = await fileService.download(req.user.id, req.params.fileId, false);
  res.set('Content-Type', metadata.mimeType);
  res.set('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
  res.sendFile(path.resolve(filePath));
});

// Deletes a specific file for the authenticated user
const deleteFile = asyncHandler(async (req, res) => {
  await fileService.remove(req.user.id, req.params.fileId);
  ok(res, null, 'File deleted');
});

module.exports = {
  create,
  get,
  update,
  remove,
  uploadFiles,
  listFiles,
  downloadFile,
  deleteFile,
};
