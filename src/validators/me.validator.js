// Validation schemas for profile endpoints
const { z } = require('zod');

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;
const NAME_MIN = 2;
const NAME_MAX = 60;

// Schema for updating user profile (name only)
const updateProfileSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(NAME_MIN, `Name must be at least ${NAME_MIN} characters`)
      .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`),
  }).strict(),
};

// Schema for changing password
const changePasswordSchema = {
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`)
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit'),
  }),
};

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};
