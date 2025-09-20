// Jest setup file for WFG Git Log Viewer tests

// Mock Prisma Client for tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    dailySummary: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Mock simple-git for tests
jest.mock('simple-git', () => ({
  simpleGit: jest.fn(() => ({
    log: jest.fn(),
    checkIsRepo: jest.fn(),
  })),
}));

// Set test environment variables
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';
