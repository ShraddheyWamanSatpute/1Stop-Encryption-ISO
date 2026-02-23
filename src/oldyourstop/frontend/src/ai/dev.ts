import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-reviews';
import '@/ai/flows/suggest-booking-slots';
import '@/ai/flows/confirm-booking';
import '@/ai/flows/process-payment';
