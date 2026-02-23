'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';

export interface AgeVerification {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_verified';
  documentType: 'drivers_license' | 'passport' | 'state_id' | 'military_id';
  documentNumber: string;
  dateOfBirth: string;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  documentImageUrl?: string;
  selfieImageUrl?: string;
}

interface AgeVerificationContextType {
  verification: AgeVerification | null;
  isVerifying: boolean;
  uploadDocument: (file: File, documentType: string, documentNumber: string, dateOfBirth: string) => Promise<void>;
  uploadSelfie: (file: File) => Promise<void>;
  submitVerification: () => Promise<void>;
  loading: boolean;
}

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined);

export function AgeVerificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [verification, setVerification] = useState<AgeVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (user) {
      // Load verification status from localStorage (in a real app, this would be from a database)
      const savedVerification = localStorage.getItem(`age_verification_${user.uid}`);
      if (savedVerification) {
        try {
          setVerification(JSON.parse(savedVerification));
        } catch (error) {
          console.error('Error loading age verification:', error);
        }
      }
    } else {
      setVerification(null);
    }
    setLoading(false);
  }, [user]);

  const saveVerification = (verificationData: AgeVerification) => {
    if (user) {
      localStorage.setItem(`age_verification_${user.uid}`, JSON.stringify(verificationData));
    }
    setVerification(verificationData);
  };

  const uploadDocument = async (file: File, documentType: string, documentNumber: string, dateOfBirth: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsVerifying(true);
    try {
      // Simulate file upload to Firebase Storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const documentImageUrl = URL.createObjectURL(file); // In real app, this would be the Firebase Storage URL
      
      const verificationData: AgeVerification = {
        id: `verification_${Date.now()}`,
        userId: user.uid,
        status: 'pending',
        documentType: documentType as AgeVerification['documentType'],
        documentNumber,
        dateOfBirth,
        uploadedAt: new Date().toISOString(),
        documentImageUrl,
      };

      saveVerification(verificationData);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  const uploadSelfie = async (file: File) => {
    if (!user || !verification) throw new Error('No verification in progress');

    setIsVerifying(true);
    try {
      // Simulate file upload to Firebase Storage
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const selfieImageUrl = URL.createObjectURL(file); // In real app, this would be the Firebase Storage URL
      
      const updatedVerification = {
        ...verification,
        selfieImageUrl,
      };

      saveVerification(updatedVerification);
    } catch (error) {
      console.error('Error uploading selfie:', error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  const submitVerification = async () => {
    if (!user || !verification) throw new Error('No verification to submit');

    setIsVerifying(true);
    try {
      // Simulate verification process (in real app, this would call an AI service or manual review)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate verification result (in real app, this would be determined by AI or manual review)
      const isApproved = Math.random() > 0.2; // 80% approval rate for demo
      
      const updatedVerification: AgeVerification = {
        ...verification,
        status: isApproved ? 'approved' : 'rejected',
        verifiedAt: new Date().toISOString(),
        rejectionReason: isApproved ? undefined : 'Document quality insufficient. Please ensure all text is clearly visible and the image is well-lit.',
      };

      saveVerification(updatedVerification);
    } catch (error) {
      console.error('Error submitting verification:', error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  const value = {
    verification,
    isVerifying,
    uploadDocument,
    uploadSelfie,
    submitVerification,
    loading,
  };

  return (
    <AgeVerificationContext.Provider value={value}>
      {children}
    </AgeVerificationContext.Provider>
  );
}

export function useAgeVerification() {
  const context = useContext(AgeVerificationContext);
  if (context === undefined) {
    throw new Error('useAgeVerification must be used within an AgeVerificationProvider');
  }
  return context;
}