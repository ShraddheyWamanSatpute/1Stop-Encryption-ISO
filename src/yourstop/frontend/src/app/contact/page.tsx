import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Send,
  MessageCircle,
  HelpCircle,
  Building,
  Users,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Phone",
      details: ["+44 20 1234 5678", "+44 20 1234 5679"],
      description: "Mon-Fri 9AM-6PM GMT"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      details: ["hello@bookmytable.com", "support@bookmytable.com"],
      description: "We'll respond within 24 hours"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Address",
      details: ["123 Tech Street", "London, UK EC2A 4NE"],
      description: "Visit us during business hours"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Business Hours",
      details: ["Monday - Friday: 9AM - 6PM", "Weekend: 10AM - 4PM"],
      description: "GMT timezone"
    }
  ];

  const supportOptions = [
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: "Start Chat",
      available: true
    },
    {
      icon: <HelpCircle className="h-8 w-8" />,
      title: "Help Center",
      description: "Browse our comprehensive FAQ and guides",
      action: "Visit Help Center",
      available: true
    },
    {
      icon: <Building className="h-8 w-8" />,
      title: "Restaurant Partners",
      description: "Information for restaurant owners and managers",
      action: "Partner Portal",
      available: true
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community",
      description: "Join our community of food lovers and share experiences",
      action: "Join Community",
      available: false
    }
  ];

  const officeLocations = [
    {
      city: "London",
      address: "123 Tech Street, London, UK EC2A 4NE",
      phone: "+44 20 1234 5678",
      type: "Headquarters"
    },
    {
      city: "Manchester",
      address: "456 Innovation Ave, Manchester, UK M1 2AB",
      phone: "+44 161 234 5678",
      type: "Regional Office"
    },
    {
      city: "Edinburgh",
      address: "789 Castle Road, Edinburgh, UK EH1 3CD",
      phone: "+44 131 234 5678",
      type: "Regional Office"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#E6FBFD] to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-[#0A3473] text-white">
              Get In Touch
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-[#0A3473] mb-6">
              We're Here to Help
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Have questions about BookMyTable? Need support with your booking? 
              Want to partner with us? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#0A3473]">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Message Sent!</h3>
                      <p className="text-gray-600">
                        Thank you for contacting us. We'll get back to you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your full name"
                            className="border-gray-300 focus:ring-[#0A3473] focus:border-[#0A3473]"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your.email@example.com"
                            className="border-gray-300 focus:ring-[#0A3473] focus:border-[#0A3473]"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                          Inquiry Type
                        </label>
                        <select
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#0A3473] focus:border-[#0A3473]"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="support">Customer Support</option>
                          <option value="partnership">Restaurant Partnership</option>
                          <option value="press">Press & Media</option>
                          <option value="careers">Careers</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          Subject *
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="Brief description of your inquiry"
                          className="border-gray-300 focus:ring-[#0A3473] focus:border-[#0A3473]"
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                          Message *
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          required
                          rows={6}
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Please provide details about your inquiry..."
                          className="border-gray-300 focus:ring-[#0A3473] focus:border-[#0A3473]"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0A3473] hover:bg-[#082a5a] text-white py-3"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-[#0A3473] mb-6">Get in Touch</h2>
                <p className="text-gray-600 mb-8">
                  We're always happy to help. Reach out to us through any of these channels.
                </p>
              </div>

              <div className="grid gap-6">
                {contactInfo.map((info, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#E6FBFD] rounded-lg flex items-center justify-center text-[#0A3473] flex-shrink-0">
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#0A3473] mb-2">{info.title}</h3>
                          {info.details.map((detail, idx) => (
                            <p key={idx} className="text-gray-800 font-medium">{detail}</p>
                          ))}
                          <p className="text-gray-500 text-sm mt-1">{info.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3473] mb-4">Other Ways to Get Help</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the support option that works best for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportOptions.map((option, index) => (
              <Card key={index} className={`text-center hover:shadow-lg transition-all duration-300 ${!option.available ? 'opacity-60' : 'hover:scale-105'}`}>
                <CardContent className="pt-8 pb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${option.available ? 'bg-[#E6FBFD] text-[#0A3473]' : 'bg-gray-100 text-gray-400'}`}>
                    {option.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#0A3473] mb-3">{option.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{option.description}</p>
                  <Button 
                    variant={option.available ? "default" : "secondary"}
                    disabled={!option.available}
                    className={option.available ? "bg-[#0A3473] hover:bg-[#082a5a]" : ""}
                  >
                    {option.action}
                    {option.available && <ExternalLink className="ml-2 h-4 w-4" />}
                  </Button>
                  {!option.available && (
                    <p className="text-xs text-gray-500 mt-2">Coming Soon</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3473] mb-4">Our Offices</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Visit us at one of our locations across the UK.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {officeLocations.map((office, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[#0A3473]">{office.city}</h3>
                    <Badge variant={office.type === 'Headquarters' ? 'default' : 'secondary'}>
                      {office.type}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600">{office.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <p className="text-gray-600">{office.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3473] mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions about BookMyTable.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "How do I make a reservation?",
                answer: "Simply search for restaurants, select your preferred date and time, and complete the booking process. You'll receive a confirmation email immediately."
              },
              {
                question: "Is there a fee for using BookMyTable?",
                answer: "BookMyTable is free for diners. We partner with restaurants to provide you with the best booking experience at no cost."
              },
              {
                question: "Can I modify or cancel my reservation?",
                answer: "Yes, you can modify or cancel your reservation through your account dashboard or the confirmation email, subject to the restaurant's cancellation policy."
              },
              {
                question: "How do you ensure restaurant data accuracy?",
                answer: "We aggregate data from multiple trusted sources including Google Places, Yelp, and OpenStreetMap, and use AI to verify and enhance the information."
              },
              {
                question: "Do you support group bookings?",
                answer: "Yes, we support group bookings for parties of various sizes. Some restaurants may require special arrangements for large groups."
              }
            ].map((faq, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#0A3473] mb-3">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Button asChild className="bg-[#0A3473] hover:bg-[#082a5a]">
              <Link href="#contact-form">
                Contact Our Support Team
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
