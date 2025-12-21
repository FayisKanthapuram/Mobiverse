export function calculateOrderStatus(items) {
  const statuses = items.map((i) => i.itemStatus);

  const all = (s) => statuses.every((st) => st === s);
  const any = (s) => statuses.includes(s);

  // ✅ FINAL STATES (highest priority)
  if (all("Cancelled")) return "Cancelled";
  if (all("Returned")) return "Returned";
  if (all("Delivered")) return "Delivered";

  // ✅ PARTIAL FINAL STATES
  if (any("Returned")) return "Partially Returned";
  if (any("Delivered")) return "Partially Delivered";
  if (any("Cancelled")) return "Partially Cancelled";

  // ✅ ACTIVE FLOW STATES (priority order)
  if (any("Out for Delivery")) return "Out for Delivery";
  if (any("Shipped")) return "Shipped";
  if (any("Processing")) return "Processing";
  if (any("Confirmed")) return "Confirmed";

  // ✅ DEFAULT
  return "Pending";
}

export function calculateOrderPaymentStatus(items) {
  const statuses = items.map((i) => i.paymentStatus);

  const all = (s) => statuses.every((st) => st === s);
  const any = (s) => statuses.includes(s);

  // ✅ FINAL STATES (highest priority)
  if (all("Refunded")) return "Refunded";
  if (all("Paid")) return "Paid";
  if (all("Failed")) return "Failed";
  if (all("Cancelled")) return "Cancelled";

  if (any("Refunded"))
    // ✅ PARTIAL STATES
    return "Partially Refunded";
  if (any("Paid")) return "Partially Paid";

  // ✅ DEFAULT
  return "Pending";
}
