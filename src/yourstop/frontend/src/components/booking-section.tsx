import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
// Types for API responses
type SuggestBookingSlotsOutput = {
  suggestedSlots: Array<{
    dateTime: string;
    available: boolean;
    reason?: string;
  }>;
  reasoning?: string;
};

type ConfirmBookingOutput = {
  bookingId: string;
  confirmationMessage: string;
  depositRequired: boolean;
  depositAmount?: number;
  bookingDetails?: any;
};

type ProcessPaymentOutput = {
  bookingId: string;
  transactionId: string;
  confirmationMessage: string;
};

type ConfirmBookingInput = {
  dateTime: string;
  partySize: number;
  guestInfo: {
    name: string;
    email: string;
    phone?: string;
    specialRequests?: string;
  };
};


import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, CreditCard, Loader2, Users, CheckCircle, ArrowRight, ArrowLeft, MapPin, Phone, Mail, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';

const bookingFinderSchema = z.object({
  partySize: z
    .string()
    .min(1, { message: 'Please select the number of guests.' }),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().min(1, { message: 'Please select a time.' }),
});

type BookingFinderFormValues = z.infer<typeof bookingFinderSchema>;

const guestInfoSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  email: z.string().email({ message: 'A valid email is required.' }),
  phone: z.string().optional(),
  specialRequests: z.string().optional(),
});

type GuestInfoFormValues = z.infer<typeof guestInfoSchema>;

type BookingStep = 'find' | 'details' | 'payment' | 'confirmed';

