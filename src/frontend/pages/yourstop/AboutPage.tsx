import { useState, useEffect } from 'react';
import { Button } from '../../../yourstop/frontend/src/components/ui/button';
import { Card, CardContent } from '../../../yourstop/frontend/src/components/ui/card';
import { Badge } from '../../../yourstop/frontend/src/components/ui/badge';
import { 
  Target, 
  Database,
  Zap,
  Shield,
  Heart,
  CheckCircle,
  ArrowRight,
  Utensils
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  const [stats, setStats] = useState({
    restaurants: 0,
    bookings: 0,
    customers: 0,
    cities: 0
  });

  useEffect(() => {
    // Animate numbers on load
    const animateNumber = (target: number, setter: (value: number) => void) => {
      let current = 0;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(current));
        }
      }, 50);
    };

    animateNumber(5896, (value) => setStats(prev => ({ ...prev, restaurants: value })));
    animateNumber(150000, (value) => setStats(prev => ({ ...prev, bookings: value })));
    animateNumber(75000, (value) => setStats(prev => ({ ...prev, customers: value })));
    animateNumber(25, (value) => setStats(prev => ({ ...prev, cities: value })));
  }, []);

  const features = [
    {
      icon: <Database className="h-8 w-8" />,
      title: "Multi-Source Data",
      description: "We aggregate restaurant data from Google Places, Yelp, OpenStreetMap, and Foursquare to provide the most comprehensive information."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI-Powered Features",
      description: "Our platform uses advanced AI for menu generation, smart search, availability prediction, and personalized recommendations."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Reliable & Secure",
      description: "Enterprise-grade security with 99.9% uptime guarantee. Your data and bookings are always safe with us."
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Customer First",
      description: "Every feature is designed with our users in mind. We prioritize user experience and satisfaction above all."
    }
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: "/api/placeholder/150/150?text=SJ",
      description: "Former restaurant industry executive with 15+ years of experience."
    },
    {
      name: "Michael Chen",
      role: "CTO",
      image: "/api/placeholder/150/150?text=MC",
      description: "Tech leader specializing in AI and data aggregation systems."
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      image: "/api/placeholder/150/150?text=ER",
      description: "UX expert focused on creating seamless dining experiences."
    },
    {
      name: "David Kim",
      role: "Head of Partnerships",
      image: "/api/placeholder/150/150?text=DK",
      description: "Building relationships with restaurants and service providers."
    }
  ];

  const milestones = [
    {
      year: "2023",
      title: "Company Founded",
      description: "Started with a vision to revolutionize restaurant discovery and booking."
    },
    {
      year: "2024",
      title: "Multi-Source Integration",
      description: "Successfully integrated data from 4 major restaurant data providers."
    },
    {
      year: "2024",
      title: "AI Enhancement Layer",
      description: "Launched AI-powered features for menu generation and smart recommendations."
    },
    {
      year: "2024",
      title: "Production Ready",
      description: "Platform now serves 5,896+ restaurants with enterprise-grade reliability."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#E6FBFD] to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-[#0A3473] text-white">
              About BookMyTable
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-[#0A3473] mb-6">
              Revolutionizing Restaurant Discovery
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're building the world's most comprehensive restaurant booking platform, 
              powered by AI and multi-source data aggregation to help you discover and book 
              the perfect dining experience.
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0A3473] mb-2">
                {stats.restaurants.toLocaleString()}+
              </div>
              <p className="text-gray-600">Restaurants</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0A3473] mb-2">
                {stats.bookings.toLocaleString()}+
              </div>
              <p className="text-gray-600">Bookings Made</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0A3473] mb-2">
                {stats.customers.toLocaleString()}+
              </div>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0A3473] mb-2">
                {stats.cities}+
              </div>
              <p className="text-gray-600">Cities Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#0A3473] mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To make restaurant discovery and booking as simple and delightful as possible. 
                We believe that finding the perfect dining experience shouldn't be complicated 
                or time-consuming.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                By leveraging cutting-edge technology and comprehensive data sources, we're 
                creating a platform that understands your preferences and connects you with 
                restaurants that match your taste, budget, and occasion.
              </p>
              <div className="flex items-center gap-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-gray-700">Comprehensive restaurant database</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-gray-700">AI-powered recommendations</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-gray-700">Real-time availability and booking</span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[#0A3473] to-[#082a5a] rounded-2xl p-8 text-white">
                <Target className="h-12 w-12 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-blue-100 leading-relaxed">
                  To become the global leader in restaurant discovery and booking, 
                  making every dining experience memorable and accessible to everyone, 
                  everywhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3473] mb-4">What Makes Us Different</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another booking platform. We're building the future of restaurant discovery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-[#E6FBFD] rounded-full flex items-center justify-center mx-auto mb-6 text-[#0A3473]">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#0A3473] mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3473] mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate individuals working together to transform the dining experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-8 pb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A3473] mb-1">{member.name}</h3>
                  <p className="text-[#0A3473] font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gradient-to-r from-[#E6FBFD] to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3473] mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a simple idea to a comprehensive restaurant platform.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-[#0A3473] opacity-20"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <Card className="hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-6">
                        <div className="text-2xl font-bold text-[#0A3473] mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">{milestone.title}</h3>
                        <p className="text-gray-600">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="w-4 h-4 bg-[#0A3473] rounded-full border-4 border-white shadow-lg z-10"></div>
                  
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0A3473] text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Discover Amazing Restaurants?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of food lovers who trust BookMyTable to find and book their perfect dining experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-[#0A3473] hover:bg-gray-100">
              <Link to="/YourStop/restaurants">
                <Utensils className="mr-2 h-5 w-5" />
                Explore Restaurants
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#0A3473]">
              <Link to="/YourStop/contact">
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

