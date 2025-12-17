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

// LOAD LIST PAGE
export const loadManageAddress = async (req, res) => {
  const { user, addresses } = await loadManageAddressService(req.session.user);

  res.status(HttpStatus.OK).render("user/manageAddress", {
    pageTitle: "Manage Address",
    pageJs: "manageAddress",
    user,
    addresses,
  });
};

// ADD ADDRESS
export const addAddress = async (req, res) => {
  const { error } = addressSchema.validate(req.body);
  if (error) {
    const err = new Error(error.details[0].message);
    err.status = HttpStatus.BAD_REQUEST;
    throw err;
  }

  await addAddressService(req.session.user, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: AddressMessages.ADDRESS_ADDED,
  });
};

// EDIT ADDRESS
export const editAddress = async (req, res) => {
  const { addressId } = req.params;

  const { error } = addressSchema.validate(req.body);
  if (error) {
    const err = new Error(error.details[0].message);
    err.status = HttpStatus.BAD_REQUEST;
    throw err;
  }

  await editAddressService(req.session.user, addressId, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: AddressMessages.ADDRESS_UPDATED,
  });
};

// SET DEFAULT ADDRESS
export const setDefaultAddress = async (req, res) => {
  await setDefaultAddressService(req.session.user, req.params.addressId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: AddressMessages.DEFAULT_ADDRESS_UPDATED,
  });
};

// DELETE ADDRESS
export const deleteAddress = async (req, res) => {
  await deleteAddressService(req.session.user, req.params.addressId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: AddressMessages.ADDRESS_DELETED,
  });
};
