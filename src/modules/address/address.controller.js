import { addressSchema } from "./addressValidator.js";
import {
  loadManageAddressService,
  addAddressService,
  editAddressService,
  setDefaultAddressService,
  deleteAddressService,
} from "./address.service.js";

// LOAD LIST PAGE
export const loadManageAddress = async (req, res, next) => {
  try {
    const { user, addresses } = await loadManageAddressService(req.session.user);

    res.render("user/manageAddress", {
      pageTitle: "Manage Address",
      pageJs: "manageAddress",
      user,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

// ADD ADDRESS
export const addAddress = async (req, res) => {
  try {
    const { error } = addressSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    await addAddressService(req.session.user, req.body);

    res.json({ success: true, message: "The address has been added successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// EDIT ADDRESS
export const editAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { error } = addressSchema.validate(req.body);

    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    await editAddressService(req.session.user, addressId, req.body);

    res.json({ success: true, message: "The address has been updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SET DEFAULT
export const setDefaultAddress = async (req, res) => {
  try {
    await setDefaultAddressService(req.session.user, req.params.addressId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE ADDRESS
export const deleteAddress = async (req, res) => {
  try {
    await deleteAddressService(req.session.user, req.params.addressId);

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
