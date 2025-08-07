import React from 'react';
import PaymentModule, { PaymentData } from './PaymentModule';

interface PayAsYouGoPaymentModuleProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => void;
  totalAmount: number;
  customerName: string;
  consoleName: string;
  duration: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  breakdown: {
    subtotal: number;
    tax?: number;
    discount?: number;
    lateFee?: number;
  };
}

const PayAsYouGoPaymentModule: React.FC<PayAsYouGoPaymentModuleProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  customerName,
  consoleName,
  duration,
  items = [],
  breakdown
}) => {
  const handlePaymentConfirm = async (paymentData: PaymentData) => {
    try {
      // Log payment for pay-as-you-go rental
      console.log('Pay-as-you-go payment confirmed:', {
        type: 'payasyougo',
        customer: customerName,
        console: consoleName,
        duration,
        amount: totalAmount,
        items,
        breakdown,
        paymentData
      });

      // Call the parent confirmation handler
      await onConfirm(paymentData);
    } catch (error) {
      console.error('Pay-as-you-go payment error:', error);
      throw error;
    }
  };

  return (
    <PaymentModule
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handlePaymentConfirm}
      paymentType="payasyougo"
      totalAmount={totalAmount}
      customerName={customerName}
      consoleName={consoleName}
      duration={duration}
      items={items}
      breakdown={breakdown}
    />
  );
};

export default PayAsYouGoPaymentModule;