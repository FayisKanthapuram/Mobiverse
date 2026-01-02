// Order helper functions - calculate order and payment statuses
// Calculate order status based on item statuses
export function calculateOrderStatus(items) {
  const statuses = items.map((i) => i.itemStatus);

  const all = (s) => statuses.every((st) => st === s);
  const any = (s) => statuses.includes(s);

  // Check final states first
  if (all("Cancelled")) return "Cancelled";
  if (all("Returned")) return "Returned";
  if (all("Delivered")) return "Delivered";

  // Check partial final states
  if (any("Returned")) return "Partially Returned";
  if (any("Delivered")) return "Partially Delivered";
  if (any("Cancelled")) return "Partially Cancelled";

  // Check active flow states
  if (any("Out for Delivery")) return "Out for Delivery";
  if (any("Shipped")) return "Shipped";
  if (any("Processing")) return "Processing";
  if (any("Confirmed")) return "Confirmed";

  if (any("ReturnRequested")) return "Partially Returned";
  if (any("ReturnRejected")) return "Delivered";
  
  return "Pending";
}

// Calculate payment status based on item payment statuses
export function calculateOrderPaymentStatus(items) {
  const statuses = items.map((i) => i.paymentStatus);

  const all = (s) => statuses.every((st) => st === s);
  const any = (s) => statuses.includes(s);

  // Check final payment states
  if (all("Refunded")) return "Refunded";
  if (all("Paid")) return "Paid";
  if (all("Failed")) return "Failed";
  if (all("Cancelled")) return "Cancelled";

  // Check partial payment states
  if (any("Refunded")) return "Partially Refunded";
  if (any("Paid")) return "Partially Paid";

  return "Pending";
}
