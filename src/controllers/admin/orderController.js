import Order from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import variantModel from "../../models/variantModel.js";

export const loadOrders = async (req, res) => {
  const currentPage = parseInt(req.query.page) || 1;
  const statusFilter=req.query.status||'';
  const paymentStatusFilter=req.query.paymentStatus||'';
  const sortFilter=req.query.sort||'recent';
  const searchQuery=req.query.search||'';

  const query={};
  if(statusFilter){
    query.orderStatus=statusFilter;
  }
  if(paymentStatusFilter){
    query.paymentStatus=paymentStatusFilter;
  }
  const sort={};
  if(sortFilter==='recent'){
    sort.createdAt=-1;
  }else if(sortFilter==='oldest'){
    sort.createdAt=1;
  }else if(sortFilter==='amount-high'){
    sort.finalAmount=-1;
  }else if(sortFilter==='amount-low'){
    sort.finalAmount=1;
  }

  const totalRevenue = await Order.aggregate([
    {
      $match: {
        orderStatus: { $nin: ["Cancelled", "Returned"] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$finalAmount" },
      },
    },
  ]);
  const totalOrdersAnalitics = await Order.countDocuments();
  const activeOrders = await Order.countDocuments({
    orderStatus: { $nin: ["Cancelled", "Returned"] },
  });
  const returnedOrders = await Order.countDocuments({
    orderStatus: "Returned",
  });
  const cancelledOrders = await Order.countDocuments({
    orderStatus: "Cancelled",
  });

  const limit = 5;
  const skip = (currentPage - 1) * limit;

  let orders = await Order.find(query)
    .sort(sort)
    .populate("userId", "username email");
  

  if(searchQuery){
    const s=searchQuery.toLowerCase();
    orders=orders.filter(order=>
      order.orderId?.toLowerCase().includes(s)||
      order.userId?.username?.toLowerCase().includes(s)||
      order.userId?.email?.toLowerCase().includes(s)
    )
  }
  const totalOrders = orders.length;
  orders = orders.slice(skip, skip + limit);
  const totalPages = Math.ceil(totalOrders / limit);
  
  const pageData = {
    pageTitle: "Orders",
    pageCss:'orders',
    pageJs:'orders',
    // Analytics data
    analytics: {
      totalOrders:totalOrdersAnalitics,
      activeOrders,
      returnedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue[0].total,
    },
    
    // Orders array with populated user data
    orders,
    
    // Pagination data
    currentPage,
    totalPages,
    limit,
    totalOrders,
    
    // Current filters (for maintaining state)
    sortFilter,
    statusFilter, 
    paymentStatusFilter,
    searchQuery, // Current search query
  };

  res.render("admin/orders", pageData);
};

export const laodOrderDetails = async (req, res) => {
  const id = req.params.id;
  const order = await Order.findById(id)
    .populate("userId")
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
  res.render("admin/orderDetails", {
    pageTitle: "order",
    pageJs: "orderDetails",
    pageCss: "orderDetails",
    order,
  });
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const now = new Date();

    // Initialize timeline if it doesn't exist
    if (!order.statusTimeline) {
      order.statusTimeline = {};
    }

    const timeline = order.statusTimeline;

    const statusFlow = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];

    const timelineMap = {
      Confirmed: "confirmedAt",
      Processing: "processedAt",
      Shipped: "shippedAt",
      "Out for Delivery": "outForDeliveryAt",
      Delivered: "deliveredAt",
      Cancelled: "cancelledAt",
      Returned: "returnedAt",
    };

    // Validate status
    const validStatuses = [
      ...statusFlow,
      "Cancelled",
      "Returned",
      "Partially Delivered",
      "Partially Cancelled",
      "Partially Returned",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // Handle Cancel & Returned separately (no auto-fill)
    if (status === "Cancelled") {
      timeline.cancelledAt = now;
      order.orderStatus = status;

      // Optional: Update all items to cancelled
      order.orderedItems.forEach((item) => {
        if (item.itemStatus !== "Cancelled") {
          item.itemStatus = "Cancelled";
          if (!item.itemTimeline) item.itemTimeline = {};
          item.itemTimeline.cancelledAt = now;
        }
      });

      await order.save();
      return res.json({
        success: true,
        message: "Order cancelled successfully",
        order,
      });
    }

    if (status === "Returned") {
      timeline.returnedAt = now;
      order.orderStatus = status;

      // Optional: Update all items to returned
      order.orderedItems.forEach((item) => {
        if (item.itemStatus !== "Returned") {
          item.itemStatus = "Returned";
          if (!item.itemTimeline) item.itemTimeline = {};
          item.itemTimeline.returnedAt = now;
        }
      });

      await order.save();
      return res.json({
        success: true,
        message: "Order marked as returned",
        order,
      });
    }

    // Auto fill ALL previous steps for normal flow
    const newIndex = statusFlow.indexOf(status);

    if (newIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid status for automatic timeline update",
      });
    }

    for (let i = 1; i <= newIndex; i++) {
      const step = statusFlow[i];
      const key = timelineMap[step];

      // Only auto-fill if empty
      if (key && !timeline[key]) {
        timeline[key] = now;
      }
    }

    // Update the selected status
    order.orderStatus = status;

    // Update item-level status for all items in the order
    order.orderedItems.forEach((item) => {
      // Don't update items that are already cancelled/returned
      if (
        item.itemStatus !== "Cancelled" &&
        item.itemStatus !== "Returned" &&
        item.itemStatus !== "ReturnApproved"
      ) {
        item.itemStatus = status;

        if (!item.itemTimeline) {
          item.itemTimeline = {};
        }

        // Update item timeline based on status
        if (status === "Confirmed" && !item.itemTimeline.confirmedAt) {
          item.itemTimeline.confirmedAt = now;
        } else if (status === "Processing" && !item.itemTimeline.processedAt) {
          item.itemTimeline.processedAt = now;
        } else if (status === "Shipped" && !item.itemTimeline.shippedAt) {
          item.itemTimeline.shippedAt = now;
        } else if (status === "Delivered" && !item.itemTimeline.deliveredAt) {
          item.itemTimeline.deliveredAt = now;
        }
      }
    });

    // Set delivered date
    if (status === "Delivered") {
      order.deliveredDate = now;
    }

    // Mark order changes as modified (important for subdocuments)
    order.markModified("statusTimeline");
    order.markModified("orderedItems");

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.log("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating order status",
    });
  }
};

