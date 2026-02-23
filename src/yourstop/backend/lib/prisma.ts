import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger';

const logger = createLogger();

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.__prisma = prisma;
}

// Prisma event listeners removed due to TypeScript compatibility issues
// TODO: Re-implement with proper typing when Prisma types are updated

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
