
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
import { Loader2, Calendar, Clock, Users, Utensils } from 'lucide-react';
import { restaurants } from '@/lib/data';

// Placeholder data - in a real app, you'd fetch this for the logged-in user
const upcomingBookings = [
  {
    bookingId: 'BK-12345',
    restaurantId: '1',
    dateTime: '2024-08-15T19:30:00',
    partySize: 2,
  },
  {
    bookingId: 'BK-67890',
    restaurantId: '3',
    dateTime: '2024-09-01T20:00:00',
    partySize: 4,
  },
];

const pastBookings = [
  {
    bookingId: 'BK-54321',
    restaurantId: '2',
    dateTime: '2024-06-20T18:00:00',
    partySize: 3,
  },
];

export default function MyBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  const getRestaurant = (id: string) => restaurants.find(r => r.id === id);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-12">
      <header className="mb-12">
        <h1 className="font-headline text-5xl font-bold">My Bookings</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          View and manage your reservations.
        </p>
      </header>

      <section>
        <h2 className="font-headline text-3xl font-semibold">Upcoming Bookings</h2>
        <div className="mt-6 grid gap-6">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => {
              const restaurant = getRestaurant(booking.restaurantId);
              return (
                <Card key={booking.bookingId}>
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">{restaurant?.name}</CardTitle>
                    <CardDescription>{restaurant?.address}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary"/>
                        <span>{formatDate(booking.dateTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary"/>
                        <span>{formatTime(booking.dateTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary"/>
                        <span>{booking.partySize} Guests</span>
                      </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="outline" size="sm">Cancel</Button>
                    <Button variant="outline" size="sm">Modify</Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground">You have no upcoming bookings.</p>
          )}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-headline text-3xl font-semibold">Past Bookings</h2>
        <div className="mt-6 grid gap-6">
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => {
               const restaurant = getRestaurant(booking.restaurantId);
              return (
                <Card key={booking.bookingId} className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">{restaurant?.name}</CardTitle>
                    <CardDescription>{restaurant?.address}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                        <span>{formatDate(booking.dateTime)}</span>
                      </div>
                       <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground"/>
                        <span>{booking.partySize} Guests</span>
                      </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="secondary" size="sm">Leave a Review</Button>
                     <Button asChild variant="outline" size="sm">
                       <Link href={`/restaurants/${booking.restaurantId}`}>Book Again</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground">You have no past bookings yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
