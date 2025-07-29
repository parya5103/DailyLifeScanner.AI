import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function createUser(email: string, password: string, name?: string) {
  const hashedPassword = await hashPassword(password);
  
  return db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      preferences: {
        create: {
          profile: 'student',
          categories: '[]',
          language: 'en',
          timezone: 'UTC',
          notifications: true,
        },
      },
    },
    include: {
      preferences: true,
    },
  });
}

export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    include: {
      preferences: true,
      sessions: true,
    },
  });
}

export async function findUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      preferences: true,
    },
  });
}

export async function createSession(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  return db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

export async function deleteSession(token: string) {
  return db.session.delete({
    where: { token },
  });
}

export async function deleteAllUserSessions(userId: string) {
  return db.session.deleteMany({
    where: { userId },
  });
}
