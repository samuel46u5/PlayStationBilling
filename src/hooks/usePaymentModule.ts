import { useState } from 'react';
import { PaymentData } from '../components/PaymentModule';

interface UsePaymentModuleProps {
  onPaymentSuccess?: (paymentData: PaymentData) => void;
  onPaymentError?: (error: Error) => void;
}

export const usePaymentModule = ({ 
  onPaymentSuccess, 
  onPaymentError 
}: UsePaymentModuleProps = {}) => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'prepaid' | 'payasyougo'>('prepaid');
  const [paymentData, setPaymentData] = useState<any>(null);

  const openPrepaidPayment = (data: {
    totalAmount: number;
    customerName: string;
    consoleName: string;
    duration: number;
    rateDetails?: any;
  }) => {
    setPaymentType('prepaid');
    setPaymentData(data);
    setIsPaymentOpen(true);
  };

  const openPayAsYouGoPayment = (data: {
    totalAmount: number;
    customerName: string;
    consoleName: string;
    duration: number;
    items?: any[];
    breakdown: any;
  }) => {
    setPaymentType('payasyougo');
    setPaymentData(data);
    setIsPaymentOpen(true);
  };

  const closePayment = () => {
    setIsPaymentOpen(false);
    setPaymentData(null);
  };

  const handlePaymentConfirm = async (payment: PaymentData) => {
    try {
      // Process payment based on type
      if (paymentType === 'prepaid') {
        // Handle prepaid payment logic
        console.log('Processing prepaid payment:', payment);
      } else {
        // Handle pay-as-you-go payment logic
        console.log('Processing pay-as-you-go payment:', payment);
      }

      // Call success callback
      if (onPaymentSuccess) {
        onPaymentSuccess(payment);
      }

      // Close payment module
      closePayment();
    } catch (error) {
      console.error('Payment processing error:', error);
      
      if (onPaymentError) {
        onPaymentError(error as Error);
      }
      
      throw error;
    }
  };

  return {
    isPaymentOpen,
    paymentType,
    paymentData,
    openPrepaidPayment,
    openPayAsYouGoPayment,
    closePayment,
    handlePaymentConfirm
  };
};

export default usePaymentModule;