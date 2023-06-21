export const CONVERSATION_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export const MESSAGE_STATUSES = {
  UNREAD: "unread",
  READ: "read",
  DELETED: "deleted",
};

export const ORDER_ACCEPTED_REJECTED = {
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  DEFAULT: "default"
}

export const PAYMENT_ACCOUNT_TYPES = {
  BRAINTREE: "braintree",
  STRIPE_CUSTOMER: "stripe_customer",
  STRIPE_ACCOUNT: "stripe_account",
};

export const GEO_JSON_TYPES = {
  POINT: "Point",
  LINESTRING: "LineString",
  POLYGON: "Polygon",
  MULTIPOINT: "MultiPoint",
  MULTILINESTRING: "MultiLineString",
  MULTIPOLYGON: "MultiPolygon",
};

export const USER_STATUSES = {
  ACTIVE: "active",
  DELETED: "deleted",
};

export const USER_TYPES = {
  CUSTOMER: "customer",
  LAUNDERER: "launderer",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
  MULTI: "multi",
};

export const OTP_TYPES = {
  LOGIN: "login",
  SIGN_UP: "sign_up",
  OTHER: "other",
};

export const ENVIRONMENTS = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
};

export const ORDER_STATUSES = {
  // Pending
  PENDING: "pending",
  // Upcoming
  CONFIRMED: "confirmed",
  // In Progress
  STARTED: "started",
  COMING_FOR_PICKUP: "coming_for_pickup",
  REACHED_LOCATION: "reached_location",
  PICKUP_LOCATION_SELECTED: "pickup_location_selected",
  CLOTHES_IN_WASHER: "clothes_in_washer",
  CLOTHES_IN_DRYER: "clothes_in_dryer",
  CLOTHES_FOLDING: "clothes_folding",
  CLOTHES_DELIVERY: "clothes_delivery",
  // Completed
  WORK_SUBMITTED: "work_submitted",
  FEEDBACK_SUBMITTED: "feedback_submitted",
  // Cancelled
  CANCELLED: "cancelled",
};

export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: "new_message",
  NEW_ORDER_REQUEST: "new_order_request",
  ORDER_REQUEST_ACCEPTED: "order_request_accepted",
  ORDER_STARTED: "order_started",
  LAUNDERER_COMING: "launderer_coming",
  LAUNDERER_REACHED: "launderer_reached",
  PICKUP_LOCATION_SELECTED: "pickup_location_selected",
  CLOTHES_IN_WASHER: "clothes_in_washer",
  CLOTHES_IN_DRYER: "clothes_in_dryer",
  CLOTHES_FOLDING: "clothes_folding",
  CLOTHES_DELIVERY: "clothes_delivery",
  ORDER_WORK_SUBMITTED: "order_work_submitted",
  ORDER_FEEDBACK_SUBMITTED: "order_feedback_submitted",
  ORDER_TIP_LEFT: "order_tip_left",
  ORDER_CANCELLED: "order_cancelled",
};

export const PICKUP_LOCATION_TYPES = {
  DOOR: "door",
  GARAGE: "garage",
  OTHER: "other",
};

export const CUSTOMER_REPORT_TYPES = {
  LAUNDERER: "launderer",
  LAUNDERER_WORK: "launderer_work",
};

export const AUTH_STEPS = {
  BASIC_REGISTRATION: "basic_registration",
  PROFILE_COMPLETION: "profile_completion",
  PHONE_VERIFICATION: "phone_verification",
  PICTURES_UPLOADING: "pictures_uploading",
  LOCATION_ADDITION: "location_addition",
  IDENTITY_VERIFICATION: "identity_verification",
  SERVICE_AREAS_SELECTION: "service_areas_selection",
  W9_FORM_SUBMISSION: "w9_form_submission",
};

export const SCREENS = {
  SERVICE_TRACKER_CHUCKER: "service_tracker_launderer",
  SERVICE_TRACKER_CUSTOMER: "service_tracker_customer",
};

export const WITHDRAWAL_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined",
};

export const TEMPERATURE_SETTINGS = {
  COLD: "cold",
  WARM: "warm",
  HOT: "hot",
};

export const SPIN_SETTINGS = {
  DRY_LOW: "dry_low",
  DRY_HIGH: "dry_high",
  AIR_DRY: "air_dry",
};

export const LAUNDERER_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline"
}

export const BAG_SIZES = {
  SMALL:"small",
  LARGE: "large"
}

export const MAIN_STATUSESORDER = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending'
}

export const APP_CONSTANTS = {
  ABOUT_US: "about_us",
  TERMS_AND_CONDITIONS: "terms_and_conditions",
  PRIVACY_POLICY: "privacy_policy",
  LFL_BAG_PRICE: "lfl_bag_price",
  DELIVERY_FEE: "delivery_fee",
  APP_CHARGES_PERCENTAGE: "app_charges_percentage",
};

export const NOTIFICATION_STATUSES = {
  UNREAD: "unread",
  READ: "read",
};
