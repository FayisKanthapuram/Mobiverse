import User from "../user/user.model.js";

// Auth repo - DB helpers for authentication

// Find user by email
export const findUserByEmail = (email) => User.findOne({ email });

// Create new user document
export const createUser = (data) => User.create(data);

// Update user's password
export const updateUserPassword = async (email, hashedPassword) => {
  const user = await User.findOne({ email });
  user.password = hashedPassword;
  return user.save();
};
