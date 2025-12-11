import { handleReturnRequestService, loadOrderDetailsService, loadOrdersService, markItemReturnedService, updateOrderStatusService } from "../services/index.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const loadOrders = async (req, res, next) => {
  try {
    const data = await loadOrdersService(req.query);
    res.status(HttpStatus.OK).render("admin/orders/orders", {
      pageTitle: "Orders",
      pageCss: "orders",
      pageJs: "orders",

      // Data from service
      analytics: data.analytics,
      orders: data.orders,

      // Pagination
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalOrders: data.pagination.totalOrders,
      limit: data.pagination.limit,

      // Filters
      sortFilter: data.filters.sortFilter,
      statusFilter: data.filters.statusFilter,
      paymentStatusFilter: data.filters.paymentStatusFilter,
      searchQuery: data.filters.searchQuery,
    });
  } catch (error) {
    next(error);
  }
};

export const loadOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await loadOrderDetailsService(orderId);

    res.status(HttpStatus.OK).render("admin/orders/orderDetails", {
      pageTitle: "Orders",
      pageJs: "orderDetails",
      pageCss: "orderDetails",
      order,
    });

  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const updatedOrder = await updateOrderStatusService(orderId, status);

    res.status(HttpStatus.OK).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.log("Order Status Update Error:", error);

    res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error while updating order status",
    });
  }
};

// Handle Return Request (Approve / Reject)
export const handleReturnRequest = async (req, res) => {
  try {
    const orderId = req.params.id;

    const updatedOrder = await handleReturnRequestService(orderId, req.body);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: `Return request ${req.body.action}d successfully`,
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Return Request Error:", error);

    return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error while processing return request",
    });
  }
};


// Mark Item Returned (Admin confirms receipt of returned item)
export const markItemReturned = async (req, res) => {
  try {
    const orderId = req.params.id;

    const updatedOrder = await markItemReturnedService(orderId, req.body);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: "Item marked returned",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Mark Item Returned Error:", error);

    return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error while marking item returned",
    });
  }
};


// Payment Status Update Controller
// export const updatePaymentStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { paymentStatus } = req.body;

//     // Validate payment status
//     const validPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

//     if (!validPaymentStatuses.includes(paymentStatus)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid payment status'
//       });
//     }

//     // Find and update the order
//     const order = await Order.findById(id);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Store old payment status for logging
//     const oldPaymentStatus = order.paymentStatus;

//     // Update payment status
//     order.paymentStatus = paymentStatus;

//     // Additional logic based on payment status
//     if (paymentStatus === 'Paid') {
//       console.log(`Payment marked as paid for order: ${order.id}`);

//       // If COD order is marked as paid after delivery
//       if (order.paymentMethod === 'cod' && order.orderStatus === 'Delivered') {
//         console.log('COD payment received and marked as paid');
//       }
//     } else if (paymentStatus === 'Refunded') {
//       console.log(`Payment refunded for order: ${order.id}`);

//       // Optional: Add amount back to user's wallet
//       // Uncomment if you have wallet functionality
//       /*
//       const User = mongoose.model('User');
//       const user = await User.findById(order.userId);
//       if (user) {
//         user.wallet = (user.wallet || 0) + order.finalAmount;

//         // Add wallet transaction record
//         if (!user.walletTransactions) {
//           user.walletTransactions = [];
//         }
//         user.walletTransactions.push({
//           amount: order.finalAmount,
//           type: 'credit',
//           description: `Refund for order ${order.id}`,
//           id: order._id,
//           date: new Date()
//         });

//         await user.save();
//         console.log(`Refunded ₹${order.finalAmount} to user wallet`);
//       }
//       */
//     } else if (paymentStatus === 'Failed') {
//       console.log(`Payment failed for order: ${order.id}`);
//     }

//     await order.save();

//     res.json({
//       success: true,
//       message: `Payment status updated from ${oldPaymentStatus} to ${paymentStatus}`,
//       order
//     });

//   } catch (error) {
//     console.error('Error updating payment status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while updating payment status'
//     });
//   }
// };
