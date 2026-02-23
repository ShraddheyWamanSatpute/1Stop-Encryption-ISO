# Nightcap Group Restaurant Images - Sourcing & Integration Guide

## Overview
This guide provides comprehensive instructions for sourcing, organizing, and integrating high-quality images for all 47 Nightcap Group venues across 14 brands for website development.

## Image Categories & Requirements

### 1. Brand Logos & Identity Assets
**Purpose**: Website headers, marketing materials, social media
**Specifications**:
- Format: SVG (preferred) or high-res PNG with transparent background
- Minimum resolution: 300x100px (scalable)
- File size: < 50KB
- Usage: Commercial licensing required

**Key Brands to Source**:
- The Cocktail Club (@thecocktailclub)
- Tonight Josephine (@tonightjosephine) 
- Dirty Martini
- Tuttons Covent Garden (@tuttonscoventgarden)
- Blame Gloria (@blamegloria)
- Disrepute (@disreputebar)
- Nikki's Bar
- The Piano Works
- Luna Springs (@luna_springs_digbeth)

### 2. Venue Exterior Photography
**Purpose**: Location pages, Google Business listings, social proof
**Specifications**:
- Format: JPEG/WebP
- Minimum resolution: 1920x1080px
- Aspect ratio: 16:9 or 4:3
- File size: < 500KB (optimized)
- Lighting: Golden hour or evening with signage illuminated

**Priority Venues**:
1. **Tonight Josephine Shoreditch** - Famous neon sign exterior
2. **The Cocktail Club Shoreditch** - Iconic storefront
3. **Tuttons Covent Garden** - Historic Piazza terrace view
4. **Disrepute Soho** - Sophisticated entrance
5. **Luna Springs Birmingham** - Large outdoor event space

### 3. Interior Atmosphere & Design
**Purpose**: Gallery pages, atmosphere showcase, booking conversion
**Specifications**:
- Format: JPEG/WebP
- Resolution: 1920x1280px or 1080x1080px (Instagram format)
- Multiple angles per venue
- Professional lighting showcasing ambiance

**Essential Interior Shots per Brand**:

#### The Cocktail Club
- Dancing bartenders in action
- Neon-lit bar areas
- Crowd shots during peak hours
- Theatrical cocktail preparation
- Multi-room layouts (Birmingham venue)

#### Tonight Josephine
- **"Well Behaved Women Rarely Make History" neon sign**
- Pink glittery walls and decor
- Mirrored ceiling reflections
- Drag brunch entertainment setup
- Instagram photo opportunities

#### Dirty Martini
- Sophisticated lounge seating
- Premium bar setups
- Upscale interior design
- Late-night atmosphere

#### Tuttons
- Historic British brasserie interior
- Outdoor Piazza terrace
- Private dining vaults
- Traditional pub atmosphere

### 4. Food & Beverage Photography
**Purpose**: Menu pages, social media, appetite appeal
**Specifications**:
- Format: JPEG
- Resolution: 1080x1080px (square) or 1080x1350px (portrait)
- Professional food styling
- Brand-consistent presentation

**Key Items to Photograph**:
- Signature cocktails with theatrical presentation (TCC)
- Pink-themed drinks (Tonight Josephine)
- Premium cocktail presentations (Dirty Martini)
- Traditional British fare (Tuttons)
- Bottomless brunch setups

