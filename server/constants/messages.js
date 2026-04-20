const MESSAGES = {
  // Auth
  AUTH: {
    LOGIN_SUCCESS: "Logged in successfully",
    LOGOUT_SUCCESS: "Logged out successfully",
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_PASSWORD_REQUIRED: "Email and password are required",
    NOT_AUTHORIZED: "Not authorized, no token",
    INVALID_TOKEN: "Invalid token",
    TOKEN_EXPIRED: "Token expired",
    NO_REFRESH_TOKEN: "No refresh token",
    ACCOUNT_INACTIVE: "Your account has been deactivated. Contact admin.",
  },

  // User
  USER: {
    CREATED: "User created successfully",
    UPDATED: "User updated successfully",
    DELETED: "User deactivated successfully",
    NOT_FOUND: "User not found",
    ALREADY_EXISTS: "User with this email already exists",
    FETCHED: "Users fetched successfully",
    FETCHED_ONE: "User fetched successfully",
    PERMANENTLY_DELETED: "User permanently deleted successfully",
  },

  // Menu
  MENU: {
    CREATED: "Menu item created successfully",
    UPDATED: "Menu item updated successfully",
    DELETED: "Menu item deleted successfully",
    NOT_FOUND: "Menu item not found",
    FETCHED: "Menu items fetched successfully",
    FETCHED_ONE: "Menu item fetched successfully",
  },

  // Table
  TABLE: {
    CREATED: "Table created successfully",
    UPDATED: "Table updated successfully",
    DELETED: "Table deleted successfully",
    NOT_FOUND: "Table not found",
    FETCHED: "Tables fetched successfully",
    ALREADY_OCCUPIED: "Table is already occupied",
  },

  // Order
  ORDER: {
    CREATED: "Order created successfully",
    UPDATED: "Order updated successfully",
    CANCELLED: "Order cancelled successfully",
    NOT_FOUND: "Order not found",
    FETCHED: "Orders fetched successfully",
    FETCHED_ONE: "Order fetched successfully",
    INVALID_STATUS: "Invalid order status",
    ALREADY_BILLED: "Order has already been billed",
    CANCEL_REASON_REQUIRED: "Cancellation reason is required",
  },

  // Bill
  BILL: {
    CREATED: "Bill generated successfully",
    NOT_FOUND: "Bill not found",
    FETCHED: "Bills fetched successfully",
    ALREADY_PAID: "Bill has already been paid",
  },

  // Feedback
  FEEDBACK: {
    CREATED:        "Feedback submitted successfully",
    NOT_FOUND:      "Feedback not found",
    ALREADY_EXISTS: "Feedback already submitted for this bill",
    FETCHED:        "Feedback fetched successfully",
  },

  // General
  GENERAL: {
    SERVER_ERROR: "Internal server error",
    NOT_FOUND: "Resource not found",
    BAD_REQUEST: "Bad request",
    FORBIDDEN: "You do not have permission to perform this action",
    VALIDATION_ERROR: "Validation error",
  },
};

module.exports = MESSAGES;