import { AppError } from "../../shared/utils/app.error.js";
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

/* ----------------------------------------------------
   LOAD MANAGE ADDRESS
---------------------------------------------------- */
export const loadManageAddressService = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const addresses = await findAddressesByUser(userId);
  return { user, addresses };
};

/* ----------------------------------------------------
   ADD ADDRESS
---------------------------------------------------- */
export const addAddressService = async (userId, body) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const addressData = { ...body, userId };

  if (body.setDefault) {
    await unsetDefaultAddress(userId);
  } else {
    const checkDefault = await findAnotherAddress(userId, null);
    if (!checkDefault) addressData.setDefault = true;
  }

  await createAddress(addressData);
  return true;
};

/* ----------------------------------------------------
   EDIT ADDRESS
---------------------------------------------------- */
export const editAddressService = async (userId, addressId, body) => {
  const address = await findAddressById(addressId);
  if (!address) {
    throw new AppError("Address not found", 404);
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updatedAddress = { ...body, userId };

  if (body.setDefault) {
    await unsetDefaultAddress(userId);
    updatedAddress.setDefault = true;
  } else if (address.setDefault) {
    const anotherAddress = await findAnotherAddress(userId, addressId);
    if (anotherAddress) {
      await updateAddressById(anotherAddress._id, { setDefault: true });
    }
  }

  await updateAddressById(addressId, updatedAddress);
  return true;
};

/* ----------------------------------------------------
   SET DEFAULT ADDRESS
---------------------------------------------------- */
export const setDefaultAddressService = async (userId, addressId) => {
  const address = await findAddressById(addressId);
  if (!address) {
    throw new AppError("Address not found", 404);
  }

  await unsetDefaultAddress(userId);
  await updateAddressById(addressId, { setDefault: true });

  return true;
};

/* ----------------------------------------------------
   DELETE ADDRESS
---------------------------------------------------- */
export const deleteAddressService = async (userId, addressId) => {
  const address = await findAddressById(addressId);
  if (!address) {
    throw new AppError("Address not found", 404);
  }

  if (address.setDefault) {
    const another = await findAnotherAddress(userId, addressId);
    if (another) {
      await updateAddressById(another._id, { setDefault: true });
    }
  }

  await deleteAddressById(addressId);
  return true;
};
