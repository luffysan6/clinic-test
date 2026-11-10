'use strict';

const { Router } = require('express');
const { ok } = require('../utils/response');
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const healthRecordRoutes = require('./healthRecord.routes');
const adminRoutes = require('./admin.routes');

// Central API router
const router = Router();

// Public health check endpoint
router.get('/health', (req, res) => {
  ok(res, { status: 'ok' });
});

// Mount module routers
router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/health-record', healthRecordRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
