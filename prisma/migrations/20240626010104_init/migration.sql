-- CreateTable
CREATE TABLE "Answers" (
    "chatId" TEXT NOT NULL,
    "yearsOfExperience" INTEGER,
    "isWillingToWorkWithRuby" BOOLEAN,
    "isWillingToWorkOnSite" BOOLEAN,
    "interviewPossibleDates" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answers_pkey" PRIMARY KEY ("chatId")
);