### 5. Events & Entertainment
**Purpose**: Event promotion, experience showcase, social proof
**Content Requirements**:
- Live piano performances (The Piano Works)
- Drag entertainment (Tonight Josephine, Nikki's Bar)
- Dancing bartender shows (The Cocktail Club)
- Large-scale events (Luna Springs)
- Private hire setups

### 6. Social Media & User-Generated Content
**Purpose**: Social proof, engagement, authentic experiences
**Sources**:
- Instagram posts from venue accounts
- Customer photos (with permission)
- Influencer content
- Event photography

## Primary Image Sources

### Official Brand Channels
1. **Website Press Kits**: Contact brand marketing teams
2. **Instagram Accounts**: 
   - @thecocktailclub (high engagement content)
   - @tonightjosephine (110K followers, 2,725 posts)
   - @tuttonscoventgarden (2,408 followers)
   - @blamegloria (32K followers)
   - @disreputebar (22K followers)
   - @luna_springs_digbeth (35K followers)

### Professional Photography Services
3. **Recommended Photographers**:
   - Hospitality specialists in London
   - Food & beverage photographers
   - Event photographers for live entertainment

### Stock Photography (Supplementary)
4. **Licensed Stock Sources**:
   - Shutterstock (hospitality collection)
   - Getty Images (restaurant & bar category)
   - Adobe Stock (food & beverage)

## Image Organization Structure

```
/images/nightcap-venues/
├── brands/
│   ├── logos/
│   │   ├── the-cocktail-club-logo.svg
│   │   ├── tonight-josephine-logo.svg
│   │   └── dirty-martini-logo.svg
│   └── brand-assets/
├── venues/
│   ├── the-cocktail-club/
│   │   ├── shoreditch/
│   │   │   ├── exterior/
│   │   │   ├── interior/
│   │   │   ├── food-drinks/
│   │   │   └── events/
│   │   └── birmingham/
│   ├── tonight-josephine/
│   │   ├── shoreditch/
│   │   ├── waterloo/
│   │   └── cardiff/
│   └── [other-brands]/
├── food-drinks/
│   ├── cocktails/
│   ├── food/
│   └── presentations/
├── events/
│   ├── entertainment/
│   ├── private-hire/
│   └── special-events/
└── social-media/
    ├── instagram/
    ├── user-generated/
    └── influencer/
```

## Technical Specifications for Web Integration

### Image Optimization
- **Format**: WebP with JPEG fallback
- **Compression**: 85% quality for hero images, 80% for thumbnails
- **Responsive**: Multiple sizes (320px, 768px, 1024px, 1920px)
- **Lazy Loading**: Implement for performance optimization

### File Naming Convention
```
[brand-name]_[venue-name]_[category]_[number].jpg

Examples:
- the-cocktail-club_shoreditch_exterior_001.jpg
- tonight-josephine_waterloo_interior_neon-sign_001.jpg
- tuttons_covent-garden_food_british-brasserie_001.jpg
```

### Metadata Requirements
Each image file should include:
- Alt text (descriptive, SEO-friendly)
- Caption (customer-facing description)
- Brand association
- Venue location
- Category classification
- Usage rights information
- Photographer credit (if required)

## Legal & Licensing Considerations

### Usage Rights
1. **Official Brand Images**: Obtain commercial licensing agreements
2. **Social Media Content**: Secure permission for commercial use
3. **User-Generated Content**: Require explicit consent and attribution
4. **Stock Photography**: Maintain valid licenses and usage records

### Brand Guidelines Compliance
- Maintain color accuracy across all images
- Follow logo usage guidelines
- Ensure content aligns with brand values
- Respect trademark and copyright requirements

## Implementation Timeline

### Phase 1: Brand Assets (Week 1)
- Collect all brand logos and identity assets
- Establish licensing agreements
- Create brand asset library

### Phase 2: Hero Images (Week 2)
- Source primary venue exterior shots
- Collect signature interior photographs
- Optimize for web performance

### Phase 3: Gallery Content (Week 3)
- Comprehensive interior photography
- Food & beverage imagery
- Event and entertainment content

### Phase 4: Social Integration (Week 4)
- Curate social media content
- Organize user-generated imagery
- Implement responsive image delivery

## Quality Assurance Checklist

### Before Publishing:
- [ ] Image resolution meets minimum requirements
- [ ] File sizes optimized for web performance
- [ ] Alt text and metadata complete
- [ ] Usage rights documented
- [ ] Brand guidelines compliance verified
- [ ] Responsive breakpoints tested
- [ ] Loading performance optimized

### Ongoing Maintenance:
- [ ] Weekly social media content updates
- [ ] Quarterly image library refresh
- [ ] Annual licensing renewals
- [ ] Performance monitoring and optimization

## Contact Information for Image Sourcing

### Brand Marketing Teams:
- **Nightcap Group**: marketing@nightcap.group
- **Individual Venues**: Contact through official websites
- **Social Media Managers**: Direct Instagram messaging

### Professional Services:
- **Photography**: Hospitality photography specialists
- **Image Optimization**: Web development team
- **Legal Clearance**: Brand licensing department

---

*This guide ensures comprehensive, high-quality image sourcing and organization for optimal website integration and user experience across all Nightcap Group venues.*