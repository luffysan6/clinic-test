'use strict';

const { z } = require('zod');

/** Query schema for paginated user listing */
const listUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
    search: z.string().trim().optional(),
  }),
};

/** Params schema for routes with :userId */
const userIdParamSchema = {
  params: z.object({
    userId: z.string().uuid(),
  }),
};

/** Params schema for routes with :fileId */
const fileIdParamSchema = {
  params: z.object({
    fileId: z.string().uuid(),
  }),
};

/** Params schema for routes with :userId and :fileId */
const userFileParamsSchema = {
  params: z.object({
    userId: z.string().uuid(),
    fileId: z.string().uuid(),
  }),
};

module.exports = {
  listUsersSchema,
  userIdParamSchema,
  fileIdParamSchema,
  userFileParamsSchema,
};
