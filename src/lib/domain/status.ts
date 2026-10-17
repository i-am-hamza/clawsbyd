// §7.6 State machines — transition tables

export type BookingStatus =
  | 'requested'
  | 'awaiting_deposit'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'no_show'
  | 'expired';

export type OrderStatus =
  | 'new'
  | 'paid'
  | 'making'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type BookingTransition =
  | 'approve_with_deposit'
  | 'approve_no_deposit'
  | 'deposit_recorded'
  | 'decline'
  | 'hold_expired'
  | 'cancel'
  | 'no_show'
  | 'complete'
  | 'reschedule';

export type OrderTransition =
  | 'payment_recorded'
  | 'start_making'
  | 'ship'
  | 'deliver'
  | 'cancel'
  | 'auto_cancel_unpaid';

// Booking transitions: from → via action → to
const BOOKING_TRANSITIONS: Array<{
  from: BookingStatus;
  action: BookingTransition;
  to: BookingStatus;
}> = [
  { from: 'requested', action: 'approve_with_deposit', to: 'awaiting_deposit' },
  { from: 'requested', action: 'approve_no_deposit', to: 'confirmed' },
  { from: 'requested', action: 'decline', to: 'declined' },
  { from: 'awaiting_deposit', action: 'deposit_recorded', to: 'confirmed' },
  { from: 'awaiting_deposit', action: 'hold_expired', to: 'expired' },
  { from: 'awaiting_deposit', action: 'cancel', to: 'cancelled' },
  { from: 'confirmed', action: 'cancel', to: 'cancelled' },
  { from: 'confirmed', action: 'no_show', to: 'no_show' },
  { from: 'confirmed', action: 'complete', to: 'completed' },
  // Reschedule: stays in same status (handled separately — doesn't change status)
];

// Order transitions
const ORDER_TRANSITIONS: Array<{
  from: OrderStatus;
  action: OrderTransition;
  to: OrderStatus;
}> = [
  { from: 'new', action: 'payment_recorded', to: 'paid' },
  { from: 'new', action: 'cancel', to: 'cancelled' },
  { from: 'new', action: 'auto_cancel_unpaid', to: 'cancelled' },
  { from: 'paid', action: 'start_making', to: 'making' },
  { from: 'paid', action: 'cancel', to: 'cancelled' },
  { from: 'making', action: 'ship', to: 'shipped' },
  { from: 'making', action: 'cancel', to: 'cancelled' },
  { from: 'shipped', action: 'deliver', to: 'delivered' },
];

export function nextBookingStatus(
  from: BookingStatus,
  action: BookingTransition,
): BookingStatus | null {
  const t = BOOKING_TRANSITIONS.find((x) => x.from === from && x.action === action);
  return t?.to ?? null;
}

export function nextOrderStatus(
  from: OrderStatus,
  action: OrderTransition,
): OrderStatus | null {
  const t = ORDER_TRANSITIONS.find((x) => x.from === from && x.action === action);
  return t?.to ?? null;
}

export function canBookingTransition(from: BookingStatus, action: BookingTransition): boolean {
  return nextBookingStatus(from, action) !== null;
}

export function canOrderTransition(from: OrderStatus, action: OrderTransition): boolean {
  return nextOrderStatus(from, action) !== null;
}

/** Returns all valid actions from a given booking status. */
export function bookingActionsFrom(status: BookingStatus): BookingTransition[] {
  return BOOKING_TRANSITIONS.filter((t) => t.from === status).map((t) => t.action);
}

/** Returns all valid actions from a given order status. */
export function orderActionsFrom(status: OrderStatus): OrderTransition[] {
  return ORDER_TRANSITIONS.filter((t) => t.from === status).map((t) => t.action);
}

/** Whether a booking status is considered "holding" a slot. */
export function isHoldingStatus(status: BookingStatus): boolean {
  return status === 'awaiting_deposit' || status === 'confirmed';
}
