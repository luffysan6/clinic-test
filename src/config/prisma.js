'use strict';

const { PrismaClient } = require('@prisma/client');

// Creates and exports a singleton PrismaClient instance
const prisma = new PrismaClient();

module.exports = prisma;
