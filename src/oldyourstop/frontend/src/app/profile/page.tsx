'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar, 
  Shield, 
  Utensils, 
  CreditCard, 
  Edit, 
  Save, 
  X,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/use-profile';
import { AuthGuard } from '@/components/auth-guard';

const dietaryOptions = [
  { id: 'vegetarian', name: 'Vegetarian', selected: false },
  { id: 'vegan', name: 'Vegan', selected: false },
  { id: 'gluten-free', name: 'Gluten-Free', selected: false },
  { id: 'dairy-free', name: 'Dairy-Free', selected: false },
  { id: 'nut-allergy', name: 'Nut Allergy', selected: false },
  { id: 'seafood-allergy', name: 'Seafood Allergy', selected: false },
  { id: 'halal', name: 'Halal', selected: false },
  { id: 'kosher', name: 'Kosher', selected: false },
  { id: 'keto', name: 'Keto', selected: false },
  { id: 'paleo', name: 'Paleo', selected: false },
];

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}

function ProfilePageContent() {
  const { toast } = useToast();
  const {
    profile,
    dietaryPreferences,
    paymentMethods,
    loading,
    updateProfile,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    updateDietaryPreference,
  } = useProfile();

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card' as const,
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
  });

  const handleProfileUpdate = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleProfileChange = (field: string, value: string) => {
    updateProfile({ [field]: value });
  };

  const handleDietaryPreferenceChange = (id: string) => {
    updateDietaryPreference(id);
  };

  const handleAddPaymentMethod = () => {
    if (newPaymentMethod.type === 'card' && newPaymentMethod.cardNumber) {
      const newMethod = {
        type: 'card' as const,
        last4: newPaymentMethod.cardNumber.slice(-4),
        brand: newPaymentMethod.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
        expiryMonth: parseInt(newPaymentMethod.expiryMonth),
        expiryYear: parseInt(newPaymentMethod.expiryYear),
        isDefault: paymentMethods.length === 0,
      };
      
      addPaymentMethod(newMethod);
      setNewPaymentMethod({
        type: 'card',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        name: '',
      });
      
      toast({
        title: "Payment Method Added",
        description: "Your payment method has been added successfully.",
      });
    }
  };

  const handleRemovePaymentMethod = (id: string) => {
    removePaymentMethod(id);
    toast({
      title: "Payment Method Removed",
      description: "Your payment method has been removed.",
    });
  };

  const handleSetDefaultPayment = (id: string) => {
    setDefaultPaymentMethod(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information, preferences, and payment methods.</p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="dietary">Dietary Preferences</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Your basic profile information and age verification.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Age Verification Status */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Shield className={`h-6 w-6 ${profile.isAgeVerified ? 'text-green-600' : 'text-orange-600'}`} />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Age Verification {profile.isAgeVerified ? 'Verified' : 'Required'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {profile.isAgeVerified 
                        ? 'You are verified for alcohol and nightlife venues.' 
                        : 'Please provide your date of birth to verify you are 18+ for alcohol and nightlife venues.'
                      }
                    </p>
                  </div>
                  {profile.isAgeVerified && (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                </div>

                {isEditing && (
                  <Button onClick={handleProfileUpdate} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dietary Preferences Tab */}
          <TabsContent value="dietary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Dietary Preferences
                </CardTitle>
                <CardDescription>
                  Select your dietary preferences to help restaurants accommodate your needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {dietaryOptions.map((preference) => {
                    const isSelected = dietaryPreferences.find(p => p.id === preference.id)?.selected || false;
                    return (
                      <div key={preference.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={preference.id}
                          checked={isSelected}
                          onCheckedChange={() => handleDietaryPreferenceChange(preference.id)}
                        />
                        <Label htmlFor={preference.id} className="text-sm font-medium">
                          {preference.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Selected Preferences:</h4>
                  <div className="flex flex-wrap gap-2">
                    {dietaryPreferences
                      .filter(pref => pref.selected)
                      .map(pref => (
                        <Badge key={pref.id} variant="secondary" className="bg-blue-100 text-blue-800">
                          {pref.name}
                        </Badge>
                      ))
                    }
                    {dietaryPreferences.filter(pref => pref.selected).length === 0 && (
                      <p className="text-gray-500 text-sm">No preferences selected</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your saved payment methods for quick and easy bookings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Payment Methods */}
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </div>
                        {method.isDefault && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultPayment(method.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePaymentMethod(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Add New Payment Method */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Add New Payment Method</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        value={newPaymentMethod.cardNumber}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        value={newPaymentMethod.name}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryMonth">Expiry Month</Label>
                      <Input
                        id="expiryMonth"
                        value={newPaymentMethod.expiryMonth}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryMonth: e.target.value }))}
                        placeholder="MM"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryYear">Expiry Year</Label>
                      <Input
                        id="expiryYear"
                        value={newPaymentMethod.expiryYear}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryYear: e.target.value }))}
                        placeholder="YYYY"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <Button onClick={handleAddPaymentMethod} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
