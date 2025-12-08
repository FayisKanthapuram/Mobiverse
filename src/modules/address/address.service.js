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

export const loadManageAddressService = async (userId) => {
  const user = await userModel.findById(userId);
  const addresses = await findAddressesByUser(userId);
  return { user, addresses };
};

export const addAddressService = async (userId, body) => {
  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");

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

export const editAddressService = async (userId, addressId, body) => {
  const address = await findAddressById(addressId);
  if (!address) throw new Error("Address not found");

  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");

  let updatedAddress = { ...body, userId };

  if (body.setDefault) {
    await unsetDefaultAddress(userId);
  } else if (address.setDefault) {
    const anotherAddress = await findAnotherAddress(userId, addressId);
    if (anotherAddress) {
      await updateAddressById(anotherAddress._id, { setDefault: true });
    }
  }

  await updateAddressById(addressId, updatedAddress);
  return true;
};

export const setDefaultAddressService = async (userId, addressId) => {
  const address = await findAddressById(addressId);
  if (!address) throw new Error("Address not found");

  await unsetDefaultAddress(userId);
  await updateAddressById(addressId, { setDefault: true });

  return true;
};

export const deleteAddressService = async (userId, addressId) => {
  const address = await findAddressById(addressId);
  if (!address) throw new Error("Address not found");

  if (address.setDefault) {
    const another = await findAnotherAddress(userId, addressId);
    if (another) {
      await updateAddressById(another._id, { setDefault: true });
    }
  }

  await deleteAddressById(addressId);
  return true;
};
