import { Link } from 'react-router-dom';
import { Utensils, Mail, Phone, MapPin, Twitter, Instagram, Facebook } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/YourStop/about' },
      { name: 'Contact', href: '/YourStop/contact' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'FAQ', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Privacy Policy', href: '#' },
    ],
    features: [
      { name: 'Restaurants', href: '/YourStop/restaurants' },
      { name: 'Bookings', href: '/YourStop/my-bookings' },
      { name: 'Reviews', href: '#' },
      { name: 'Events', href: '#' },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'Facebook', href: '#', icon: Facebook },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="container-modern section-padding">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 sm:p-2 bg-brand-primary rounded-lg sm:rounded-xl">
                <Utensils className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="font-display text-xl sm:text-2xl text-foreground">
                BookMyTable
              </span>
            </div>
            <p className="font-body text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-sm">
              Making dining reservations simple, fast, and reliable for everyone. 
              Discover amazing restaurants and book your table instantly.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">hello@bookmytable.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>London, UK</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-heading text-base sm:text-lg text-foreground mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-heading text-base sm:text-lg text-foreground mb-3 sm:mb-4">Support</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features Links */}
          <div>
            <h3 className="font-heading text-base sm:text-lg text-foreground mb-3 sm:mb-4">Features</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.features.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 sm:pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-body text-xs sm:text-sm text-muted-foreground">
                © {currentYear} BookMyTable. All rights reserved.
              </p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                Powered by real-time data from Google Places, Yelp, and Foursquare.
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-2 sm:gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  to={social.href}
                  className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}