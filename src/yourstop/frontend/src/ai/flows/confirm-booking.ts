/**
 * @fileOverview Confirms a booking and returns a booking ID.
 *
 * - confirmBooking - An async function that confirms a user's booking request.
 * - ConfirmBookingInput - The input type for the confirmBooking function.
 * - ConfirmBookingOutput - The return type for the confirmBooking function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// In a real app, you'd use a database, but we'll use a local JSON file for simplicity.
import { bookings } from '@/lib/data';
import type { Booking } from '@/lib/types';
import { restaurants } from '@/lib/data';

const GuestInfoSchema = z.object({
  name: z.string().describe('The full name of the guest making the reservation.'),
  email: z.string().email().describe('The email address of the guest.'),
  phone: z.string().optional().describe('The phone number of the guest.'),
  specialRequests: z
    .string()
    .optional()
    .describe('Any special requests for the booking.'),
});

export const ConfirmBookingInputSchema = z.object({
  dateTime: z.string().describe('The date and time for the booking (YYYY-MM-DD HH:mm).'),
  partySize: z.number().int().min(1).describe('The number of guests.'),
  guestInfo: GuestInfoSchema,
});
export type ConfirmBookingInput = z.infer<typeof ConfirmBookingInputSchema>;

export const ConfirmBookingOutputSchema = z.object({
  bookingId: z.string().describe('The unique ID for the confirmed booking.'),
  confirmationMessage: z
    .string()
    .describe('A friendly confirmation message for the user.'),
  depositRequired: z.boolean().describe('Whether a deposit is required for this booking.'),
  depositAmount: z.number().optional().describe('The amount of the deposit required.'),
  bookingDetails: ConfirmBookingInputSchema.optional().describe('The details of the booking.'),
});
export type ConfirmBookingOutput = z.infer<typeof ConfirmBookingOutputSchema>;

// This function is what our frontend will call.
export async function confirmBooking(
  input: ConfirmBookingInput
): Promise<ConfirmBookingOutput> {
  // Simple booking confirmation logic without Genkit
  const DEPOSIT_THRESHOLD = 4; // Require deposit for parties > 4
  const DEPOSIT_PER_PERSON = 10; // $10 per person
  
  // Check if deposit is required
  if (input.partySize > DEPOSIT_THRESHOLD) {
    const depositAmount = input.partySize * DEPOSIT_PER_PERSON;
    return {
      bookingId: '', // No ID yet, as booking is not confirmed
      confirmationMessage: `A deposit of $${depositAmount} is required to secure your booking.`,
      depositRequired: true,
      depositAmount: depositAmount,
      bookingDetails: input, // Pass details to the payment step
    };
  }

  // If no deposit is needed, confirm the booking directly.
  const bookingId = `BK-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;
  
  const restaurantId = restaurants[0].id;

  const newBooking: Booking = {
    bookingId,
    restaurantId,
    guestName: input.guestInfo.name,
    guestEmail: input.guestInfo.email,
    guestPhone: input.guestInfo.phone,
    partySize: input.partySize,
    dateTime: input.dateTime,
    specialRequests: input.guestInfo.specialRequests,
    confirmedAt: new Date().toISOString(),
    depositPaid: 0,
  };
  
  console.log('New booking created (in-memory):', newBooking);

  // TODO: Integrate with a real email service like SendGrid, Mailgun, or Resend.
  console.log(`
    ================================
    Simulating sending confirmation email to: ${newBooking.guestEmail}
    Subject: Your Booking is Confirmed!
    
    Hi ${newBooking.guestName},

    Your booking at ${restaurants.find(r => r.id === newBooking.restaurantId)?.name} is confirmed.
    
    Booking ID: ${newBooking.bookingId}
    Date: ${newBooking.dateTime}
    Party Size: ${newBooking.partySize}

    Thank you for using BookMyTable!
    ================================
  `);

  return {
    bookingId: bookingId,
    confirmationMessage: `Your booking is confirmed! Your booking ID is ${bookingId}.`,
    depositRequired: false,
  };
}

const DEPOSIT_THRESHOLD = 4; // Require deposit for parties > 4
const DEPOSIT_PER_PERSON = 10; // $10 per person

const confirmBookingFlow = ai.defineFlow(
  {
    name: 'confirmBookingFlow',
    inputSchema: ConfirmBookingInputSchema,
    outputSchema: ConfirmBookingOutputSchema,
  },
  async (input) => {
    // In a real app, you would have logic here to check for table availability.
    
    // For this demo, we check if a deposit is required.
    if (input.partySize > DEPOSIT_THRESHOLD) {
      const depositAmount = input.partySize * DEPOSIT_PER_PERSON;
      // In a real app, you might create a "pending" booking here.
      // For the demo, we'll just pass the booking details to the next step.
      return {
        bookingId: '', // No ID yet, as booking is not confirmed
        confirmationMessage: `A deposit of $${depositAmount} is required to secure your booking.`,
        depositRequired: true,
        depositAmount: depositAmount,
        bookingDetails: input, // Pass details to the payment step
      };
    }

    // If no deposit is needed, confirm the booking directly.
    const bookingId = `BK-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;
    
    const restaurantId = restaurants[0].id;

    const newBooking: Booking = {
      bookingId,
      restaurantId,
      guestName: input.guestInfo.name,
      guestEmail: input.guestInfo.email,
      guestPhone: input.guestInfo.phone,
      partySize: input.partySize,
      dateTime: input.dateTime,
      specialRequests: input.guestInfo.specialRequests,
      confirmedAt: new Date().toISOString(),
      depositPaid: 0,
    };
    
    console.log('New booking created (in-memory):', newBooking);

    // TODO: Integrate with a real email service like SendGrid, Mailgun, or Resend.
    console.log(`
      ================================
      Simulating sending confirmation email to: ${newBooking.guestEmail}
      Subject: Your Booking is Confirmed!
      
      Hi ${newBooking.guestName},

      Your booking at ${restaurants.find(r => r.id === newBooking.restaurantId)?.name} is confirmed.
      
      Booking ID: ${newBooking.bookingId}
      Date: ${newBooking.dateTime}
      Party Size: ${newBooking.partySize}

      Thank you for using BookMyTable!
      ================================
    `);

    return {
      bookingId: bookingId,
      confirmationMessage: `Your booking is confirmed! Your booking ID is ${bookingId}.`,
      depositRequired: false,
    };
  }
);
