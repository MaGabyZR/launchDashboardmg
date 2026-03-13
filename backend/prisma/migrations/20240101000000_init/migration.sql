-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('X', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'SCRAPED', 'YC_API');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ycBatch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fundraise" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "announcementDate" TIMESTAMP(3) NOT NULL,
    "source" "DataSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fundraise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchPost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "url" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dataSource" "DataSource" NOT NULL,
    "lastScraped" TIMESTAMP(3),
    "scrapeFailed" BOOLEAN NOT NULL DEFAULT false,
    "scrapeError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInfo" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "xHandle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_ycBatch_idx" ON "Company"("ycBatch");

-- CreateIndex
CREATE UNIQUE INDEX "Fundraise_companyId_key" ON "Fundraise"("companyId");

-- CreateIndex
CREATE INDEX "Fundraise_companyId_idx" ON "Fundraise"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchPost_url_key" ON "LaunchPost"("url");

-- CreateIndex
CREATE INDEX "LaunchPost_companyId_idx" ON "LaunchPost"("companyId");

-- CreateIndex
CREATE INDEX "LaunchPost_platform_idx" ON "LaunchPost"("platform");

-- CreateIndex
CREATE INDEX "LaunchPost_dataSource_idx" ON "LaunchPost"("dataSource");

-- CreateIndex
CREATE UNIQUE INDEX "ContactInfo_companyId_key" ON "ContactInfo"("companyId");

-- CreateIndex
CREATE INDEX "ContactInfo_companyId_idx" ON "ContactInfo"("companyId");

-- AddForeignKey
ALTER TABLE "Fundraise" ADD CONSTRAINT "Fundraise_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaunchPost" ADD CONSTRAINT "LaunchPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInfo" ADD CONSTRAINT "ContactInfo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
