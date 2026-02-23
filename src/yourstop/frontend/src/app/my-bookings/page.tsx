import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, Calendar, Clock, Users, Utensils, X, Edit, CheckCircle } from 'lucide-react';
import { customerBookingService, CustomerBooking, BookingFilters } from '@/lib/customer-booking-service';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BookingModifyModal } from '@/components/booking-modify-modal';

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const [upcomingBookings, setUpcomingBookings] = useState<CustomerBooking[]>([]);
  const [pastBookings, setPastBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [modifyingBooking, setModifyingBooking] = useState<CustomerBooking | null>(null);
  const [showModifyModal, setShowModifyModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const loadBookings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [upcoming, past] = await Promise.all([
        customerBookingService.getUpcomingBookings(user.uid),
        customerBookingService.getPastBookings(user.uid),
      ]);

      // Filter out cancelled and no-show bookings from upcoming
      setUpcomingBookings(
        upcoming.filter(
          b => b.status === 'pending' || b.status === 'confirmed'
        ).sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        })
      );

      // Include all past bookings
      setPastBookings(
        past.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB.getTime() - dateA.getTime();
        })
      );
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: 'Error loading bookings',
        description: 'Failed to load your bookings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, loadBookings]);

  // Real-time booking updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = customerBookingService.subscribeToUserBookings(
      user.uid,
      (bookings) => {
        // Separate into upcoming and past
        const now = new Date();
        const upcoming = bookings
          .filter(b => {
            const bookingDate = new Date(`${b.date}T${b.time}`);
            return bookingDate >= now && (b.status === 'pending' || b.status === 'confirmed');
          })
          .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
          });

        const past = bookings
          .filter(b => {
            const bookingDate = new Date(`${b.date}T${b.time}`);
            return bookingDate < now || b.status === 'completed' || b.status === 'cancelled';
          })
          .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB.getTime() - dateA.getTime();
          });

        setUpcomingBookings(upcoming);
        setPastBookings(past);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return;

    setCancellingBookingId(bookingId);
    setShowCancelDialog(true);
  };

  const confirmCancelBooking = async () => {
    if (!user || !cancellingBookingId) return;

    try {
      const success = await customerBookingService.cancelBooking(
        cancellingBookingId,
        user.uid,
        'Cancelled by customer'
      );

      if (success) {
        toast({
          title: 'Booking cancelled',
          description: 'Your booking has been successfully cancelled.',
        });
        await loadBookings();
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error cancelling booking',
        description: 'Failed to cancel your booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowCancelDialog(false);
      setCancellingBookingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: CustomerBooking['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      completed: 'outline',
      'no-show': 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const displayedBookings = filter === 'upcoming' ? upcomingBookings : pastBookings;
  const allBookings = [...upcomingBookings, ...pastBookings];

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-12">
      <header className="mb-8">
        <h1 className="font-headline text-5xl font-bold">My Bookings</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          View and manage your reservations.
        </p>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 border-b">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className="rounded-b-none"
        >
          All ({allBookings.length})
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'ghost'}
          onClick={() => setFilter('upcoming')}
          className="rounded-b-none"
        >
          Upcoming ({upcomingBookings.length})
        </Button>
        <Button
          variant={filter === 'past' ? 'default' : 'ghost'}
          onClick={() => setFilter('past')}
          className="rounded-b-none"
        >
          Past ({pastBookings.length})
        </Button>
      </div>

      {/* Bookings List */}
      {displayedBookings.length > 0 ? (
        <div className="grid gap-6">
          {displayedBookings.map((booking) => (
            <Card key={booking.id} className={filter === 'past' ? 'bg-muted/50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-headline text-2xl">{booking.restaurantName}</CardTitle>
                    <CardDescription>{booking.restaurantAddress}</CardDescription>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
                {booking.confirmationCode && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Confirmation: <span className="font-mono font-semibold">{booking.confirmationCode}</span>
                  </p>
                )}
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary"/>
                  <span>{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary"/>
                  <span>{formatTime(booking.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary"/>
                  <span>{booking.partySize} {booking.partySize === 1 ? 'Guest' : 'Guests'}</span>
                </div>
                {booking.tableType && (
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-primary"/>
                    <span className="capitalize">{booking.tableType}</span>
                  </div>
                )}
                {booking.specialRequests && (
                  <div className="sm:col-span-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Special Requests:</span> {booking.specialRequests}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                {filter === 'upcoming' && booking.status !== 'cancelled' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setModifyingBooking(booking);
                        setShowModifyModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modify
                    </Button>
                  </>
                )}
                {filter === 'past' && booking.status === 'completed' && (
                  <>
                    <Button variant="secondary" size="sm">
                      Leave a Review
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/restaurants/${booking.restaurantId}`}>
                        Book Again
                      </Link>
                    </Button>
                  </>
                )}
                {booking.restaurantPhone && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`tel:${booking.restaurantPhone}`}>
                      Call Restaurant
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {filter === 'upcoming' 
              ? 'You have no upcoming bookings.' 
              : filter === 'past'
              ? 'You have no past bookings yet.'
              : 'You have no bookings yet.'}
          </p>
          {filter === 'upcoming' && (
            <Button asChild className="mt-4">
              <Link href="/explore">Explore Restaurants</Link>
            </Button>
          )}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Booking Modify Modal */}
      <BookingModifyModal
        isOpen={showModifyModal}
        onClose={() => {
          setShowModifyModal(false);
          setModifyingBooking(null);
        }}
        booking={modifyingBooking}
        onSuccess={loadBookings}
      />
    </div>
  );
}
