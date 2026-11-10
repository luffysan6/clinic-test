# Clinic Management Backend API

A REST API for a clinic management system built with Node.js, Express, PostgreSQL, and Prisma.

---

## Tech Stack

- **Runtime:** Node.js 20+ (CommonJS: `require`, `module.exports`)
- **Framework:** Express 4
- **Database:** PostgreSQL
- **ORM:** Prisma (`@prisma/client`, `prisma`)
- **Authentication:** `jsonwebtoken` (Bearer access token only), `bcryptjs` (Cost 10)
- **Validation:** `zod`
- **File Uploads:** `multer` (Disk storage & Cloudinary cloud storage)
- **Cloud Media:** `cloudinary` (Profile image cloud storage)
- **Email:** `nodemailer` over SMTP
- **Security:** `helmet`, `cors`, `express-rate-limit`
- **Development:** `nodemon`

---

## Folder Structure

```
clinic-api/
  prisma/
    migrations/        # Database migration files
    schema.prisma      # Prisma schema definitions
    seed.js            # Initial admin seed script
  src/
    app.js             # Express app setup, middlewares, and route mounting
    server.js          # Server entry point
    config/
      env.js           # Environment variable validation & exports
      prisma.js        # PrismaClient singleton instance
      cloudinary.js    # Cloudinary v2 configuration
      mailer.js        # Nodemailer SMTP transporter
      multer.js        # Multer upload configuration & filters
    middlewares/
      auth.js          # JWT authentication middleware
      requireRole.js   # Role-based access control middleware
      validate.js      # Zod validation wrapper middleware
      errorHandler.js  # Centralized error handler & 404 handler
      rateLimiters.js  # Rate limiting configurations
    routes/
      index.js         # Mounts all sub-routers under /api
      auth.routes.js   # Authentication routes (/api/auth)
      me.routes.js     # User profile routes (/api/me)
      healthRecord.routes.js # Health record & file routes (/api/health-record)
      admin.routes.js  # Admin management routes (/api/admin)
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
      cloudinary.service.js # Cloudinary upload and deletion operations
      healthRecord.service.js
      file.service.js
      admin.service.js
    validators/
      auth.validator.js
      me.validator.js
      healthRecord.validator.js
      admin.validator.js
    utils/
      AppError.js      # Custom error class
      asyncHandler.js  # Async route handler wrapper
      logger.js        # Standardized logger
      response.js      # ok() response helper
      serializers.js   # Safe user serialization
      token.js         # JWT signing and verification
    constants/
      index.js         # Roles, limits, error codes, and allowed types
  uploads/             # File storage (gitignored)
    profile/           # Profile images
    records/           # Medical record attachments
  .env.example         # Environment template
  .gitignore           # Git ignore configuration
  package.json         # Dependencies & scripts
  README.md            # Project documentation
  DECISIONS.md         # Architecture and technical decisions
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env 
```

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `PORT` | Port for the HTTP server | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/clinic_db` |
| `JWT_SECRET` | Secret key for signing JWTs | `change_me_to_a_long_random_string` |
| `JWT_EXPIRES_IN` | JWT expiration duration | `1d` |
| `ADMIN_EMAIL` | Initial admin account email | `admin@clinic.com` |
| `ADMIN_PASSWORD` | Initial admin account password | `ChangeMe@123` |
| `ADMIN_NAME` | Initial admin display name | `Clinic Admin` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `you@gmail.com` |
| `SMTP_PASS` | SMTP password / App password | `app_password` |
| `MAIL_FROM` | Outgoing email `From` address | `Clinic <you@gmail.com>` |
| `OTP_EXPIRY_MINUTES`| OTP expiration duration in minutes | `10` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name (optional) | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key (optional) | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret (optional) | `your_api_secret` |

---

## Quickstart & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Ensure `.env` exists with your database and JWT settings.

3. **Run Database Migrations:**
   ```bash
   npm run prisma:migrate
   # Or for automated deployment:
   # npx prisma migrate deploy
   ```

4. **Seed the Admin Account:**
   ```bash
   npm run prisma:seed
   ```
   *Creates the initial ADMIN user specified by `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`.*

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **Start the Production Server:**
   ```bash
   npm start
   ```

---

## API Endpoints Reference

All routes are mounted under the `/api` prefix.

### Public & Health
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health-check endpoint, returns `{ success: true, data: { status: 'ok' } }` | Public |

### Authentication (`/api/auth`)
| Method | Endpoint | Body Parameters | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `name`, `email`, `password` | Register a new patient account (creates OTP sent via email) |
| `POST` | `/api/auth/verify-otp` | `email`, `otp` | Verify 6-digit OTP, verifies user & returns JWT |
| `POST` | `/api/auth/resend-otp` | `email` | Resend verification OTP via email (60s cooldown) |
| `POST` | `/api/auth/login` | `email`, `password` | Authenticate user & return JWT token |

### Profile (`/api/me`)
*Requires `Authorization: Bearer <token>`*
| Method | Endpoint | Body / Request | Description |
|---|---|---|---|
| `GET` | `/api/me` | None | Get authenticated user's profile |
| `PATCH`| `/api/me` | `{ name }` (strict, no extra fields) | Update user's name |
| `PATCH`| `/api/me/password`| `{ currentPassword, newPassword }` | Change account password |
| `PUT` | `/api/me/profile-image` | Multipart form (`image` field) | Upload or replace profile image (jpeg/png/webp, max 2MB) |
| `GET` | `/api/me/profile-image` | None | Stream current profile image |
| `DELETE`| `/api/me/profile-image`| None | Delete current profile image from disk & DB |

### Health Record & Files (`/api/health-record`)
*Requires `Authorization: Bearer <token>` and `role: USER`*
| Method | Endpoint | Body / Request | Description |
|---|---|---|---|
| `POST` | `/api/health-record` | `age`, `gender`, `bloodGroup`, optional fields | Create patient health record (1 per user) |
| `GET` | `/api/health-record` | None | Read own health record |
| `PATCH`| `/api/health-record` | At least 1 valid field | Partial update of health record |
| `DELETE`| `/api/health-record`| None | Delete health record |
| `POST` | `/api/health-record/files`| Multipart form (`files`, max 5, optional `category`)| Upload medical records (max 10 total per user, 5MB each) |
| `GET` | `/api/health-record/files`| None | List own medical file metadata |
| `GET` | `/api/health-record/files/:fileId`| None (UUID param) | Download own medical file |
| `DELETE`| `/api/health-record/files/:fileId`| None (UUID param) | Delete own medical file |

### Admin (`/api/admin`)
*Requires `Authorization: Bearer <token>` and `role: ADMIN`*
| Method | Endpoint | Query / Param | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | `page` (default 1), `limit` (default 10, max 50), `search` (name or email) | List paginated users with total count |
| `GET` | `/api/admin/users/:userId`| `:userId` (UUID) | View user profile, health record, and file metadata |
| `GET` | `/api/admin/users/:userId/profile-image` | `:userId` (UUID) | Stream specified user's profile image |
| `GET` | `/api/admin/users/:userId/files/:fileId` | `:userId`, `:fileId` (UUID) | Download specified user's medical file |
| `DELETE`| `/api/admin/users/:userId`| `:userId` (UUID) | Delete user, all database rows, and files from disk |

---

## Response & Error Format

All responses strictly follow one of two JSON structures:

**Success:**
```json
{
  "success": true,
  "message": "optional text",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error message",
    "details": []
  }
}
```

---

## Running Smoke Checklist

To verify all 16 checklist items end-to-end against the database:

```bash
node scratch/smoke_test.js
```