// -------------------------------
// Handle Return Request (Approve / Reject)
// -------------------------------
export const handleReturnRequest = async (req, res) => {
  try {
    const { id } = req.params; // order id
    const { itemId, action, adminNote } = req.body;

    if (!itemId || !action) {
      return res
        .status(400)
        .json({ success: false, message: "Missing itemId or action" });
    }

    const validActions = ["approve", "reject"];
    if (!validActions.includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Find the item within the order
    const item = order.orderedItems.id
      ? order.orderedItems.id(itemId)
      : order.orderedItems.find((i) => i._id.toString() === itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Ordered item not found" });
    }

    const now = new Date();

    // Prevent approving/rejecting terminal statuses
    const terminalStatuses = ["Cancelled", "Returned"];
    if (terminalStatuses.includes(item.itemStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot change return status for this item",
      });
    }

    if (action === "approve") {
      item.itemStatus = "ReturnApproved";
      if (!item.itemTimeline) item.itemTimeline = {};
      item.itemTimeline.returnApprovedAt = now;
      if (adminNote) item.adminNote = adminNote;
    } else if (action === "reject") {
      item.itemStatus = "ReturnRejected";
      if (!item.itemTimeline) item.itemTimeline = {};
      item.itemTimeline.returnRejectedAt = now;
      if (adminNote) item.adminNote = adminNote;
    }

    // Update overall order status conservatively
    const allReturned = order.orderedItems.every(
      (i) => i.itemStatus === "Returned"
    );
    const anyReturnApprovedOrReturned = order.orderedItems.some(
      (i) => i.itemStatus === "ReturnApproved" || i.itemStatus === "Returned"
    );

    if (allReturned) {
      order.orderStatus = "Returned";
    } else if (anyReturnApprovedOrReturned) {
      order.orderStatus = "Partially Returned";
    }

    order.markModified("orderedItems");
    await order.save();

    return res.json({
      success: true,
      message: `Return request ${action}d successfully`,
      order,
    });
  } catch (error) {
    console.error("Error handling return request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing return request",
    });
  }
};

// -------------------------------
// Mark Item Returned (Admin confirms receipt of returned item)
// -------------------------------
export const markItemReturned = async (req, res) => {
  try {
    const { id } = req.params; // order id
    const { itemId } = req.body;

    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing itemId" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Find item
    const item = order.orderedItems.find((i) => i._id.toString() === itemId);
    console.log(item);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Ordered item not found" });
    }

    const variant = await variantModel.findById(item.variantId);
    const product = await productModel.findById(item.productId);

    product.totalStock += item.quantity;
    variant.stock += item.quantity;

    await product.save();
    await variant.save();

    // Only allowed if item was approved for return
    if (item.itemStatus === "Returned") {
      return res
        .status(400)
        .json({ success: false, message: "Item already marked as returned" });
    }

    const now = new Date();

    item.itemStatus = "Returned";
    if (!item.itemTimeline) item.itemTimeline = {};
    item.itemTimeline.returnedAt = now;

    // Update overall order status conservatively
    const allReturned = order.orderedItems.every(
      (i) => i.itemStatus === "Returned"
    );
    const anyReturned = order.orderedItems.some(
      (i) => i.itemStatus === "Returned"
    );

    if (allReturned) {
      order.orderStatus = "Returned";
      order.statusTimeline = order.statusTimeline || {};
      order.statusTimeline.returnedAt = now;
    } else if (anyReturned) {
      order.orderStatus = "Partially Returned";
    }

    order.markModified("orderedItems");
    await order.save();

    return res.json({ success: true, message: "Item marked returned", order });
  } catch (error) {
    console.error("Error marking item returned:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while marking item returned",
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
