import User from '../models/User.js';

class UserService {
  /**
   * Validate if the currently logged in user (reqUser) has permission to update the target user.
   */
  async validateUpdatePermissions(reqUser, targetUserId, updates) {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new Error('User not found');

    const isAdmin = reqUser.role === 'Admin';
    const isSelf = reqUser._id.toString() === targetUserId.toString();

    // Admin can do anything
    if (isAdmin) return targetUser;

    // Below rules apply to Staff
    
    // 1. Staff cannot edit an Admin
    if (targetUser.role === 'Admin') {
      throw new Error('Staff cannot modify an Admin account');
    }

    // 2. Staff cannot change their own role or permissions
    if (isSelf) {
      if (updates.role && updates.role !== targetUser.role) {
        throw new Error('You cannot change your own role');
      }
      if (updates.permissions) {
        throw new Error('You cannot change your own permissions');
      }
    }

    // 3. Staff cannot change other Staff permissions/role (unless they have some super-staff permission, which we don't have yet)
    if (!isSelf && targetUser.role === 'Staff') {
      if (updates.role || updates.permissions) {
        throw new Error('Staff cannot modify role or permissions of other Staff');
      }
    }

    return targetUser;
  }
}

export default new UserService();
