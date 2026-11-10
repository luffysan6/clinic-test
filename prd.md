Clinic Management Backend: Build Prompt for the Coding Agent
You are a senior Node.js backend engineer. Build the complete backend described below. Follow every rule literally. Where this document makes a decision, do not re-decide it. If something is genuinely not covered, choose the simplest option that is consistent with the rules in Section 12 and write the choice in DECISIONS.md. Do not ask questions and do not add features that are not listed.
1. Product summary
A REST API for a small clinic.
• There is exactly one ADMIN (created by a seed script from environment variables). Nobody can register as admin.
• Everyone else is a USER (a patient).
• A USER journey: register with email and password, receive a 6-digit OTP by email, verify it, log in, fill in one health record (biological details), upload medical files, and optionally edit their profile (name, password, profile image only).
• The ADMIN can list users, view any user's profile, health record and files, and delete a user.
Out of scope (do NOT build): password reset or forgot password, email change, refresh tokens, social login, appointments, payments, frontend, Docker, tests beyond the smoke checklist in Section 14.
2. Fixed tech stack
Concern
Choice
Runtime
Node.js 20+, CommonJS (require, module.exports). Do not use ES modules.
Framework
Express 4
Database
PostgreSQL
ORM
Prisma (@prisma/client, prisma)
Passwords and OTP hashing
bcryptjs (cost 10)
Auth
jsonwebtoken, access token only, sent as Authorization: Bearer <token>
Email
nodemailer over SMTP
Validation
zod
Uploads
multer (disk storage)
Security
helmet, cors, express-rate-limit
Config
dotenv
Dev
nodemon
No other runtime dependencies without a written reason in DECISIONS.md.
3. Folder structure (create exactly this)
clinic-api/
  prisma/
    schema.prisma
    seed.js
  src/
    app.js                 # builds the express app (no listen)
    server.js              # loads env, listens
    config/
      env.js               # validates and exports env
      prisma.js            # single PrismaClient instance
      mailer.js            # nodemailer transporter
      multer.js            # upload factories
    middlewares/
      auth.js              # authenticate
      requireRole.js
      validate.js          # zod wrapper
      errorHandler.js      # 404 + central error handler
      rateLimiters.js
    routes/
      index.js             # mounts all routers under /api
      auth.routes.js
      me.routes.js
      healthRecord.routes.js
      admin.routes.js
    controllers/
      auth.controller.js
      me.controller.js
      healthRecord.controller.js
      admin.controller.js
    services/
      auth.service.js
      otp.service.js
      email.service.js
      user.service.js
      healthRecord.service.js
      file.service.js
    validators/
      auth.validator.js
      me.validator.js
      healthRecord.validator.js
      admin.validator.js
    utils/
      AppError.js
      asyncHandler.js
      response.js          # ok() helper
      token.js             # sign and verify JWT
      serializers.js       # safe user output
    constants/
      index.js             # roles, limits, error codes
  uploads/                 # gitignored, created at startup if missing
    profile/
    records/
  .env.example
  .gitignore
  package.json
  README.md
  DECISIONS.md
4. Environment variables
src/config/env.js must read these, fail fast with a clear message if any required one is missing, and export a frozen object. No other file may read process.env.
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/clinic_db
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=1d
ADMIN_EMAIL=admin@clinic.com
ADMIN_PASSWORD=ChangeMe@123
ADMIN_NAME=Clinic Admin
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app_password
MAIL_FROM=Clinic <you@gmail.com>
OTP_EXPIRY_MINUTES=10
CORS_ORIGIN=http://localhost:3000
5. Prisma schema (use exactly)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  USER
}

