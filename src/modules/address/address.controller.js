import { addressSchema } from "./addressValidator.js";
import {
  loadManageAddressService,
  addAddressService,
  editAddressService,
  setDefaultAddressService,
  deleteAddressService,
} from "./address.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AddressMessages } from "../../shared/constants/messages/addressMessages.js";
import { AppError } from "../../shared/utils/app.error.js";

// Address controller - handle address-related HTTP requests

// Render manage address page
export const loadManageAddress = async (req, res) => {
  const { user, addresses } = await loadManageAddressService(req?.user);

  res.status(HttpStatus.OK).render("user/manageAddress", {
    pageTitle: "Manage Address",
    pageJs: "manageAddress",
    user,
    addresses,
  });
};

// Add a new address
export const addAddress = async (req, res) => {
  const { error } = addressSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await addAddressService(req?.user, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: AddressMessages.ADDRESS_ADDED,
  });
};

// Edit an existing address
export const editAddress = async (req, res) => {
  const { addressId } = req.params;

  const { error } = addressSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await editAddressService(req?.user, addressId, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: AddressMessages.ADDRESS_UPDATED,
  });
};

// Set an address as default
export const setDefaultAddress = async (req, res) => {
  await setDefaultAddressService(req?.user, req.params.addressId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: AddressMessages.DEFAULT_ADDRESS_UPDATED,
  });
};

// Delete an address
export const deleteAddress = async (req, res) => {
  await deleteAddressService(req?.user, req.params.addressId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: AddressMessages.ADDRESS_DELETED,
  });
};
