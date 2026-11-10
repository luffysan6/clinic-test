# Architecture and Technical Decisions

This document records technical and architectural decisions made during the implementation of the Clinic Management Backend in accordance with the PRD.

---

### 1. Dual-Cased Environment Variable Export in `src/config/env.js`
- **Context:** The PRD lists environment variables in UPPER_SNAKE_CASE (e.g., `JWT_SECRET`, `PORT`, `SMTP_PORT`). JavaScript code conventions frequently reference config object properties in camelCase.
- **Decision:** `src/config/env.js` exports a frozen configuration object containing both exact UPPER_SNAKE_CASE keys and camelCase aliases (e.g., both `config.PORT` and `config.port`).
- **Rationale:** Prevents runtime casing mismatches across services and utilities while maintaining strict immutability.

---

### 2. Flexible Parameter Handling in `src/utils/AppError.js`
- **Context:** Section 8 / Section 12 specifies `AppError(status, code, message, details)`, while JavaScript `Error` subclasses conventionally place `message` as the primary argument.
- **Decision:** The `AppError` constructor inspects the type of the first argument. If `typeof arg1 === 'number'`, it maps to `(statusCode, code, message, details)`. If `typeof arg1 === 'string'`, it maps to `(message, statusCode, code, details)`.
- **Rationale:** Fully satisfies the PRD signature contract while remaining resilient against conventional argument ordering.

---

### 3. Local Development and Test Email Handling in `src/services/email.service.js`
- **Context:** Section 10 requires OTP delivery via SMTP and states: *"In NODE_ENV=development also log the OTP to the console to ease testing."* When running locally with default `.env` placeholder credentials (`app_password`), live SMTP connection calls to external mail providers will fail.
- **Decision:** When `NODE_ENV` is `development` or `test` and placeholder credentials (`SMTP_PASS === 'app_password'` or empty) are detected, the service logs the OTP to stdout and skips calling the live SMTP transport. If real credentials are provided, full SMTP dispatch occurs.
- **Rationale:** Allows complete end-to-end local testing and smoke check execution out of the box without requiring real external SMTP credentials.

---

### 4. Consistent Error Response `details` Format
- **Context:** Section 8 defines the exact error response shape as `{ "success": false, "error": { "code": "...", "message": "...", "details": [ ] } }`.
- **Decision:** The central error handler (`src/middlewares/errorHandler.js`) guarantees that `details` is always an array (defaults to `[]` when no sub-field details exist).
- **Rationale:** Adheres strictly to the JSON response contract across all error scenarios.

---

### 5. Custom `AppError` on Multer File Filtering
- **Context:** Section 8 specifies that Multer errors return `400 FILE_TOO_LARGE`, `TOO_MANY_FILES`, and `INVALID_FILE_TYPE`. By default, Multer emits `LIMIT_UNEXPECTED_FILE` when a filter rejects a file.
- **Decision:** `profileFileFilter` and `recordFileFilter` in `src/config/multer.js` pass a `new AppError(400, ERROR_CODES.INVALID_FILE_TYPE, ...)` to the callback when disallowed extensions or MIME types are detected.
- **Rationale:** Ensures clean and explicit error reporting with code `INVALID_FILE_TYPE` rather than generic or unhandled Multer errors.

---

### 6. Test Suite Rate Limiter Bypass
- **Context:** Section 11 mandates rate limiting on `/api/auth/*` (10 requests per 15 minutes) and strict rate limiting on `verify-otp` / `resend-otp` (5 requests per 15 minutes). Running automated test suites from a single local IP quickly triggers IP-level rate limits.
- **Decision:** `src/middlewares/rateLimiters.js` includes `skip: () => config.NODE_ENV === 'test'`.
- **Rationale:** Protects production and development environments from abuse while enabling rapid automated smoke test execution.

---

### 7. Explicit Filesystem Verification for File Downloads
- **Context:** When retrieving a user's profile image (`GET /me/profile-image` and `GET /admin/users/:userId/profile-image`) or record file, the database record may exist while the file on disk might be missing.
- **Decision:** Services execute `fs.access` before returning the file path to controllers, throwing a 404 (`PROFILE_IMAGE_NOT_FOUND` or `FILE_NOT_FOUND`) if the file is absent on disk.
- **Rationale:** Prevents unhandled stream errors or 500 status codes in Express, ensuring clean 404 responses.

---

### 8. Initial Database Migration Baseline
- **Context:** Section 15 states: *"The app starts from a clean clone with only npm install, .env, npx prisma migrate dev, npm run prisma:seed, npm run dev."*
- **Decision:** Created `prisma/migrations/20261109000000_init/migration.sql` capturing the entire schema (tables, enums, indices, foreign key cascades).
- **Rationale:** Guarantees that running `npx prisma migrate dev` or `npx prisma migrate deploy` succeeds on fresh PostgreSQL instances without manual SQL intervention.

