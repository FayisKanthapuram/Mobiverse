import addressModel from "./address.model.js";

export const findUserAddresses = (userId) => {
  return addressModel.find({ userId });
};

export const findAddressesByUser = (userId) => {
  return addressModel.find({ userId }).sort({ createdAt: -1 });
};

export const findAddressById = (id) => {
  return addressModel.findById(id);
};

export const createAddress = (data) => {
  return addressModel.create(data);
};

export const updateAddressById = (id, data) => {
  return addressModel.findByIdAndUpdate(id, data, { runValidators: true });
};

export const deleteAddressById = (id) => {
  return addressModel.findByIdAndDelete(id);
};

export const unsetDefaultAddress = (userId) => {
  return addressModel.updateMany({ userId }, { $set: { setDefault: false } });
};

export const findAnotherAddress = (userId, excludeId) => {
  return addressModel.findOne({ userId, _id: { $ne: excludeId } });
};
