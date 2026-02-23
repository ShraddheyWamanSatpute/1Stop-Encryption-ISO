/**
 * @fileOverview Provides a Genkit flow to suggest available booking slots for a restaurant.
 *
 * - suggestBookingSlots - An async function that takes user preferences and returns suggested booking slots.
 * - SuggestBookingSlotsInput - The input type for the suggestBookingSlots function.
 * - SuggestBookingSlotsOutput - The return type for the suggestBookingSlots function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { bookings } from '@/lib/data';
import type { Booking } from '@/lib/types';


// In a real app, you would fetch this from a database.
const RESTAURANT_CAPACITY = 20; // Assume 20 tables available in total.

/**
 * A Genkit tool that retrieves all bookings for a given date.
 * The LLM can use this tool to check for availability.
 */
const getBookingsForDate = ai.defineTool(
    {
        name: 'getBookingsForDate',
        description: 'Returns a list of all bookings for a specific date.',
        inputSchema: z.object({
            date: z.string().describe('The date to retrieve bookings for (YYYY-MM-DD).'),
        }),
        outputSchema: z.array(z.object({
            dateTime: z.string(),
            partySize: z.number(),
        })),
    },
    async (input) => {
        console.log(`Tool getBookingsForDate called with date: ${input.date}`);
        // In a real app, you'd query your database here.
        // For now, we filter our JSON "database".
        const relevantBookings = bookings.filter(booking => booking.dateTime.startsWith(input.date));
        
        return relevantBookings.map(b => ({
            dateTime: b.dateTime,
            partySize: b.partySize
        }));
    }
);


const SuggestBookingSlotsInputSchema = z.object({
  preferredDate: z.string().describe('The preferred date for the reservation (YYYY-MM-DD).'),
  preferredTime: z.string().describe('The preferred time for the reservation (HH:mm).'),
  partySize: z.number().int().min(1).describe('The number of guests in the party.'),
});
export type SuggestBookingSlotsInput = z.infer<typeof SuggestBookingSlotsInputSchema>;

const SuggestBookingSlotsOutputSchema = z.object({
  suggestedSlots: z.array(
    z.object({
      dateTime: z.string().describe('A suggested date and time (YYYY-MM-DD HH:mm).'),
      availableTables: z.number().int().min(0).describe('Number of tables available at this time.'),
    })
  ).describe('A list of suggested booking slots.'),
  reasoning: z.string().optional().describe('The LLM reasoning for slot suggestions.'),
});
export type SuggestBookingSlotsOutput = z.infer<typeof SuggestBookingSlotsOutputSchema>;

