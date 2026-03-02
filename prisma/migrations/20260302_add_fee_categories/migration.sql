-- CreateTable
CREATE TABLE "fee_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feeType" "FeeType" NOT NULL DEFAULT 'MISC',
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,

    CONSTRAINT "fee_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fee_categories_institutionId_name_key" ON "fee_categories"("institutionId", "name");

-- CreateIndex
CREATE INDEX "fee_categories_institutionId_idx" ON "fee_categories"("institutionId");

-- AddForeignKey
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
