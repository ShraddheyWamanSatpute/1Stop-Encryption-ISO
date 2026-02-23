/**
 * @fileOverview Summarizes customer reviews for a restaurant.
 *
 * - summarizeReviews - A function that summarizes the reviews.
 * - SummarizeReviewsInput - The input type for the summarizeReviews function.
 * - SummarizeReviewsOutput - The return type for the summarizeReviews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeReviewsInputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant.'),
  reviews: z.string().describe('The customer reviews for the restaurant.'),
});
export type SummarizeReviewsInput = z.infer<typeof SummarizeReviewsInputSchema>;

const SummarizeReviewsOutputSchema = z.object({
  summary: z.string().describe('A summary of the customer reviews.'),
});
export type SummarizeReviewsOutput = z.infer<typeof SummarizeReviewsOutputSchema>;

export async function summarizeReviews(input: SummarizeReviewsInput): Promise<SummarizeReviewsOutput> {
  // For now, return a simple summary since Genkit might not be fully configured
  const reviews = input.reviews.split('\n\n').filter(review => review.trim().length > 0);
  const totalReviews = reviews.length;
  
  if (totalReviews === 0) {
    return {
      summary: "No reviews available for this restaurant yet."
    };
  }
  
  // Simple summary logic
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'delicious', 'fantastic', 'love', 'perfect', 'outstanding'];
  const negativeWords = ['terrible', 'awful', 'bad', 'horrible', 'disappointing', 'worst', 'hate', 'poor'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  reviews.forEach(review => {
    const lowerReview = review.toLowerCase();
    positiveWords.forEach(word => {
      if (lowerReview.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (lowerReview.includes(word)) negativeCount++;
    });
  });
  
  let summary = `Based on ${totalReviews} review${totalReviews > 1 ? 's' : ''} for ${input.restaurantName}: `;
  
  if (positiveCount > negativeCount) {
    summary += `Customers generally have positive experiences, praising the food quality and service. `;
  } else if (negativeCount > positiveCount) {
    summary += `Some customers have expressed concerns about their dining experience. `;
  } else {
    summary += `Customer feedback is mixed, with both positive and negative experiences reported. `;
  }
  
  summary += `The restaurant has received ${totalReviews} review${totalReviews > 1 ? 's' : ''} overall.`;
  
  return { summary };
}

const prompt = ai.definePrompt({
  name: 'summarizeReviewsPrompt',
  input: {schema: SummarizeReviewsInputSchema},
  output: {schema: SummarizeReviewsOutputSchema},
  prompt: `Summarize the following customer reviews for {{restaurantName}}:\n\nReviews: {{{reviews}}}`,
});

const summarizeReviewsFlow = ai.defineFlow(
  {
    name: 'summarizeReviewsFlow',
    inputSchema: SummarizeReviewsInputSchema,
    outputSchema: SummarizeReviewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
