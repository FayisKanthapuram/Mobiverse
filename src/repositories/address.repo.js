import addressModel from "../models/addressModel.js";

export const findUserAddresses = (userId) => {
  return addressModel.find({ userId });
};

export const findAddressById = (addressId) => {
  return addressModel.findById(addressId).lean();
};