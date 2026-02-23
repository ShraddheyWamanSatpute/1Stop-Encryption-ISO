import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePaymentMethods, type PaymentMethod } from '@/hooks/use-payment-methods';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Star, 
  Loader2,
  Shield,
  Smartphone
} from 'lucide-react';

const paymentMethodSchema = z.object({
  type: z.enum(['card', 'paypal', 'apple_pay', 'google_pay']),
  cardNumber: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
  cardholderName: z.string().optional(),
  nickname: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

const cardBrands = {
  visa: { name: 'Visa', color: 'bg-blue-600' },
  mastercard: { name: 'Mastercard', color: 'bg-red-600' },
  amex: { name: 'American Express', color: 'bg-green-600' },
  discover: { name: 'Discover', color: 'bg-orange-600' },
};

function getCardBrand(cardNumber: string): keyof typeof cardBrands | null {
  const number = cardNumber.replace(/\s/g, '');
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6/.test(number)) return 'discover';
  return null;
}

function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

function PaymentMethodCard({ method, onRemove, onSetDefault }: {
  method: PaymentMethod;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const getBrandInfo = () => {
    if (method.type === 'card' && method.brand) {
      return cardBrands[method.brand as keyof typeof cardBrands];
    }
    return null;
  };

  const brandInfo = getBrandInfo();

  return (
    <Card className="relative">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {method.type === 'card' ? (
                <div className={`w-8 h-5 rounded flex items-center justify-center text-white text-xs font-bold ${
                  brandInfo?.color || 'bg-gray-600'
                }`}>
                  {brandInfo?.name?.charAt(0) || 'C'}
                </div>
              ) : method.type === 'paypal' ? (
                <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  PP
                </div>
              ) : method.type === 'apple_pay' ? (
                <Smartphone className="w-8 h-5 text-gray-600" />
              ) : (
                <Smartphone className="w-8 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {method.nickname || 
                   (method.type === 'card' ? `${method.brand?.toUpperCase()} •••• ${method.last4}` : 
                    method.type === 'paypal' ? 'PayPal' :
                    method.type === 'apple_pay' ? 'Apple Pay' : 'Google Pay')}
                </h3>
                {method.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              {method.type === 'card' && method.expiryMonth && method.expiryYear && (
                <p className="text-sm text-muted-foreground">
                  Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!method.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetDefault(method.id)}
              >
                Set as Default
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(method.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentMethodsSection() {
  const { paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = usePaymentMethods();
  const { toast } = useToast();
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'card',
      isDefault: paymentMethods.length === 0,
    },
  });

  const onSubmit = async (data: PaymentMethodFormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate payment method validation
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.type === 'card') {
        const cardNumber = data.cardNumber?.replace(/\s/g, '') || '';
        const brand = getCardBrand(cardNumber);
        
        addPaymentMethod({
          type: 'card',
          last4: cardNumber.slice(-4),
          brand: brand || 'unknown',
          expiryMonth: parseInt(data.expiryMonth || '0'),
          expiryYear: parseInt(data.expiryYear || '0'),
          nickname: data.nickname,
          isDefault: data.isDefault || paymentMethods.length === 0,
        });
      } else {
        addPaymentMethod({
          type: data.type,
          nickname: data.nickname,
          isDefault: data.isDefault || paymentMethods.length === 0,
        });
      }

      toast({
        title: 'Payment Method Added',
        description: 'Your payment method has been successfully added.',
      });

      form.reset();
      setIsAddingMethod(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add payment method. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-muted-foreground">
            Manage your saved payment methods for quick and secure bookings.
          </p>
        </div>
        <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account for faster bookings.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="card" id="card" />
                            <Label htmlFor="card" className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Credit Card
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="paypal" id="paypal" />
                            <Label htmlFor="paypal" className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">PP</div>
                              PayPal
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="apple_pay" id="apple_pay" />
                            <Label htmlFor="apple_pay" className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              Apple Pay
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="google_pay" id="google_pay" />
                            <Label htmlFor="google_pay" className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              Google Pay
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('type') === 'card' && (
                  <>
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="1234 5678 9012 3456"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatCardNumber(e.target.value);
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="expiryMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Month</FormLabel>
                            <FormControl>
                              <Input placeholder="MM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expiryYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input placeholder="YYYY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="cardholderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardholder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="My Main Card" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={form.watch('isDefault') || paymentMethods.length === 0}
                    onChange={(e) => form.setValue('isDefault', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isDefault" className="text-sm">
                    Set as default payment method
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingMethod(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      'Add Payment Method'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onRemove={removePaymentMethod}
              onSetDefault={setDefaultPaymentMethod}
            />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
              <p className="text-muted-foreground mb-4">
                Add a payment method to make faster and more secure bookings.
              </p>
              <Button onClick={() => setIsAddingMethod(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Payment Method
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>Your payment information is encrypted and secure.</span>
      </div>
    </div>
  );
}