import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  nickname?: string;
}

interface PaymentMethodsContextType {
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => void;
  loading: boolean;
}

const PaymentMethodsContext = createContext<PaymentMethodsContextType | undefined>(undefined);

export function PaymentMethodsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Load payment methods from localStorage (in a real app, this would be from a secure database)
      const savedMethods = localStorage.getItem(`payment_methods_${user.uid}`);
      if (savedMethods) {
        try {
          setPaymentMethods(JSON.parse(savedMethods));
        } catch (error) {
          console.error('Error loading payment methods:', error);
        }
      }
    } else {
      setPaymentMethods([]);
    }
    setLoading(false);
  }, [user]);

  const savePaymentMethods = (methods: PaymentMethod[]) => {
    if (user) {
      localStorage.setItem(`payment_methods_${user.uid}`, JSON.stringify(methods));
    }
    setPaymentMethods(methods);
  };

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    // If this is the first method or it's set as default, make it default
    if (paymentMethods.length === 0 || method.isDefault) {
      const updatedMethods = paymentMethods.map(pm => ({ ...pm, isDefault: false }));
      updatedMethods.push(newMethod);
      savePaymentMethods(updatedMethods);
    } else {
      savePaymentMethods([...paymentMethods, newMethod]);
    }
  };

  const removePaymentMethod = (id: string) => {
    const updatedMethods = paymentMethods.filter(method => method.id !== id);
    
    // If we removed the default method, make the first remaining method default
    if (updatedMethods.length > 0 && paymentMethods.find(m => m.id === id)?.isDefault) {
      updatedMethods[0].isDefault = true;
    }
    
    savePaymentMethods(updatedMethods);
  };

  const setDefaultPaymentMethod = (id: string) => {
    const updatedMethods = paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id,
    }));
    savePaymentMethods(updatedMethods);
  };

  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
    const updatedMethods = paymentMethods.map(method =>
      method.id === id ? { ...method, ...updates } : method
    );
    savePaymentMethods(updatedMethods);
  };

  const value = {
    paymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    updatePaymentMethod,
    loading,
  };

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
}

export function usePaymentMethods() {
  const context = useContext(PaymentMethodsContext);
  if (context === undefined) {
    throw new Error('usePaymentMethods must be used within a PaymentMethodsProvider');
  }
  return context;
}