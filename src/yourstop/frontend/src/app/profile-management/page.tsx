import { Button } from '@/components/ui/button';
import { User, Utensils, CreditCard, ArrowLeft, Settings, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth-guard';

export default function ProfileManagementPage() {
  return (
    <AuthGuard>
      <ProfileManagementContent />
    </AuthGuard>
  );
}

function ProfileManagementContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                BookMyTable
              </Link>
            </div>

            {/* Back Button */}
            <div className="flex items-center gap-4">
              <Button 
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Manage Your Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Set up your preferences, dietary needs, and payment methods for a personalized dining experience.
          </p>
        </div>

        {/* Profile Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Personal Info Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Personal Information</h3>
              <p className="text-gray-600 mb-6">Name, contact details, and age verification for venue access</p>
              <Button 
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold"
              >
                <Link href="/profile#personal">Update Personal Info</Link>
              </Button>
            </div>
          </div>

          {/* Dietary Preferences Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Utensils className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Dietary Preferences</h3>
              <p className="text-gray-600 mb-6">Set your food preferences and dietary restrictions</p>
              <Button 
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold"
              >
                <Link href="/profile#dietary">Set Dietary Preferences</Link>
              </Button>
            </div>
          </div>

          {/* Payment Methods Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Payment Methods</h3>
              <p className="text-gray-600 mb-6">Manage your saved payment options for quick bookings</p>
              <Button 
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold"
              >
                <Link href="/profile#payment">Manage Payment Methods</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <p className="text-gray-600">Access all your profile settings in one place</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Complete Profile Button */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Complete Profile Setup</h3>
                  <p className="text-blue-100">Set up your entire profile in under 2 minutes</p>
                </div>
              </div>
              <Button 
                asChild
                size="lg"
                className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                <Link href="/profile">Complete Profile</Link>
              </Button>
            </div>

            {/* View Current Profile */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">View Current Profile</h3>
                  <p className="text-gray-600">See what information you've already saved</p>
                </div>
              </div>
              <Button 
                asChild
                size="lg"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                <Link href="/profile">View Profile</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Complete Your Profile?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Experience</h3>
              <p className="text-gray-600">Get restaurant recommendations based on your preferences</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dietary Accommodations</h3>
              <p className="text-gray-600">Restaurants will know your dietary needs in advance</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Faster Bookings</h3>
              <p className="text-gray-600">Quick checkout with saved payment methods</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
