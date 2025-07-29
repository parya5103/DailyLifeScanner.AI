import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth/utils';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Find user by ID
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get update data
    const updateData = await request.json();

    // Validate profile type if provided
    if (updateData.profile) {
      const validProfiles = ['student', 'employee', 'investor', 'homemaker'];
      if (!validProfiles.includes(updateData.profile)) {
        return NextResponse.json(
          { success: false, message: 'Invalid profile type' },
          { status: 400 }
        );
      }
    }

    // Update user name if provided
    if (updateData.name !== undefined) {
      await db.user.update({
        where: { id: user.id },
        data: { name: updateData.name },
      });
    }

    // Update user preferences
    const preferencesUpdate: any = {};
    
    if (updateData.profile !== undefined) {
      preferencesUpdate.profile = updateData.profile;
    }
    if (updateData.categories !== undefined) {
      preferencesUpdate.categories = Array.isArray(updateData.categories) 
        ? JSON.stringify(updateData.categories)
        : updateData.categories;
    }
    if (updateData.interests !== undefined) {
      preferencesUpdate.interests = updateData.interests;
    }
    if (updateData.language !== undefined) {
      preferencesUpdate.language = updateData.language;
    }
    if (updateData.timezone !== undefined) {
      preferencesUpdate.timezone = updateData.timezone;
    }
    if (updateData.notifications !== undefined) {
      preferencesUpdate.notifications = updateData.notifications;
    }
    if (updateData.telegramChat !== undefined) {
      preferencesUpdate.telegramChat = updateData.telegramChat;
    }

    // Update preferences
    await db.userPreference.update({
      where: { userId: user.id },
      data: preferencesUpdate,
    });

    // Get updated user data
    const updatedUser = await findUserById(user.id);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        preferences: updatedUser!.preferences,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}
