import { Link, useNavigate } from 'react-router-dom';
import { Utensils, User as UserIcon, Settings, LogOut, Menu, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, loading, signOut } = useCustomerAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/YourStop');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigation = [
    { name: 'Explore', href: '/YourStop/explore' },
    { name: 'Booking', href: '/YourStop/booking' },
    { name: 'Contact', href: '/YourStop/contact' },
    { name: 'About', href: '/YourStop/about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container-modern">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/YourStop" className="flex items-center gap-1 sm:gap-2 group">
            <div className="p-1.5 sm:p-2 bg-brand-primary rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Utensils className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="font-display text-lg sm:text-xl md:text-2xl text-foreground group-hover:text-brand-primary transition-colors duration-300">
              <span className="hidden xs:inline">BookMyTable</span>
              <span className="xs:hidden">BMT</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="font-body-medium text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {loading ? (
              <div className="animate-pulse bg-muted h-8 sm:h-10 w-16 sm:w-20 rounded-xl" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary flex items-center justify-center text-white font-body-semibold text-xs sm:text-sm">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-body-semibold">{user.displayName || 'User'}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/YourStop/profile" className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/YourStop/favorites" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>My Favorites</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/YourStop/profile-management" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link 
                  to="/YourStop/auth"
                  className="hidden sm:block font-body-medium text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                >
                  Sign In
                </Link>
                <Button 
                  asChild 
                  size="sm"
                  className="btn-brand text-xs sm:text-sm px-3 sm:px-4"
                >
                  <Link to="/YourStop/auth">
                    <span className="hidden sm:inline">Login</span>
                    <span className="sm:hidden">Sign In</span>
                  </Link>
                </Button>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-8 w-8 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4 bg-background/95 backdrop-blur-sm">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="font-body-medium text-muted-foreground hover:text-foreground transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-muted/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {!user && (
                <div className="pt-2 border-t border-border/50 mt-2">
                  <Link
                    to="/YourStop/auth"
                    className="block font-body-medium text-muted-foreground hover:text-foreground transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-muted/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In / Login
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}