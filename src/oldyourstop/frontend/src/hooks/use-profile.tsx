'use client';

import { useState, useEffect } from 'react';

export interface Profile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  isAgeVerified: boolean;
}

export interface DietaryPreference {
  id: string;
  name: string;
  selected: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple' | 'google';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    isAgeVerified: false,
  });

  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Default dietary preferences
  const defaultDietaryPreferences: DietaryPreference[] = [
    { id: 'vegetarian', name: 'Vegetarian', selected: false },
    { id: 'vegan', name: 'Vegan', selected: false },
    { id: 'gluten-free', name: 'Gluten-Free', selected: false },
    { id: 'dairy-free', name: 'Dairy-Free', selected: false },
    { id: 'nut-allergy', name: 'Nut Allergy', selected: false },
    { id: 'seafood-allergy', name: 'Seafood Allergy', selected: false },
    { id: 'halal', name: 'Halal', selected: false },
    { id: 'kosher', name: 'Kosher', selected: false },
    { id: 'keto', name: 'Keto', selected: false },
    { id: 'paleo', name: 'Paleo', selected: false },
  ];

  // Load profile data from localStorage on mount
  useEffect(() => {
    const loadProfileData = () => {
      try {
        const savedProfile = localStorage.getItem('profile');
        const savedDietary = localStorage.getItem('dietaryPreferences');
        const savedPayments = localStorage.getItem('paymentMethods');

        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
        if (savedDietary) {
          setDietaryPreferences(JSON.parse(savedDietary));
        } else {
          // Initialize with default preferences if none saved
          setDietaryPreferences(defaultDietaryPreferences);
          localStorage.setItem('dietaryPreferences', JSON.stringify(defaultDietaryPreferences));
        }
        if (savedPayments) {
          setPaymentMethods(JSON.parse(savedPayments));
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // Save profile data to localStorage
  const saveProfile = (newProfile: Profile) => {
    setProfile(newProfile);
    localStorage.setItem('profile', JSON.stringify(newProfile));
  };

  const saveDietaryPreferences = (preferences: DietaryPreference[]) => {
    setDietaryPreferences(preferences);
    localStorage.setItem('dietaryPreferences', JSON.stringify(preferences));
  };

  const savePaymentMethods = (methods: PaymentMethod[]) => {
    setPaymentMethods(methods);
    localStorage.setItem('paymentMethods', JSON.stringify(methods));
  };

  // Calculate age verification
  const calculateAgeVerification = (dateOfBirth: string) => {
    if (!dateOfBirth) return false;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };

  // Update profile with age verification
  const updateProfile = (newProfile: Partial<Profile>) => {
    const updatedProfile = { ...profile, ...newProfile };
    
    // Auto-calculate age verification if date of birth is provided
    if (newProfile.dateOfBirth !== undefined) {
      updatedProfile.isAgeVerified = calculateAgeVerification(newProfile.dateOfBirth);
    }
    
    saveProfile(updatedProfile);
  };

  // Add payment method
  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
    };
    
    const updatedMethods = [...paymentMethods, newMethod];
    savePaymentMethods(updatedMethods);
  };

  // Remove payment method
  const removePaymentMethod = (id: string) => {
    const updatedMethods = paymentMethods.filter(method => method.id !== id);
    savePaymentMethods(updatedMethods);
  };

  // Set default payment method
  const setDefaultPaymentMethod = (id: string) => {
    const updatedMethods = paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id,
    }));
    savePaymentMethods(updatedMethods);
  };

  // Update dietary preferences
  const updateDietaryPreference = (id: string) => {
    const existingPreference = dietaryPreferences.find(pref => pref.id === id);
    
    if (existingPreference) {
      // Toggle existing preference
      const updatedPreferences = dietaryPreferences.map(pref => 
        pref.id === id ? { ...pref, selected: !pref.selected } : pref
      );
      saveDietaryPreferences(updatedPreferences);
    } else {
      // Add new preference if it doesn't exist
      const newPreference = defaultDietaryPreferences.find(pref => pref.id === id);
      if (newPreference) {
        const updatedPreferences = [...dietaryPreferences, { ...newPreference, selected: true }];
        saveDietaryPreferences(updatedPreferences);
      }
    }
  };

  return {
    profile,
    dietaryPreferences,
    paymentMethods,
    loading,
    updateProfile,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    updateDietaryPreference,
    calculateAgeVerification,
  };
}
