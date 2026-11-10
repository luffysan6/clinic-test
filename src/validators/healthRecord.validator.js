// Validation schemas for health record and file endpoints
const { z } = require('zod');

const BLOOD_GROUPS = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const FILE_CATEGORIES = ['LAB_REPORT', 'PRESCRIPTION', 'SCAN', 'OTHER'];

const AGE_MIN = 0;
const AGE_MAX = 130;
const HEIGHT_MIN = 30;
const HEIGHT_MAX = 300;
const WEIGHT_MIN = 1;
const WEIGHT_MAX = 500;
const TEXT_MAX = 1000;
const NOTES_MAX = 2000;
const EMERGENCY_NAME_MAX = 100;
const PHONE_MIN = 7;
const PHONE_MAX = 15;

const phoneRegex = /^\+?\d+$/;

const isoDateNotInFuture = z
  .string()
  .datetime({ message: 'Must be a valid ISO date string' })
  .refine(
    (val) => new Date(val) <= new Date(),
    { message: 'Date must not be in the future' }
  );

const healthRecordFields = {
  age: z.number().int('Age must be an integer').min(AGE_MIN).max(AGE_MAX),
  gender: z.enum(GENDERS),
  bloodGroup: z.enum(BLOOD_GROUPS),
  heightCm: z.number().min(HEIGHT_MIN).max(HEIGHT_MAX).optional(),
  weightKg: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX).optional(),
  allergies: z.string().max(TEXT_MAX).optional(),
  chronicConditions: z.string().max(TEXT_MAX).optional(),
  lastIllness: z.string().max(TEXT_MAX).optional(),
  pastInjuries: z.string().max(TEXT_MAX).optional(),
  currentMedications: z.string().max(TEXT_MAX).optional(),
  notes: z.string().max(NOTES_MAX).optional(),
  emergencyContactName: z.string().max(EMERGENCY_NAME_MAX).optional(),
  emergencyContactPhone: z
    .string()
    .min(PHONE_MIN, `Phone must be at least ${PHONE_MIN} characters`)
    .max(PHONE_MAX, `Phone must be at most ${PHONE_MAX} characters`)
    .regex(phoneRegex, 'Phone must contain only digits with an optional leading +')
    .optional(),
  lastIllnessDate: isoDateNotInFuture.optional(),
};

// Schema for creating a health record (age, gender, bloodGroup required)
const createHealthRecordSchema = {
  body: z.object({
    age: healthRecordFields.age,
    gender: healthRecordFields.gender,
    bloodGroup: healthRecordFields.bloodGroup,
    heightCm: healthRecordFields.heightCm,
    weightKg: healthRecordFields.weightKg,
    allergies: healthRecordFields.allergies,
    chronicConditions: healthRecordFields.chronicConditions,
    lastIllness: healthRecordFields.lastIllness,
    pastInjuries: healthRecordFields.pastInjuries,
    currentMedications: healthRecordFields.currentMedications,
    notes: healthRecordFields.notes,
    emergencyContactName: healthRecordFields.emergencyContactName,
    emergencyContactPhone: healthRecordFields.emergencyContactPhone,
    lastIllnessDate: healthRecordFields.lastIllnessDate,
  }),
};

// Schema for updating a health record (all fields optional, at least one required)
const updateHealthRecordSchema = {
  body: z
    .object({
      age: healthRecordFields.age.optional(),
      gender: z.enum(GENDERS).optional(),
      bloodGroup: z.enum(BLOOD_GROUPS).optional(),
      heightCm: healthRecordFields.heightCm,
      weightKg: healthRecordFields.weightKg,
      allergies: healthRecordFields.allergies,
      chronicConditions: healthRecordFields.chronicConditions,
      lastIllness: healthRecordFields.lastIllness,
      pastInjuries: healthRecordFields.pastInjuries,
      currentMedications: healthRecordFields.currentMedications,
      notes: healthRecordFields.notes,
      emergencyContactName: healthRecordFields.emergencyContactName,
      emergencyContactPhone: healthRecordFields.emergencyContactPhone,
      lastIllnessDate: healthRecordFields.lastIllnessDate,
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      { message: 'At least one field must be provided' }
    ),
};

// Schema for file upload category query
const fileUploadQuerySchema = {
  body: z.object({
    category: z.enum(FILE_CATEGORIES).optional(),
  }),
};

// Schema for file ID parameter validation
const fileIdParamSchema = {
  params: z.object({
    fileId: z.string().uuid('Invalid file ID format'),
  }),
};

module.exports = {
  createHealthRecordSchema,
  updateHealthRecordSchema,
  fileUploadQuerySchema,
  fileIdParamSchema,
};
