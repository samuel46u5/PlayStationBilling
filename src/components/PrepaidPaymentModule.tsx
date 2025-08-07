import React from 'react';
import PaymentModule, { PaymentData } from './PaymentModule';

interface PrepaidPaymentModuleProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => void;
  totalAmount: number;
  customerName: string;
  consoleName: string;
  duration: number;
  rateDetails?: {
    baseRate: number;
    peakHourRate?: number;
    weekendMultiplier?: number;
  };
}

const PrepaidPaymentModule: React.FC<PrepaidPaymentModuleProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  customerName,
  consoleName,
  duration,
  rateDetails
}) => {
  const handlePaymentConfirm = async (paymentData: PaymentData) => {
    try {
      // Log payment for prepaid rental
      console.log('Prepaid payment confirmed:', {
        type: 'prepaid',
        customer: customerName,
        console: consoleName,
        duration,
        amount: totalAmount,
        paymentData
      });

      // Call the parent confirmation handler
      await onConfirm(paymentData);
    } catch (error) {
      console.error('Prepaid payment error:', error);
      throw error;
    }
  };

  const breakdown = rateDetails ? {
    subtotal: rateDetails.baseRate * duration,
    tax: 0,
    discount: 0,
    lateFee: 0
  } : undefined;

  return (
    <PaymentModule
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handlePaymentConfirm}
      paymentType="prepaid"
      totalAmount={totalAmount}
      customerName={customerName}
      consoleName={consoleName}
      duration={duration}
      breakdown={breakdown}
    />
  );
};

export default PrepaidPaymentModule;