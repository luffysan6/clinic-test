'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const {
  listUsersSchema,
  userIdParamSchema,
  userFileParamsSchema,
} = require('../validators/admin.validator');
const {
  listUsers,
  getUserDetail,
  getUserProfileImage,
  downloadUserFile,
  deleteUser,
} = require('../controllers/admin.controller');

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, requireRole('ADMIN'));

/** GET /users — paginated user list with optional search */
router.get('/users', validate(listUsersSchema), listUsers);

/** GET /users/:userId — full user detail */
router.get('/users/:userId', validate(userIdParamSchema), getUserDetail);

/** GET /users/:userId/profile-image — stream user's profile image */
router.get('/users/:userId/profile-image', validate(userIdParamSchema), getUserProfileImage);

/** GET /users/:userId/files/:fileId — download a user's file */
router.get('/users/:userId/files/:fileId', validate(userFileParamsSchema), downloadUserFile);

/** DELETE /users/:userId — delete a user */
router.delete('/users/:userId', validate(userIdParamSchema), deleteUser);

module.exports = router;
