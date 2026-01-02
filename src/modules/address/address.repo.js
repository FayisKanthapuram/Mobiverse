import addressModel from "./address.model.js";

// Address repository - DB operations for addresses

// Find all addresses for a user (no sorting)
export const findUserAddresses = (userId) => {
  return addressModel.find({ userId });
};

// Find addresses for a user sorted by creation date
export const findAddressesByUser = (userId) => {
  return addressModel.find({ userId }).sort({ createdAt: -1 });
};

// Find a single address by id
export const findAddressById = (id) => {
  return addressModel.findById(id);
};

// Create a new address document
export const createAddress = (data) => {
  return addressModel.create(data);
};

// Update address by id
export const updateAddressById = (id, data) => {
  return addressModel.findByIdAndUpdate(id, data, { runValidators: true });
};

// Delete address by id
export const deleteAddressById = (id) => {
  return addressModel.findByIdAndDelete(id);
};

// Unset default flag for all addresses of a user
export const unsetDefaultAddress = (userId) => {
  return addressModel.updateMany({ userId }, { $set: { setDefault: false } });
};

// Find another address for a user excluding one id
export const findAnotherAddress = (userId, excludeId) => {
  return addressModel.findOne({ userId, _id: { $ne: excludeId } });
};
