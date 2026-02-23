/**
 * @fileOverview Processes a simulated payment and finalizes a booking.
 *
 * - processPayment - An async function that handles the payment and booking confirmation.
 * - ProcessPaymentInput - The input type for the processPayment function.
 * - ProcessPaymentOutput - The return type for the processPayment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Booking } from '@/lib/types';
import { restaurants } from '@/lib/data';
import type { ConfirmBookingInput } from './confirm-booking';
import { ConfirmBookingInputSchema } from './confirm-booking';

export const ProcessPaymentInputSchema = z.object({
  bookingDetails: ConfirmBookingInputSchema,
  depositAmount: z.number().describe('The amount of the deposit to be "paid".'),
});
export type ProcessPaymentInput = z.infer<typeof ProcessPaymentInputSchema>;

export const ProcessPaymentOutputSchema = z.object({
  bookingId: z.string().describe('The unique ID for the confirmed booking.'),
  transactionId: z.string().describe('The simulated transaction ID.'),
  confirmationMessage: z
    .string()
    .describe('A friendly confirmation message for the user.'),
});
export type ProcessPaymentOutput = z.infer<typeof ProcessPaymentOutputSchema>;

// Removed standalone function - using Genkit flow instead

export const processPaymentFlow = ai.defineFlow(
  {
    name: 'processPaymentFlow',
    inputSchema: ProcessPaymentInputSchema,
    outputSchema: ProcessPaymentOutputSchema,
  },
  async (input) => {
    try {
      // In a real app, you would integrate with a payment gateway like Stripe here.
      // This flow would be called from your payment provider's webhook or callback.

      // For this demo, we will simulate a successful payment.
      console.log(`Simulating payment of $${input.depositAmount}...`);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 95% success rate
      const isSuccess = Math.random() > 0.05;
      
      if (!isSuccess) {
        throw new Error('Payment failed. Please try again or use a different payment method.');
      }

      const transactionId = `TR-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)
        .toUpperCase()}`;
      console.log(`Simulated payment successful. Transaction ID: ${transactionId}`);

      // Now that "payment" is successful, create the final booking.
      const bookingId = `BK-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase()}`;
      
      const restaurantId = restaurants[0].id;
      const bookingDetails = input.bookingDetails;

      const newBooking: Booking = {
        bookingId,
        restaurantId,
        guestName: bookingDetails.guestInfo.name,
        guestEmail: bookingDetails.guestInfo.email,
        guestPhone: bookingDetails.guestInfo.phone,
        partySize: bookingDetails.partySize,
        dateTime: bookingDetails.dateTime,
        specialRequests: bookingDetails.guestInfo.specialRequests,
        confirmedAt: new Date().toISOString(),
        depositPaid: input.depositAmount,
      };

      console.log('New booking created after payment (in-memory):', newBooking);

      // TODO: Integrate with a real email service like SendGrid, Mailgun, or Resend.
      console.log(`
        ================================
        Simulating sending confirmation email to: ${newBooking.guestEmail}
        Subject: Your Booking is Confirmed!
        
        Hi ${newBooking.guestName},

        Your booking at ${restaurants.find(r => r.id === newBooking.restaurantId)?.name} is confirmed.
        We have successfully received your deposit of $${newBooking.depositPaid}.
        
        Booking ID: ${newBooking.bookingId}
        Date: ${newBooking.dateTime}
        Party Size: ${newBooking.partySize}

        Thank you for using BookMyTable!
        ================================
      `);

      return {
        bookingId,
        transactionId,
        confirmationMessage: `Your payment was successful and your booking is confirmed! Your booking ID is ${bookingId}.`,
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }
);
