import { AppError } from "../../shared/utils/app.error.js";
import { AddressMessages } from "../../shared/constants/messages/addressMessages.js";
import { UserMessages } from "../../shared/constants/messages/userMessages.js";
import userModel from "../user/user.model.js";
import {
  findAddressesByUser,
  findAddressById,
  createAddress,
  updateAddressById,
  deleteAddressById,
  unsetDefaultAddress,
  findAnotherAddress,
} from "./address.repo.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

// Address service - business logic for addresses

// Load manage address data
export const loadManageAddressService = async (user) => {
  if (!user) {
    throw new AppError(UserMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const addresses = await findAddressesByUser(user._id);
  return { user, addresses };
};

// Add a new address
export const addAddressService = async (user, body) => {
  if (!user) {
    throw new AppError(UserMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const addressData = { ...body, userId:user._id };

  if (body.setDefault) {
    await unsetDefaultAddress(user._id);
  } else {
    const checkDefault = await findAnotherAddress(user._id, null);
    if (!checkDefault) addressData.setDefault = true;
  }

  await createAddress(addressData);
  return true;
};

// Edit an address
export const editAddressService = async (user, addressId, body) => {
  const address = await findAddressById(addressId);
  if (!address) {
    throw new AppError(AddressMessages.ADDRESS_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (!user) {
    throw new AppError(AddressMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const updatedAddress = { ...body, userId:user._id };

  if (body.setDefault) {
    await unsetDefaultAddress(user._id);
    updatedAddress.setDefault = true;
  } else if (address.setDefault) {
    const anotherAddress = await findAnotherAddress(user._id, addressId);
    if (anotherAddress) {
      await updateAddressById(anotherAddress._id, { setDefault: true });
    }
  }

  await updateAddressById(addressId, updatedAddress);
  return true;
};

// Set default address
export const setDefaultAddressService = async (user, addressId) => {
  const address = await findAddressById(addressId);
  if (!address) {
    throw new AppError(AddressMessages.ADDRESS_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  await unsetDefaultAddress(user._id);
  await updateAddressById(addressId, { setDefault: true });

  return true;
};

// Delete an address
export const deleteAddressService = async (user, addressId) => {
  const address = await findAddressById(addressId);
  if (!address) {
    throw new AppError(AddressMessages.ADDRESS_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (address.setDefault) {
    const another = await findAnotherAddress(user._id, addressId);
    if (another) {
      await updateAddressById(another._id, { setDefault: true });
    }
  }

  await deleteAddressById(addressId);
  return true;
};