// Progress indicator component
function BookingProgress({ currentStep }: { currentStep: BookingStep }) {
  const steps = [
    { id: 'find', label: 'Find Table' },
    { id: 'details', label: 'Details' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirmed', label: 'Confirmed' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-8">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-300 shadow-sm",
                isCompleted && "bg-blue-600 border-blue-600 text-white shadow-md",
                isCurrent && "bg-blue-600 border-blue-600 text-white shadow-md ring-4 ring-blue-100",
                !isCompleted && !isCurrent && "bg-white border-blue-200 text-blue-400"
              )}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span className={cn(
                "ml-3 text-sm font-medium",
                isCurrent && "text-blue-600 font-semibold",
                isCompleted && "text-gray-600",
                !isCompleted && !isCurrent && "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BookingSection() {
  const { user, loading: authLoading } = useCustomerAuth();
  const [step, setStep] = useState<BookingStep>('find');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestBookingSlotsOutput | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<ConfirmBookingOutput | null>(null);
  const [bookingDetails, setBookingDetails] = useState<ProcessPaymentOutput | null>(null);
  const { toast } = useToast();

  const findTableForm = useForm<BookingFinderFormValues>({
    resolver: zodResolver(bookingFinderSchema),
    defaultValues: {
      partySize: '2',
      time: '19:00',
    },
  });

  const guestInfoForm = useForm<GuestInfoFormValues>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      specialRequests: '',
    },
  });

  // Reset form when step changes to details
  useEffect(() => {
    if (step === 'details') {
      // Reset the form with empty data
      guestInfoForm.reset({
        name: '',
        email: '',
        phone: '',
        specialRequests: '',
      });
    }
  }, [step, guestInfoForm]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
          <div className="px-8 py-12 text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-3" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="px-8 pb-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required message if user is not logged in
  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
          <div className="px-8 py-12 text-center border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-semibold text-gray-900 mb-3">
              Sign In Required
            </CardTitle>
            <CardDescription className="text-gray-600 max-w-xl mx-auto mb-6">
              Please sign in to your account to make a reservation. This helps us manage your bookings and provide you with the best service.
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/YourStop/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link to="/YourStop/auth">
                <Button variant="outline" className="h-12 px-8 font-medium rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const timeOptions = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 10;
    return `${hour < 10 ? '0' : ''}${hour}:00`;
  });

  async function onFindTableSubmit(data: BookingFinderFormValues) {
    setLoading(true);
    setSuggestions(null);
    setSelectedSlot(null);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch('/api/suggest-booking-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: 'rest-1', // Default restaurant ID for now
          date: format(data.date, 'yyyy-MM-dd'),
          partySize: parseInt(data.partySize, 10),
          preferences: {
            preferredTime: data.time,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking suggestions');
      }
      
      const result = await response.json();
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to get booking suggestions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch booking suggestions. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSelectSlot(slot: string) {
    setSelectedSlot(slot);
    setStep('details');
  }

  async function onGuestInfoSubmit(data: GuestInfoFormValues) {
    if (!selectedSlot || !findTableForm.getValues().partySize) return;

    setLoading(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch('/api/confirm-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateTime: selectedSlot,
          partySize: parseInt(findTableForm.getValues().partySize, 10),
          guestInfo: data,
        } as ConfirmBookingInput),
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm booking');
      }
      
      const result = await response.json();
      setPendingBooking(result);
      
      if (result.depositRequired) {
        setStep('payment');
      } else {
        setStep('confirmed');
        setBookingDetails({
          bookingId: result.bookingId,
          transactionId: 'no-payment-required',
          confirmationMessage: result.confirmationMessage,
        });
      }
    } catch (error) {
      console.error('Failed to confirm booking:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not confirm booking. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!pendingBooking) return;

    setLoading(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: pendingBooking.bookingId,
          amount: pendingBooking.depositAmount,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process payment');
      }
      
      const result = await response.json();
      setBookingDetails(result);
      setStep('confirmed');
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process payment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleGoBack() {
    if(step === 'details') {
      setStep('find');
    } else if (step === 'payment') {
      setStep('details');
    }
  }

  function handleMakeAnotherBooking() {
    setStep('find');
    setSuggestions(null);
    setSelectedSlot(null);
    setPendingBooking(null);
    setBookingDetails(null);
    findTableForm.reset();
    guestInfoForm.reset();
  }

  if (step === 'confirmed' && bookingDetails) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
          <div className="px-8 py-12 text-center bg-gradient-to-r from-blue-50 to-white">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900 mb-3">
              Booking Confirmed!
            </CardTitle>
            <CardDescription className="text-gray-600 mb-8 max-w-lg mx-auto">
              {bookingDetails.confirmationMessage}
            </CardDescription>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg" 
              onClick={handleMakeAnotherBooking}
            >
              Make Another Booking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment' && pendingBooking) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
          <div className="px-8 py-8 text-center border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white">
            <Button 
              variant="ghost" 
              onClick={handleGoBack} 
              className="absolute left-8 top-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900 mb-3">
              Confirm Your Deposit
            </CardTitle>
            <CardDescription className="text-gray-600">
              A deposit of <span className="font-medium text-blue-600">${pendingBooking.depositAmount}</span> is required for parties of <span className="font-medium text-blue-600">{pendingBooking.bookingDetails?.partySize}</span> or more.
            </CardDescription>
          </div>
          <div className="p-8">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center text-gray-600 mb-6">
              In a real application, this is where you would integrate a payment provider like Stripe or PayPal. For this demo, clicking "Pay Now" will simulate a successful payment.
            </div>
            <div className="text-center">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50" 
                onClick={handlePayment} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${pendingBooking.depositAmount} Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'details' && selectedSlot) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 py-8 text-center border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white">
            <Button 
              variant="ghost" 
              onClick={handleGoBack} 
              className="absolute left-8 top-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900 mb-3">
              Confirm Your Details
            </CardTitle>
            <CardDescription className="text-gray-600">
              You're reserving a table for{' '}
              <span className="font-medium text-blue-600">{findTableForm.getValues().partySize}</span> guests on{' '}
              <span className="font-medium text-blue-600">{format(new Date(selectedSlot), 'MMM d, yyyy')}</span> at{' '}
              <span className="font-medium text-blue-600">{format(new Date(selectedSlot), 'h:mm a')}</span>.
            </CardDescription>
          </div>

          {/* Progress Indicator */}
          <div className="px-8 pt-6">
            <BookingProgress currentStep={step} />
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            <Form {...guestInfoForm}>
              <form
                key={`guest-form-${step}-${selectedSlot}`}
                onSubmit={guestInfoForm.handleSubmit(onGuestInfoSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={guestInfoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                          <User className="w-4 h-4 mr-2 text-blue-500" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            className="h-12 border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:border-blue-300 transition-colors"
                            placeholder="John Doe" 
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={guestInfoForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-blue-500" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            className="h-12 border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:border-blue-300 transition-colors"
                            placeholder="you@example.com"
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={guestInfoForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-blue-500" />
                        Phone Number (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          className="h-12 border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:border-blue-300 transition-colors"
                          placeholder="(123) 456-7890" 
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={guestInfoForm.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                        Special Requests (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[100px] border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:border-blue-300 transition-colors resize-none"
                          placeholder="e.g., allergies, high chair, window seat, dietary restrictions"
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-center pt-4">
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Confirm Details
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 py-12 text-center border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-semibold text-gray-900 mb-3">
            Reserve a Table
          </CardTitle>
          <CardDescription className="text-gray-600 max-w-xl mx-auto">
            Book your perfect dining experience in just a few simple steps.
          </CardDescription>
        </div>

        {/* Progress Indicator */}
        <div className="px-8 pt-8">
          <BookingProgress currentStep={step} />
        </div>

        {/* Form Content */}
        <div className="px-8 pb-8">
          <Form {...findTableForm}>
            <form
              onSubmit={findTableForm.handleSubmit(onFindTableSubmit)}
              className="space-y-8"
            >
              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={findTableForm.control}
                  name="partySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                        <Users className="w-4 h-4 mr-2 text-blue-500" />
                        Party Size
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:border-blue-300 transition-colors">
                            <SelectValue placeholder="Select guests" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border border-blue-200 shadow-lg bg-white">
                          {[...Array(8)].map((_, i) => (
                            <SelectItem key={i + 1} value={`${i + 1}`} className="py-3 hover:bg-blue-50 focus:bg-blue-50">
                              {i + 1} guest{i > 0 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={findTableForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                        Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'h-12 justify-start text-left border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:border-blue-300 transition-colors',
                                !field.value && 'text-gray-500'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'MMM d, yyyy')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 text-blue-400" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border border-blue-200 shadow-lg bg-white" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                              date > addDays(new Date(), 90)
                            }
                            initialFocus
                            className="rounded-lg"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={findTableForm.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        Time
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:border-blue-300 transition-colors">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border border-blue-200 shadow-lg bg-white">
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time} className="py-3 hover:bg-blue-50 focus:bg-blue-50">
                              {format(new Date(`1970-01-01T${time}`), 'h:mm a')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Submit Button */}
              <div className="text-center pt-6">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Tables...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Find Available Tables
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {suggestions && (
            <div className="mt-8 border-t border-blue-100 pt-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Available Time Slots
                </h3>
                {suggestions.reasoning && (
                  <p className="text-sm text-gray-600">
                    {suggestions.reasoning}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {suggestions.suggestedSlots.map((slot) => (
                  <Button
                    key={slot.dateTime}
                    variant={slot.available ? 'default' : 'outline'}
                    disabled={!slot.available}
                    className={cn(
                      "h-10 text-sm font-medium rounded-lg transition-all duration-200",
                      slot.available 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md" 
                        : "bg-blue-50 text-blue-300 cursor-not-allowed border-blue-200"
                    )}
                    onClick={() => slot.available && handleSelectSlot(slot.dateTime)}
                  >
                    {format(new Date(slot.dateTime), 'h:mm a')}
                  </Button>
                ))}
              </div>
              {suggestions.suggestedSlots.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">No available slots found for the selected date and time.</p>
                  <p className="text-gray-400 text-sm mt-1">Please try a different date or time.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
