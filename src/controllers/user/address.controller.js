import addressModel from "../../models/addressModel.js";
import userModel from "../../modules/admin/user/userModel.js";
import { addressSchema } from "../../validators/addressValidator.js";

export const loadManageAddress = async (req, res,next) => {
  try {
    const user = await userModel.findById(req.session.user);
    const addresses = await addressModel
      .find({ userId: req.session.user })
      .sort({ createdAt: -1 });
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

export const addAddress = async (req, res) => {
  try {
    const { error } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await userModel.findById(req.session.user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const address = { ...req.body, userId: user._id };

    if (req.body.setDefault) {
      await addressModel.updateMany(
        { userId: user._id },
        { $set: { setDefault: false } }
      );
    } else {
      const checkDefault = await addressModel.findOne({
        userId: user._id,
        setDefault: true,
      });
      if (!checkDefault) {
        address.setDefault = true;
      }
    }

    await addressModel.create(address);
    return res.status(200).json({
      success: true,
      message: "The address has been added successfully.",
    });
  } catch (error) {
    console.error("Error on add address", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = await addressModel.findById(addressId);
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address not found",
      });
    }

    const { error } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await userModel.findById(req.session.user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    let updatedAddress = { ...req.body, userId: user._id };
    if (req.body.setDefault) {
      await addressModel.updateMany(
        { userId: user._id },
        { $set: { setDefault: false } }
      );
    } else if (address.setDefault) {
      const anotherAddress = await addressModel.findOne({
        userId: user._id,
        _id: { $ne: addressId },
      });

      if (anotherAddress) {
        await addressModel.updateOne(
          { _id: anotherAddress._id },
          { $set: { setDefault: true } }
        );
      }
    }

    await addressModel.findByIdAndUpdate(
      addressId,
      { ...updatedAddress },
      { runValidators: true }
    );
    return res.status(200).json({
      success: true,
      message: "The address has been Updated successfully.",
    });
  } catch (error) {
    console.error("Error on edit address", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = await addressModel.findById(addressId);
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address not found",
      });
    }
    await addressModel.updateMany(
      { userId: req.session.user },
      { $set: { setDefault: false } }
    );
    await address.updateOne({ setDefault: true });
    res.json({ success: true });
  } catch (error) {
    console.error("Error on add defeault address", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await addressModel.findById(addressId);
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address not found",
      });
    }

    const userId = req.session.user;

    if (address.setDefault) {
      const anotherAddress = await addressModel.findOne({
        userId,
        _id: { $ne: addressId },
      });

      if (anotherAddress) {
        await addressModel.updateOne(
          { _id: anotherAddress._id },
          { $set: { setDefault: true } }
        );
      }
    }

    await addressModel.findByIdAndDelete(addressId);

    return res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
