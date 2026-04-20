const Order = require("../models/Order");
const Table = require("../models/Table");

const updateTableStatusFromOrders = async (tableNumber) => {
  console.log(`🔄 Updating table ${tableNumber}...`);

  // Find orders that are NOT billed or cancelled
  const activeOrders = await Order.find({
    tableNumber,
    status: { $nin: ["billed", "cancelled"] },
  });

  let newStatus = "available";

  if (activeOrders.length > 0) {
    // Only move to "billing" when EVERY active order is fully served
    const allServed = activeOrders.every(o => o.status === "served");

    if (allServed) {
      newStatus = "billing"; // All food served → ready for cashier to bill
      console.log(`   → ${activeOrders.length} orders, all served → BILLING`);
    } else {
      newStatus = "occupied"; // Still cooking / eating
      console.log(`   → ${activeOrders.length} orders, not all served → OCCUPIED`);
    }
  } else {
    console.log(`   → No active orders → AVAILABLE`);
  }

  await Table.findOneAndUpdate(
    { tableNumber },
    {
      status:       newStatus,
      currentOrder: activeOrders[0]?._id || null,
    }
  );

  console.log(`✅ Table ${tableNumber} is now ${newStatus.toUpperCase()}`);
  return newStatus;
};

module.exports = { updateTableStatusFromOrders };