export async function suggestBookingSlots(input: SuggestBookingSlotsInput): Promise<SuggestBookingSlotsOutput> {
  // Simple booking slot suggestion logic without Genkit
  const { preferredDate, preferredTime, partySize } = input;
  
  // Get existing bookings for the date
  const existingBookings = bookings.filter(booking => 
    booking.dateTime.startsWith(preferredDate)
  );
  
  // Generate time slots around the preferred time
  const timeSlots = [];
  const preferredHour = parseInt(preferredTime.split(':')[0]);
  
  // Generate slots from 2 hours before to 2 hours after preferred time
  for (let hourOffset = -2; hourOffset <= 2; hourOffset++) {
    const slotHour = preferredHour + hourOffset;
    if (slotHour >= 10 && slotHour <= 22) { // Restaurant hours 10 AM to 10 PM
      const slotTime = `${slotHour.toString().padStart(2, '0')}:00`;
      const slotDateTime = `${preferredDate} ${slotTime}`;
      
      // Count bookings at this time slot
      const bookingsAtSlot = existingBookings.filter(booking => 
        booking.dateTime === slotDateTime
      ).length;
      
      const availableTables = Math.max(0, RESTAURANT_CAPACITY - bookingsAtSlot);
      
      timeSlots.push({
        dateTime: slotDateTime,
        availableTables: availableTables
      });
    }
  }
  
  // Filter slots that have enough capacity for the party
  const suitableSlots = timeSlots.filter(slot => slot.availableTables >= Math.ceil(partySize / 4));
  
  // Sort chronologically
  suitableSlots.sort((a, b) => {
    const timeA = new Date(a.dateTime).getTime();
    const timeB = new Date(b.dateTime).getTime();
    return timeA - timeB;
  });
  
  // Find the preferred time slot index
  const preferredTimeMs = new Date(`${preferredDate} ${preferredTime}`).getTime();
  const preferredIndex = suitableSlots.findIndex(slot => 
    Math.abs(new Date(slot.dateTime).getTime() - preferredTimeMs) < 30 * 60 * 1000 // Within 30 minutes
  );
  
  let suggestedSlots;
  
  if (preferredIndex !== -1) {
    // If preferred time is available, show it first, then nearby slots
    const startIndex = Math.max(0, preferredIndex - 1);
    const endIndex = Math.min(suitableSlots.length, startIndex + 3);
    suggestedSlots = suitableSlots.slice(startIndex, endIndex);
  } else {
    // If preferred time is not available, show the 3 closest slots chronologically
    suggestedSlots = suitableSlots.slice(0, 3);
  }
  
  // If no suitable slots, suggest the most available slots
  if (suggestedSlots.length === 0) {
    const mostAvailableSlots = timeSlots
      .sort((a, b) => b.availableTables - a.availableTables)
      .slice(0, 3);
    
    return {
      suggestedSlots: mostAvailableSlots,
      reasoning: `Your preferred time is fully booked, but I found these alternative slots with the most availability.`
    };
  }
  
  let reasoning = `Found ${suggestedSlots.length} suitable time slot${suggestedSlots.length > 1 ? 's' : ''} for your party of ${partySize}.`;
  
  // Check if the preferred time is in the suggested slots
  const preferredTimeSlot = suggestedSlots.find(slot => 
    Math.abs(new Date(slot.dateTime).getTime() - preferredTimeMs) < 30 * 60 * 1000
  );
  
  if (preferredTimeSlot) {
    reasoning += ` Your preferred time is available!`;
  } else {
    reasoning += ` I've suggested the closest available times to your preference.`;
  }
  
  return {
    suggestedSlots,
    reasoning
  };
}

const suggestBookingSlotsPrompt = ai.definePrompt({
  name: 'suggestBookingSlotsPrompt',
  input: {schema: SuggestBookingSlotsInputSchema},
  output: {schema: SuggestBookingSlotsOutputSchema},
  tools: [getBookingsForDate],
  prompt: `You are an expert restaurant reservation assistant. 
Your goal is to suggest three available booking slots to a user based on their preferences.

The restaurant has a total capacity of ${RESTAURANT_CAPACITY} tables.

User Preferences:
- Preferred Date: {{{preferredDate}}}
- Preferred Time: {{{preferredTime}}}
- Party Size: {{{partySize}}}

Instructions:
1. Use the 'getBookingsForDate' tool to fetch all existing bookings for the user's preferred date.
2. Analyze the existing bookings to determine the number of booked tables at hourly intervals (e.g., 18:00, 19:00, 20:00).
3. Calculate the number of available tables for each interval by subtracting the booked tables from the total capacity.
4. Suggest three suitable time slots for the user's party size, starting from their preferred time. 
5. Ensure that the suggested slots have enough tables available.
6. If the preferred time is fully booked, suggest the next available slots.
7. Provide a brief reasoning for your suggestions, especially if you have to suggest alternatives.

Example Output Format:
{
  "suggestedSlots": [
    { "dateTime": "2024-07-20 19:00", "availableTables": 2 },
    { "dateTime": "2024-07-20 20:00", "availableTables": 5 },
    { "dateTime": "2024-07-20 21:00", "availableTables": 8 }
  ],
  "reasoning": "Your preferred time at 19:00 is available. I've also listed other times with more availability." 
}
`,
});

const suggestBookingSlotsFlow = ai.defineFlow(
  {
    name: 'suggestBookingSlotsFlow',
    inputSchema: SuggestBookingSlotsInputSchema,
    outputSchema: SuggestBookingSlotsOutputSchema,
  },
  async input => {
    const {output} = await suggestBookingSlotsPrompt(input);
    return output!;
  }
);
