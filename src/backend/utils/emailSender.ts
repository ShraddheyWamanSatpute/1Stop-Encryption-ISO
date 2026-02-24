import emailjs from '@emailjs/browser';
import { consentService } from '../services/gdpr/ConsentService';

interface EmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Check if email is marketing-related
 */
function isMarketingEmail(subject: string, body: string): boolean {
  const marketingKeywords = [
    'promotion', 'promo', 'offer', 'discount', 'sale', 'deal',
    'newsletter', 'subscribe', 'unsubscribe', 'marketing',
    'advertisement', 'ad', 'campaign', 'special', 'limited time',
    'exclusive', 'new product', 'announcement', 'event', 'webinar',
  ];
  const combined = `${subject.toLowerCase()} ${body.toLowerCase()}`;
  return marketingKeywords.some(keyword => combined.includes(keyword));
}

// EmailJS Configuration
// Get these free from https://www.emailjs.com/
const EMAILJS_CONFIG = {
  serviceId: 'your_service_id',  // Replace with your EmailJS service ID
  templateId: 'your_template_id', // Replace with your EmailJS template ID
  publicKey: 'your_public_key'   // Replace with your EmailJS public key
};

// Check if EmailJS is configured
function isConfigured(): boolean {
  return EMAILJS_CONFIG.serviceId !== 'your_service_id' &&
         EMAILJS_CONFIG.templateId !== 'your_template_id' &&
         EMAILJS_CONFIG.publicKey !== 'your_public_key';
}

/**
 * Send a test email using EmailJS (super simple!)
 * No backend, no Firestore, no OAuth!
 */
export async function sendTestEmail(
  recipientEmail: string,
  senderName: string = '1Stop System'
): Promise<EmailResult> {
  // Check if EmailJS is configured
  if (!isConfigured()) {
    return {
      success: false,
      error: `EmailJS not configured yet! 
      
Please follow these steps:
1. Sign up FREE at https://www.emailjs.com/
2. Create an email service and template
3. Update the config in src/backend/utils/emailSender.ts

See EMAILJS_SETUP.md for detailed instructions.`
    };
  }

  try {
    const templateParams = {
      to_email: recipientEmail,
      from_name: senderName,
      subject: 'Test Email from 1Stop System',
      message: `Hello,

This is a test email from your 1Stop booking system to verify that your email configuration is working correctly.

Sent at: ${new Date().toLocaleString()}

If you received this email, your email integration is working properly!

Best regards,
1Stop Team`,
      reply_to: recipientEmail
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    if (response.status === 200) {
      return {
        success: true,
        message: `Test email sent successfully to ${recipientEmail}!`
      };
    } else {
      return {
        success: false,
        error: 'Failed to send email'
      };
    }
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    
    let errorMessage = 'Failed to send email';
    const errorObj = error as { text?: string; message?: string; status?: number };
    
    if (errorObj.text) {
      errorMessage = `EmailJS Error: ${errorObj.text}`;
    } else if (errorObj.message) {
      errorMessage = errorObj.message;
    }
    
    // Add helpful hint for common errors
    if (errorObj.status === 400 || errorObj.text?.includes('Invalid')) {
      errorMessage += '\n\nPlease check your EmailJS configuration in src/backend/utils/emailSender.ts';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send a custom email using EmailJS
 * 
 * Consent enforcement: If email is marketing-related, verifies marketing consent before sending.
 */
export async function sendEmail(
  recipientEmail: string,
  subject: string,
  message: string,
  senderName: string = '1Stop System',
  options?: {
    userId?: string;
    companyId?: string;
    skipConsentCheck?: boolean; // For non-marketing emails (system notifications, etc.)
  }
): Promise<EmailResult> {
  // Check if EmailJS is configured
  if (!isConfigured()) {
    return {
      success: false,
      error: `EmailJS not configured yet! 
      
Please follow these steps:
1. Sign up FREE at https://www.emailjs.com/
2. Create an email service and template
3. Update the config in src/backend/utils/emailSender.ts

See EMAILJS_SETUP.md for detailed instructions.`
    };
  }

  // Consent enforcement: Check marketing consent if email is marketing-related (GDPR Art. 6(1)(a))
  if (!options?.skipConsentCheck && options?.userId && options?.companyId) {
    const isMarketing = isMarketingEmail(subject, message);
    if (isMarketing) {
      try {
        const hasConsent = await consentService.hasConsent(
          options.userId,
          options.companyId,
          'marketing_communications'
        );
        
        if (!hasConsent) {
          return {
            success: false,
            error: 'Marketing consent required. Recipient must opt-in to marketing emails. Please check Settings → Preferences → Marketing Notifications.',
          };
        }
      } catch (err) {
        console.error('[emailSender] Error checking marketing consent:', err);
        // Continue with send if consent check fails (fail open for now, but log error)
      }
    }
  }

  try {
    const templateParams = {
      to_email: recipientEmail,
      from_name: senderName,
      subject: subject,
      message: message,
      reply_to: recipientEmail
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    if (response.status === 200) {
      return {
        success: true,
        message: `Email sent successfully to ${recipientEmail}!`
      };
    } else {
      return {
        success: false,
        error: 'Failed to send email'
      };
    }
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    
    let errorMessage = 'Failed to send email';
    const errorObj = error as { text?: string; message?: string; status?: number };
    
    if (errorObj.text) {
      errorMessage = `EmailJS Error: ${errorObj.text}`;
    } else if (errorObj.message) {
      errorMessage = errorObj.message;
    }
    
    // Add helpful hint for common errors
    if (errorObj.status === 400 || errorObj.text?.includes('Invalid')) {
      errorMessage += '\n\nPlease check your EmailJS configuration in src/backend/utils/emailSender.ts';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
