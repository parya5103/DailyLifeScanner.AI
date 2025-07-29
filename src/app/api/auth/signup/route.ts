import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail, generateToken, createSession } from '@/lib/auth/utils';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, profile } = await request.json();

    if (!email || !password || !profile) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and profile are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate profile type
    const validProfiles = ['student', 'employee', 'investor', 'homemaker'];
    if (!validProfiles.includes(profile)) {
      return NextResponse.json(
        { success: false, message: 'Invalid profile type' },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser(email, password, name);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Create session
    await createSession(user.id, token);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
