/*
  Warnings:

  - The primary key for the `Answers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `chatId` on the `Answers` table. All the data in the column will be lost.
  - Added the required column `threadId` to the `Answers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answers" DROP CONSTRAINT "Answers_pkey",
DROP COLUMN "chatId",
ADD COLUMN     "threadId" TEXT NOT NULL,
ADD CONSTRAINT "Answers_pkey" PRIMARY KEY ("threadId");
