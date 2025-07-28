import { useState, useEffect } from 'react';
import { paymentMethodService, PaymentMethod } from '../services/paymentMethodService';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      const data = await paymentMethodService.getAll();
      setPaymentMethods(data.filter((method: PaymentMethod) => method.is_active));
    } catch (err) {
      setError('Error fetching payment methods');
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return {
    paymentMethods,
    loading,
    error,
    refetch: fetchPaymentMethods
  };
};