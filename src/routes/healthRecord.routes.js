// Routes for health record CRUD and file management
const { Router } = require('express');
const authenticate = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const { recordFilesUpload } = require('../config/multer');
const {
  createHealthRecordSchema,
  updateHealthRecordSchema,
  fileIdParamSchema,
} = require('../validators/healthRecord.validator');
const healthRecordController = require('../controllers/healthRecord.controller');

const router = Router();

router.use(authenticate, requireRole('USER'));

// Health record CRUD
router.post('/', validate(createHealthRecordSchema), healthRecordController.create);
router.get('/', healthRecordController.get);
router.patch('/', validate(updateHealthRecordSchema), healthRecordController.update);
router.delete('/', healthRecordController.remove);

// File management
router.post('/files', recordFilesUpload, healthRecordController.uploadFiles);
router.get('/files', healthRecordController.listFiles);
router.get('/files/:fileId', validate(fileIdParamSchema), healthRecordController.downloadFile);
router.delete('/files/:fileId', validate(fileIdParamSchema), healthRecordController.deleteFile);

module.exports = router;
