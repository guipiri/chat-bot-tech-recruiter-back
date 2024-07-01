import { prisma } from './db/index.js';

export default class FunctionCallingList {
  static async saveYearsOfExperience(threadId, { yearsOfExperience }) {
    await prisma.answers.upsert({
      where: { threadId },
      update: { yearsOfExperience },
      create: { yearsOfExperience, threadId },
    });
    return { threadId, yearsOfExperience };
  }

  static async saveFavoriteProgrammingLanguage(
    threadId,
    { favoriteProgrammingLanguage },
  ) {
    await prisma.answers.upsert({
      where: { threadId },
      update: { favoriteProgrammingLanguage },
      create: { favoriteProgrammingLanguage, threadId },
    });
    return { threadId, favoriteProgrammingLanguage };
  }

  static async saveIsWillingToWorkWithRuby(
    threadId,
    { isWillingToWorkWithRuby },
  ) {
    await prisma.answers.upsert({
      where: { threadId },
      update: { isWillingToWorkWithRuby },
      create: { isWillingToWorkWithRuby, threadId },
    });
    return { threadId, isWillingToWorkWithRuby };
  }

  static async saveIsWillingToWorkOnSite(threadId, { isWillingToWorkOnSite }) {
    await prisma.answers.upsert({
      where: { threadId },
      update: { isWillingToWorkOnSite },
      create: { isWillingToWorkOnSite, threadId },
    });
    return { threadId, isWillingToWorkOnSite };
  }

  static async saveInterviewPossibleDates(
    threadId,
    { interviewPossibleDates },
  ) {
    await prisma.answers.upsert({
      where: { threadId },
      update: { interviewPossibleDates },
      create: { interviewPossibleDates, threadId },
    });
    return { threadId, interviewPossibleDates };
  }
}
