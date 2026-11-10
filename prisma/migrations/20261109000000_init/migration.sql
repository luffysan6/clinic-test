-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('LAB_REPORT', 'PRESCRIPTION', 'SCAN', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "lastIllness" TEXT,
    "lastIllnessDate" TIMESTAMP(3),
    "pastInjuries" TEXT,
    "currentMedications" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "category" "FileCategory" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOtp_userId_key" ON "EmailOtp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRecord_userId_key" ON "HealthRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordFile_storedName_key" ON "RecordFile"("storedName");

-- CreateIndex
CREATE INDEX "RecordFile_userId_idx" ON "RecordFile"("userId");

-- AddForeignKey
ALTER TABLE "EmailOtp" ADD CONSTRAINT "EmailOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordFile" ADD CONSTRAINT "RecordFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

