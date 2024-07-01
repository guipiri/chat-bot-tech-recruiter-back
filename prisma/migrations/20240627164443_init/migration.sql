-- CreateEnum
CREATE TYPE "Status" AS ENUM ('closed', 'open');

-- AlterTable
ALTER TABLE "Answers" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'open';
