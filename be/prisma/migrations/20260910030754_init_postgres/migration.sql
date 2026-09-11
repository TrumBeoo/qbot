-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('email', 'google', 'facebook');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('user', 'bot');

-- CreateEnum
CREATE TYPE "LocationCategory" AS ENUM ('attraction', 'hotel', 'restaurant', 'beach', 'mountain', 'cave', 'island', 'other');

-- CreateEnum
CREATE TYPE "LocationImageType" AS ENUM ('main', 'gallery', 'thumbnail');

-- CreateEnum
CREATE TYPE "DataFileStatus" AS ENUM ('active', 'archived');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'email',
    "googleId" TEXT,
    "facebookId" TEXT,
    "profilePicture" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "businessInfo" JSONB,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "profilePicture" TEXT,
    "businessInfo" JSONB,
    "apiToken" TEXT,
    "refreshToken" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL DEFAULT 'New Conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "language" VARCHAR(10) NOT NULL DEFAULT 'vi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nameEn" VARCHAR(255),
    "category" "LocationCategory" NOT NULL DEFAULT 'attraction',
    "district" VARCHAR(100),
    "description" TEXT,
    "descriptionEn" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "keywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_images" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "imageType" "LocationImageType" NOT NULL DEFAULT 'gallery',
    "caption" VARCHAR(255),
    "captionEn" VARCHAR(255),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_files" (
    "id" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "fileHash" VARCHAR(64) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "DataFileStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebookId_key" ON "users"("facebookId");

-- CreateIndex
CREATE INDEX "users_provider_idx" ON "users"("provider");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_apiToken_key" ON "admins"("apiToken");

-- CreateIndex
CREATE UNIQUE INDEX "admins_refreshToken_key" ON "admins"("refreshToken");

-- CreateIndex
CREATE INDEX "conversations_userId_updatedAt_idx" ON "conversations"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "locations_category_idx" ON "locations"("category");

-- CreateIndex
CREATE INDEX "locations_district_idx" ON "locations"("district");

-- CreateIndex
CREATE INDEX "location_images_locationId_isActive_displayOrder_idx" ON "location_images"("locationId", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "data_files_filename_key" ON "data_files"("filename");

-- CreateIndex
CREATE INDEX "data_files_status_idx" ON "data_files"("status");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_images" ADD CONSTRAINT "location_images_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