enum BloodGroup {
  A_POS
  A_NEG
  B_POS
  B_NEG
  AB_POS
  AB_NEG
  O_POS
  O_NEG
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum FileCategory {
  LAB_REPORT
  PRESCRIPTION
  SCAN
  OTHER
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String
  role         Role     @default(USER)
  isVerified   Boolean  @default(false)
  profileImage String?  // stored file name only, never a full path
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  healthRecord HealthRecord?
  files        RecordFile[]
  emailOtp     EmailOtp?
}

model EmailOtp {
  id          String   @id @default(uuid())
  userId      String   @unique
  otpHash     String
  expiresAt   DateTime
  attempts    Int      @default(0)
  lastSentAt  DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model HealthRecord {
  id                 String     @id @default(uuid())
  userId             String     @unique
  age                Int
  gender             Gender
  bloodGroup         BloodGroup
  heightCm           Float?
  weightKg           Float?
  allergies          String?
  chronicConditions  String?
  lastIllness        String?
  lastIllnessDate    DateTime?
  pastInjuries       String?
  currentMedications String?
  emergencyContactName  String?
  emergencyContactPhone String?
  notes              String?
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RecordFile {
  id           String       @id @default(uuid())
  userId       String
  originalName String
  storedName   String       @unique
  mimeType     String
  sizeBytes    Int
  category     FileCategory @default(OTHER)
  createdAt    DateTime     @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
The user's name lives only on User. The health record does not duplicate it.
6. Business rules
6.1 Roles and admin
• Admin is created only by prisma/seed.js using ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME. The seed is idempotent (upsert by email), sets role=ADMIN, isVerified=true, and hashes the password with bcryptjs.
• Admin logs in through the same POST /api/auth/login.
• POST /api/auth/register must reject ADMIN_EMAIL (case-insensitive) with 409 EMAIL_ALREADY_REGISTERED. Register can never set a role; the role is always USER.
• Emails are lowercased and trimmed before every read and write.
6.2 Registration and OTP
1. POST /api/auth/register with name, email, password.
    ◦ If a verified user with that email exists: 409 EMAIL_ALREADY_REGISTERED.
    ◦ If an unverified user exists: update its name and password hash, then issue a new OTP (this lets people retry).
    ◦ Otherwise create the user with isVerified=false.
    ◦ Generate the OTP and send the email. Return 201 with a message only (no token).
2. OTP generation: 6 digits using crypto.randomInt(100000, 1000000). Store only the bcrypt hash. Expiry = now + OTP_EXPIRY_MINUTES. One OTP row per user (upsert, reset attempts to 0).
3. POST /api/auth/verify-otp with email, otp:
    ◦ No user or no OTP row: 400 INVALID_OTP.
    ◦ Expired: 400 OTP_EXPIRED.
    ◦ attempts >= 5: 429 OTP_ATTEMPTS_EXCEEDED (user must resend).
    ◦ Wrong: increment attempts, 400 INVALID_OTP.
    ◦ Correct: in one transaction set isVerified=true and delete the OTP row. Return 200 with { token, user } so the user is logged in immediately.
4. POST /api/auth/resend-otp with email: if the user is unverified and lastSentAt is older than 60 seconds, issue a new OTP. If within 60 seconds: 429 OTP_RESEND_COOLDOWN. For an unknown or already-verified email, return the same generic 200 message so emails cannot be enumerated.
5. POST /api/auth/login with email, password:
    ◦ Wrong email or password: 401 INVALID_CREDENTIALS (same message for both).
    ◦ Correct but unverified: 403 EMAIL_NOT_VERIFIED.
    ◦ Success: { token, user }.
6.3 JWT
• Payload: { sub: userId, role }. Signed with JWT_SECRET, expiry JWT_EXPIRES_IN.
• The authenticate middleware verifies the token, loads the user from the database (so deleted users are rejected), checks isVerified, and sets req.user = { id, role }. Failures return 401 UNAUTHORIZED.
• requireRole('ADMIN') returns 403 FORBIDDEN if the role does not match.
6.4 Profile (the only editable account fields)
• Editable: name, password, profileImage. Nothing else. Email is immutable.
• PATCH /api/me accepts only { name }. Use a zod .strict() schema so any extra key, especially email or role, returns 400 VALIDATION_ERROR.
• PATCH /api/me/password accepts { currentPassword, newPassword }. Verify the current password, enforce the password policy, reject if the new one equals the old one.
• Profile image: upload, replace, delete and fetch (see Section 7). Replacing or deleting removes the old file from disk.
6.5 Health record
• One record per user (userId unique). Only the owner can create, read, update and delete it. Admin can read any record but cannot modify it.
• Create returns 409 HEALTH_RECORD_EXISTS if one already exists. Read, update and delete return 404 HEALTH_RECORD_NOT_FOUND if none exists.
• Update is a partial PATCH; at least one field must be present.
• Deleting the user's record does not delete their uploaded files.
6.6 Files
• Medical files belong to the user (RecordFile.userId), independent of whether a health record exists.
• Only the owner (and admin, read-only) can list or download. Only the owner can upload or delete.
• Max 10 files per user in total. Max 5 files per upload request. Max 5 MB each.
• Allowed MIME types: application/pdf, image/jpeg, image/png. Check both the MIME type and the file extension.
• Files are stored under uploads/records/ with a random name: crypto.randomUUID() + extension. The original name is stored only in the database.
• Files are never served as static assets. Do not use express.static on uploads. Every download goes through an authenticated endpoint that checks ownership, then res.download or res.sendFile.
• If a database write fails after upload, delete the stored files. If a database delete succeeds, delete the file from disk (ignore a missing file).
6.7 Deleting a user (admin)
• Admin cannot delete themselves or any ADMIN (400 CANNOT_DELETE_ADMIN).
• Deleting a user removes the DB rows (cascade) and then all of that user's files and profile image from disk.
7. API contract
All routes are mounted under /api. Method, path, who, what.
Auth (public, rate limited)
Method
Path
Body
Success
POST
/auth/register
name, email, password
201 message
POST
/auth/verify-otp
email, otp
200 { token, user }
POST
/auth/resend-otp
email
200 message
POST
/auth/login
email, password
200 { token, user }
Me (any authenticated user)
Method
Path
Notes
GET
/me
Returns safe user object
PATCH
/me
Body { name } only
PATCH
/me/password
Body { currentPassword, newPassword }
PUT
/me/profile-image
multipart, field image, jpeg/png/webp, max 2 MB
GET
/me/profile-image
Streams the image, 404 if none
DELETE
/me/profile-image
Removes it
Health record (role USER only)
Method
Path
Notes
POST
/health-record
Create
GET
/health-record
Read own
PATCH
/health-record
Partial update
DELETE
/health-record
Delete own
POST
/health-record/files
multipart, field files (max 5), optional body category
GET
/health-record/files
List own file metadata
GET
/health-record/files/:fileId
Download own file
DELETE
/health-record/files/:fileId
Delete own file
Health record body fields: age (int 0-130, required on create), gender (required), bloodGroup (required, enum above), heightCm (30-300), weightKg (1-500), and optional strings with max lengths: allergies, chronicConditions, lastIllness, pastInjuries, currentMedications (each max 1000), notes (max 2000), emergencyContactName (max 100), emergencyContactPhone (7-15 digits, optional leading +), and lastIllnessDate (ISO date, not in the future).
Admin (role ADMIN only)
Method
Path
Notes
GET
/admin/users
Query page (default 1), limit (default 10, max 50), search (name or email, case-insensitive). Returns { items, page, limit, total, totalPages }
GET
/admin/users/:userId
User plus health record plus file metadata
GET
/admin/users/:userId/profile-image
Streams image
GET
/admin/users/:userId/files/:fileId
Download a user's file
DELETE
/admin/users/:userId
See 6.7
GET /api/health (public) returns { success: true, data: { status: 'ok' } }.
8. Response and error format
Every JSON response uses one of these two shapes and nothing else.
{ "success": true, "message": "optional text", "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Human readable", "details": [ ] } }
• Controllers return success through utils/response.js (ok(res, data, message, status = 200)).
• Controllers never build error responses. They throw AppError(status, code, message, details).
• The central error handler converts AppError, ZodError (400 VALIDATION_ERROR with field details), multer errors (400 FILE_TOO_LARGE, TOO_MANY_FILES, INVALID_FILE_TYPE), JWT errors (401), and Prisma P2002 (409) / P2025 (404). Anything else is 500 INTERNAL_ERROR with a generic message; the stack is logged but never sent.
• All error codes live in constants/index.js as an object. Do not write code strings inline.
• Safe user object (via serializers.js): id, email, name, role, isVerified, hasProfileImage, createdAt. passwordHash, emailOtp and stored file names must never appear in any response.
9. Validation rules
• Password policy: 8-64 characters, at least one lowercase, one uppercase, one digit.
• Name: trimmed, 2-60 characters.
• Email: valid format, lowercased, max 254.
• OTP: exactly 6 digits.
• Validation happens in validators/*.js (zod schemas) and is applied by middlewares/validate.js as validate({ body, query, params }). Controllers receive already-validated data.
• All :userId and :fileId params are validated as UUIDs.
10. Email
• email.service.js exposes sendOtpEmail(to, name, otp). The email has a plain-text part and a simple HTML part, subject Verify your email, and states the expiry time.
• If sending fails, throw AppError(502, 'EMAIL_SEND_FAILED', ...). During registration, still keep the created user so the user can use resend-otp.
• In NODE_ENV=development also log the OTP to the console to ease testing. Never log it in production.
11. Security checklist (all mandatory)
1. helmet() and cors({ origin: CORS_ORIGIN }).
2. express.json({ limit: '100kb' }).
3. Rate limit /api/auth/*: 10 requests per 15 minutes per IP. Additionally rate limit verify-otp and resend-otp more strictly (5 per 15 minutes).
4. bcryptjs for passwords and OTP. Never store or log plaintext secrets.
5. Never trust client-provided userId for owner-only resources. Use req.user.id.
6. Use Prisma query methods only. No raw SQL.
7. Never expose internal paths or stack traces.
8. Uploads: random file names, type and size limits, outside any static route.
9. .env and uploads/ are in .gitignore.
12. Coding rules (consistency contract)
Layering. routes -> controllers -> services -> prisma. Dependencies only flow downward.
• Routes: only map path to middlewares to controller. No logic.
• Controllers: read req, call exactly one service method, call ok(...). No Prisma, no business rules, no try/catch (wrap with asyncHandler).
• Services: all business logic and all Prisma calls. Services never touch req or res. They throw AppError.
• Only config/prisma.js creates PrismaClient; everyone else imports it.
Style.
• Files: camelCase.role.js (for example auth.service.js). Variables and functions camelCase, constants UPPER_SNAKE_CASE, Prisma models PascalCase.
• async/await only. No callbacks, no .then chains.
• const by default, strict equality, single quotes, semicolons, 2-space indent.
• Every Prisma read that returns a user must use an explicit select or pass through the serializer. Never return a raw Prisma user row.
• Multi-step writes that must succeed together use prisma.$transaction.
• No magic numbers or strings. Limits, roles and error codes come from constants/index.js.
• Use console.log only inside a tiny logger helper in utils (info, error) so it can be swapped later.
• Every exported function gets a one-line comment on what it does. No commented-out code.
• One responsibility per file. If a service file passes about 250 lines, split it by concern.
Process rules.
• Build in the phases of Section 13. Finish and run the check of a phase before starting the next.
• Never rename a field, route, enum or code defined in this document.
• Do not install packages that are not in Section 2.
• Do not leave TODOs. If something is out of scope, leave it out.
• Keep README.md accurate: setup steps, env variables, how to run migrations and the seed, and a table of all endpoints.
13. Build phases
Phase 1: Foundation. package.json (scripts: dev, start, prisma:migrate, prisma:seed), folder structure, env.js, prisma.js, AppError, asyncHandler, response.js, errorHandler, app.js, server.js, /api/health. Check: server starts and health returns ok.
Phase 2: Database. schema.prisma, run the first migration, seed.js for the admin. Check: the admin row exists with a hashed password.
Phase 3: Auth. Mailer, email service, OTP service, token util, register, verify-otp, resend-otp, login, authenticate, requireRole, rate limiters. Check: the complete flow in Section 14 steps 1-6.
Phase 4: Profile. GET/PATCH /me, password change, profile image endpoints with multer. Check: steps 7-9.
Phase 5: Health record and files. CRUD for the record, file upload, list, download, delete. Check: steps 10-13.
Phase 6: Admin. User list with search and pagination, user detail, file and image access, delete user. Check: steps 14-16.
Phase 7: Finish. Review against Section 11 and Section 12, update README.md, create DECISIONS.md, remove unused code.
14. Smoke checklist (verify each with curl or an HTTP client and report results)
1. Register a new user: 201, OTP email arrives (or is logged in development).
2. Login before verifying: 403 EMAIL_NOT_VERIFIED.
3. Verify with a wrong OTP: 400; five wrong attempts: 429.
4. Resend within 60 seconds: 429; after 60 seconds: new OTP works.
5. Verify with the correct OTP: 200 with token.
6. Register with the same verified email, and with the admin email: both 409.
7. PATCH /me with { name }: works. With { email }: 400.
8. Change password with the wrong current password: 400; with the right one: login works using the new password only.
9. Upload a profile image, fetch it, replace it (old file removed from disk), delete it.
10. Create a health record: 201. Create again: 409.
11. Partial update and delete the record.
12. Upload a PDF, a PNG, a 6 MB file (rejected), and a .exe (rejected). The 11th file for a user is rejected.
13. User B cannot read or download user A's file (404).
14. Normal user calling any /admin/* route: 403.
15. Admin lists users with search and page; opens a user's detail and downloads a file.
16. Admin deletes a user: DB rows and files are gone. Admin deleting the admin: 400.
15. Definition of done
• Every endpoint in Section 7 works exactly as specified, with the response shapes of Section 8.
• All items in Section 11 are implemented.
• The folder structure matches Section 3, with no extra layers.
• The app starts from a clean clone with only npm install, .env, npx prisma migrate dev, npm run prisma:seed, npm run dev.
• README.md and DECISIONS.md are complete.
• Your final message lists what was built per phase, the smoke-check results, and any decisions you recorded.