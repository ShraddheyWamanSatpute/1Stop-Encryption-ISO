# Nightcap Group Restaurant Data

This repository contains comprehensive data for all Nightcap Group restaurants across the UK, extracted for restaurant booking website integration.

## Overview

Nightcap Group operates **47 venues** across **13 brands** in **9 UK cities**:
- London
- Birmingham  
- Cardiff
- Bristol
- Manchester
- Leeds
- Brighton
- Liverpool
- Bath
- Watford

## Data Files

### 1. `nightcap_restaurants_data.json`
Complete JSON dataset with structured information for all restaurants including:
- Full addresses and contact details
- Opening hours for each day
- Cuisine types and price ranges
- Capacity information
- Special features and amenities
- Booking availability status

### 2. `nightcap_restaurants_complete.json`
Extended JSON file with additional brand information and booking system integration details.

### 3. `nightcap_restaurants.csv`
CSV format for easy database import and spreadsheet analysis.

## Brands Included

1. **The Cocktail Club** - Premium cocktail bars with entertainment
2. **Dirty Martini** - Upscale cocktail lounges
3. **Tuttons** - Traditional British restaurant in Covent Garden
4. **Blame Gloria** - Quirky cocktail bars with unique themes
5. **The Piano Works** - Interactive piano entertainment venues
6. **Tonight Josephine** - French cabaret-themed cocktail bar
7. **Brighton i360** - Sky bar with panoramic views
8. **Drift Bar & Kitchen** - Beachfront dining and bar
9. **Luna Springs** - Large event venue in Birmingham
10. **Nikki's Bar** - Modern cocktail bar in Shoreditch
11. **Barrio Bars** - Latin American themed venues
12. **The Escapologist** - Magic-themed cocktail bar
13. **Disrepute** - Speakeasy-style cocktail bar
14. **Afters** - Casual dive bar with relaxed atmosphere

## Data Structure

Each restaurant entry includes:

```json
{
  "name": "Restaurant Name",
  "address": "Full Address with Postcode",
  "phone": "+44 Phone Number",
  "opening_hours": {
    "monday": "HH:MM-HH:MM",
    "tuesday": "HH:MM-HH:MM",
    // ... for each day
  },
  "cuisine_type": "Type of Cuisine",
  "price_range": "£/££/£££",
  "capacity": "Number of guests",
  "special_features": ["Feature 1", "Feature 2"],
  "booking_available": true/false,
  "city": "City Name"
}
```

## Price Range Guide
- **£** - Budget-friendly (£10-20 per person)
- **££** - Mid-range (£20-40 per person)  
- **£££** - Premium (£40+ per person)

## Booking Integration

All venues support:
- Online table booking
- Group reservations
- Private event booking
- Special occasion packages
- Advance booking up to 3 months

Contact methods available:
- Phone booking
- Online forms
- Email inquiries

## Usage for Website Integration

### For Database Import
Use the CSV file for direct database import with standard SQL commands.

### For API Integration
Use the JSON files for REST API responses and frontend integration.

### For Booking System
All venues have `booking_available: true` and include contact information for reservation systems.

## Special Features by Brand

- **Happy Hour** - Available at most cocktail venues
- **Bottomless Brunch** - Weekend offerings at select locations
- **Live Entertainment** - Piano performances, live music
- **Private Hire** - Available for events and parties
- **Outdoor Seating** - Weather-dependent availability
- **Late Night Service** - Most venues open until 1-3 AM

## Contact Information

Each venue includes direct phone numbers for reservations and inquiries. For general Nightcap Group information, visit their official website.

## Data Accuracy

This data was compiled from official sources and venue websites. For the most current information, especially regarding opening hours and special events, please verify directly with individual venues.

## Last Updated

Data extracted and compiled: January 2025

---

*This data is intended for restaurant booking website integration and customer information purposes.*