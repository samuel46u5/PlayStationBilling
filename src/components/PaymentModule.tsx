import React, { useState } from 'react';
import { CreditCard, DollarSign, Banknote, Smartphone, Calculator, Receipt, X, CheckCircle } from 'lucide-react';

interface PaymentModuleProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => void;
  paymentType: 'prepaid' | 'payasyougo';
  totalAmount: number;
  customerName?: string;
  consoleName?: string;
  duration?: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  breakdown?: {
    subtotal: number;
    tax?: number;
    discount?: number;
    lateFee?: number;
  };
}

export interface PaymentData {
  method: 'cash' | 'card' | 'transfer';
  amount: number;
  changeAmount?: number;
  reference?: string;
  notes?: string;
}

const PaymentModule: React.FC<PaymentModuleProps> = ({
  isOpen,
  onClose,
  onConfirm,
  paymentType,
  totalAmount,
  customerName,
  consoleName,
  duration,
  items = [],
  breakdown
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(totalAmount);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const changeAmount = paymentMethod === 'cash' ? Math.max(0, paymentAmount - totalAmount) : 0;
  const isValidPayment = paymentAmount >= totalAmount;

  const handleConfirmPayment = async () => {
    if (!isValidPayment) {
      alert('Jumlah pembayaran tidak mencukupi');
      return;
    }

    setIsProcessing(true);
    
    try {
      const paymentData: PaymentData = {
        method: paymentMethod,
        amount: paymentAmount,
        changeAmount: changeAmount,
        reference: reference || undefined,
        notes: notes || undefined
      };

      await onConfirm(paymentData);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Gagal memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-5 w-5" />;
      case 'card': return <CreditCard className="h-5 w-5" />;
      case 'transfer': return <Smartphone className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'border-green-500 bg-green-50 text-green-700';
      case 'card': return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'transfer': return 'border-purple-500 bg-purple-50 text-purple-700';
      default: return 'border-gray-300 bg-gray-50 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {paymentType === 'prepaid' ? 'Pembayaran Bayar di Muka' : 'Pembayaran Pay As You Go'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {paymentType === 'prepaid' 
                    ? 'Konfirmasi pembayaran sebelum memulai rental' 
                    : 'Pembayaran setelah selesai rental'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Ringkasan {paymentType === 'prepaid' ? 'Rental' : 'Tagihan'}
            </h3>
            
            <div className="space-y-2 text-sm">
              {customerName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
              )}
              
              {consoleName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Console:</span>
                  <span className="font-medium">{consoleName}</span>
                </div>
              )}
              
              {duration && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Durasi:</span>
                  <span className="font-medium">{duration} jam</span>
                </div>
              )}

              {/* Items for Pay As You Go */}
              {items.length > 0 && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-600 font-medium">Item Tambahan:</span>
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between ml-4">
                      <span className="text-gray-600">{item.name} x {item.quantity}</span>
                      <span className="font-medium">Rp {item.total.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Breakdown */}
              {breakdown && (
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>Rp {breakdown.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {breakdown.discount && breakdown.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diskon:</span>
                      <span className="text-red-600">-Rp {breakdown.discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {breakdown.lateFee && breakdown.lateFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Denda Keterlambatan:</span>
                      <span className="text-red-600">+Rp {breakdown.lateFee.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {breakdown.tax && breakdown.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pajak:</span>
                      <span>Rp {breakdown.tax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
                <span>Total Pembayaran:</span>
                <span className="text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Metode Pembayaran</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'cash', label: 'Tunai', icon: 'cash' },
                { id: 'card', label: 'Kartu', icon: 'card' },
                { id: 'transfer', label: 'Transfer', icon: 'transfer' }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    setPaymentMethod(method.id as any);
                    if (method.id !== 'cash') {
                      setPaymentAmount(totalAmount);
                    }
                  }}
                  className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                    paymentMethod === method.id
                      ? getPaymentMethodColor(method.id)
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {getPaymentMethodIcon(method.id)}
                    <span className="font-medium text-sm">{method.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {paymentMethod === 'cash' ? 'Jumlah Uang Diterima' : 'Jumlah Pembayaran'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono ${
                  !isValidPayment ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                disabled={paymentMethod !== 'cash'}
              />
            </div>
            {!isValidPayment && (
              <p className="text-red-600 text-sm mt-1">
                Jumlah pembayaran harus minimal Rp {totalAmount.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Change Amount for Cash */}
          {paymentMethod === 'cash' && changeAmount > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-800">Kembalian:</span>
                <span className="text-xl font-bold text-green-600">
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Reference Number for Card/Transfer */}
          {(paymentMethod === 'card' || paymentMethod === 'transfer') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Referensi {paymentMethod === 'card' ? 'Kartu' : 'Transfer'} (Opsional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={paymentMethod === 'card' ? 'Nomor kartu (4 digit terakhir)' : 'Nomor referensi transfer'}
              />
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Catatan tambahan untuk pembayaran ini..."
            />
          </div>

          {/* Quick Cash Buttons for Cash Payment */}
          {paymentMethod === 'cash' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal Cepat
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  totalAmount,
                  Math.ceil(totalAmount / 10000) * 10000,
                  Math.ceil(totalAmount / 20000) * 20000,
                  Math.ceil(totalAmount / 50000) * 50000
                ].filter((amount, index, arr) => arr.indexOf(amount) === index).map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaymentAmount(amount)}
                    className="px-3 py-2 border border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    Rp {amount.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3">Ringkasan Pembayaran</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Metode Pembayaran:</span>
                <span className="font-medium text-blue-900 capitalize">
                  {paymentMethod === 'cash' ? 'Tunai' : 
                   paymentMethod === 'card' ? 'Kartu' : 'Transfer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Tagihan:</span>
                <span className="font-medium text-blue-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Jumlah Bayar:</span>
                <span className="font-medium text-blue-900">Rp {paymentAmount.toLocaleString('id-ID')}</span>
              </div>
              {paymentMethod === 'cash' && changeAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Kembalian:</span>
                  <span className="font-bold text-green-600">Rp {changeAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {reference && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Referensi:</span>
                  <span className="font-medium text-blue-900">{reference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmPayment}
              disabled={!isValidPayment || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {paymentType === 'prepaid' ? 'Bayar dan Mulai' : 'Konfirmasi Pembayaran'}
                </>
              )}
            </button>
          </div>

          {/* Payment Type Specific Info */}
          {paymentType === 'prepaid' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Catatan:</strong> Setelah pembayaran dikonfirmasi, sesi rental akan dimulai secara otomatis.
              </p>
            </div>
          )}

          {paymentType === 'payasyougo' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">
                <strong>Catatan:</strong> Pembayaran ini akan menyelesaikan sesi rental yang sedang berlangsung.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModule;