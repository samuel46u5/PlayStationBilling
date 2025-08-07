import { PaymentData } from '../components/PaymentModule';

/**
 * Validate payment data
 */
export const validatePayment = (
  paymentData: PaymentData, 
  totalAmount: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if payment amount is sufficient
  if (paymentData.amount < totalAmount) {
    errors.push('Jumlah pembayaran tidak mencukupi');
  }

  // Validate payment method specific requirements
  if (paymentData.method === 'card' || paymentData.method === 'transfer') {
    if (paymentData.amount !== totalAmount) {
      errors.push('Pembayaran non-tunai harus sesuai dengan total tagihan');
    }
  }

  // Validate reference for card/transfer
  if ((paymentData.method === 'card' || paymentData.method === 'transfer') && 
      paymentData.reference && paymentData.reference.length < 3) {
    errors.push('Nomor referensi terlalu pendek');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate change amount for cash payments
 */
export const calculateChange = (paymentAmount: number, totalAmount: number): number => {
  return Math.max(0, paymentAmount - totalAmount);
};

/**
 * Format payment method for display
 */
export const formatPaymentMethod = (method: 'cash' | 'card' | 'transfer'): string => {
  switch (method) {
    case 'cash': return 'Tunai';
    case 'card': return 'Kartu';
    case 'transfer': return 'Transfer';
    default: return method;
  }
};

/**
 * Generate payment reference ID
 */
export const generatePaymentReference = (
  method: 'cash' | 'card' | 'transfer',
  customReference?: string
): string => {
  const timestamp = Date.now();
  const prefix = method.toUpperCase();
  
  if (customReference) {
    return `${prefix}-${customReference}-${timestamp}`;
  }
  
  return `${prefix}-${timestamp}`;
};

/**
 * Calculate payment breakdown for prepaid rentals
 */
export const calculatePrepaidBreakdown = (
  baseRate: number,
  duration: number,
  peakHourRate?: number,
  weekendMultiplier?: number,
  discount?: number
) => {
  const subtotal = baseRate * duration;
  const peakHourAmount = peakHourRate ? (peakHourRate - baseRate) * duration : 0;
  const weekendAmount = weekendMultiplier ? subtotal * (weekendMultiplier - 1) : 0;
  const discountAmount = discount || 0;
  
  const total = subtotal + peakHourAmount + weekendAmount - discountAmount;
  
  return {
    subtotal,
    peakHourAmount,
    weekendAmount,
    discount: discountAmount,
    total
  };
};

/**
 * Calculate payment breakdown for pay-as-you-go rentals
 */
export const calculatePayAsYouGoBreakdown = (
  rentalAmount: number,
  items: Array<{ total: number }> = [],
  lateFee: number = 0,
  discount: number = 0,
  tax: number = 0
) => {
  const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
  const subtotal = rentalAmount + itemsTotal;
  const total = subtotal + lateFee + tax - discount;
  
  return {
    subtotal,
    itemsTotal,
    lateFee,
    discount,
    tax,
    total
  };
};

/**
 * Create payment record for database
 */
export const createPaymentRecord = (
  paymentData: PaymentData,
  totalAmount: number,
  customerId?: string,
  referenceType: 'rental' | 'sale' | 'booking' | 'voucher' = 'rental',
  referenceId?: string
) => {
  return {
    customer_id: customerId,
    amount: totalAmount,
    payment_method: paymentData.method,
    reference_id: paymentData.reference || generatePaymentReference(paymentData.method),
    reference_type: referenceType,
    status: 'completed',
    notes: paymentData.notes,
    payment_date: new Date().toISOString()
  };
};