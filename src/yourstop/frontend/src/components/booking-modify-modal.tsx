import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CustomerBooking } from '@/lib/customer-booking-service';
import { customerBookingService } from '@/lib/customer-booking-service';
import { toast } from '@/hooks/use-toast';

interface BookingModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: CustomerBooking | null;
  onSuccess: () => void;
}

export function BookingModifyModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: BookingModifyModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [tableType, setTableType] = useState<string>('standard');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Available time slots
  const timeSlots = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
  ];

  // Initialize form with booking data
  useEffect(() => {
    if (booking) {
      const bookingDate = new Date(`${booking.date}T${booking.time}`);
      setSelectedDate(bookingDate);
      setSelectedTime(booking.time);
      setPartySize(booking.partySize);
      setTableType(booking.tableType || 'standard');
      setSpecialRequests(booking.specialRequests || '');
    }
  }, [booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);
    try {
      const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : booking.date;
      
      // Check if date/time changed
      const hasChanges = 
        dateStr !== booking.date ||
        selectedTime !== booking.time ||
        partySize !== booking.partySize ||
        tableType !== booking.tableType ||
        specialRequests !== booking.specialRequests;

      if (!hasChanges) {
        toast({
          title: 'No changes',
          description: 'No changes were made to the booking.',
        });
        onClose();
        return;
      }

      // Update booking
      await customerBookingService.updateBooking(booking.id, booking.userId, {
        date: dateStr,
        time: selectedTime,
        partySize,
        tableType: tableType as any,
        specialRequests,
      });

      toast({
        title: 'Booking updated',
        description: 'Your booking has been successfully updated.',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error updating booking',
        description: 'Failed to update your booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modify Booking</DialogTitle>
          <DialogDescription>
            Update your booking details for {booking.restaurantName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Date Picker */}
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selector */}
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => {
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour % 12 || 12;
                    return (
                      <SelectItem key={time} value={time}>
                        {displayHour}:{minutes} {ampm}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Party Size */}
            <div className="grid gap-2">
              <Label htmlFor="partySize">Party Size</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                >
                  -
                </Button>
                <Input
                  id="partySize"
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPartySize(Math.min(20, partySize + 1))}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Table Type */}
            <div className="grid gap-2">
              <Label htmlFor="tableType">Table Type</Label>
              <Select value={tableType} onValueChange={setTableType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="booth">Booth</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Special Requests */}
            <div className="grid gap-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                placeholder="Any dietary requirements, accessibility needs, or special requests..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

