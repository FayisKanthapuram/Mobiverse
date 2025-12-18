import { findOrderById, saveOrder } from "../../repo/order.repo.js";
import {
  findProductById,
  saveProduct,
} from "../../../product/repo/product.repo.js";
import {
  findVariantById,
  saveVariant,
} from "../../../product/repo/variant.repo.js";
import {
  findWalletByUserId,
  updateWalletBalanceAndCredit,
} from "../../../wallet/repo/wallet.repo.js";
import { updateUserWalletBalance } from "../../../user/user.repo.js";
import { createLedgerEntry } from "../../../wallet/repo/wallet.ledger.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { OrderMessages } from "../../../../shared/constants/messages/orderMessages.js";

export const markItemReturnedService = async (orderId, body) => {
  const { itemId } = body;
  if (!itemId) {
    throw new AppError(OrderMessages.MISSING_ITEM_ID, HttpStatus.BAD_REQUEST);
  }

  const order = await findOrderById(orderId);
  if (!order) {
    throw new AppError(OrderMessages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const item = order.orderedItems.find((i) => i._id.toString() === itemId);

  if (!item) {
    throw new AppError(OrderMessages.ORDERED_ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (item.itemStatus === "Returned") {
    throw new AppError(
      OrderMessages.ITEM_ALREADY_MARKED_RETURNED,
      HttpStatus.BAD_REQUEST
    );
  }

  const variant = await findVariantById(item.variantId);
  const product = await findProductById(item.productId);

  if (!variant || !product) {
    throw new AppError(OrderMessages.PRODUCT_OR_VARIANT_NOT_FOUND, HttpStatus.BAD_REQUEST);
  }

  product.totalStock += item.quantity;
  variant.stock += item.quantity;

  await saveProduct(product);
  await saveVariant(variant);

  const now = new Date();
  item.itemStatus = "Returned";
  item.itemTimeline ||= {};
  item.itemTimeline.returnedAt = now;

  const refundAmount = item.price - item.couponShare - item.offer;

  if (order.paymentStatus === "Paid") {
    await updateWalletBalanceAndCredit(order.userId, refundAmount);
    const wallet = await findWalletByUserId(order.userId);
    await updateUserWalletBalance(order.userId, wallet.balance);

    await createLedgerEntry({
      walletId: wallet._id,
      userId: order.userId,
      amount: refundAmount,
      type: "CREDIT",
      referenceId: order.orderId,
      note: `Refund of ₹${refundAmount} for order ${order.orderId}`,
      balanceAfter: wallet.balance,
    });
  }

  const allReturnedOrCancelled = order.orderedItems.every(
    (i) => i.itemStatus === "Cancelled" || i.itemStatus === "Returned"
  );

  if (allReturnedOrCancelled) {
    order.paymentStatus = "Refunded";
    order.orderStatus = "Returned";
    order.statusTimeline ||= {};
    order.statusTimeline.returnedAt = now;
  }

  order.markModified("orderedItems");
  await saveOrder(order);

  return order;
};
