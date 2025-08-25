// lib/prisma.ts
// Import PrismaClient from the generated Prisma client package.
import { PrismaClient } from '@prisma/client'

// Use a global variable to store the PrismaClient instance.
// This prevents creating multiple instances during development with hot reloading.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Create a single PrismaClient instance or reuse the existing one.
// In production, always create a new instance.
// In development, reuse the instance stored in the global object.
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// In development, assign the PrismaClient instance to the global object.
// This avoids exhausting database connections due to repeated instantiation.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export the PrismaClient instance for use throughout the app.
export default prisma
