# Book My Table - Restaurant Booking Platform

A modern restaurant booking platform built with Next.js, featuring AI-powered booking suggestions, profile management, and seamless user experience.

## 📁 Project Structure

```
Book-My-Table-main/
├── frontend/                 # Frontend application
│   ├── src/                 # Source code
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility libraries
│   ├── public/             # Static assets
│   ├── next.config.ts      # Next.js configuration
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   └── components.json     # UI components configuration
├── backend/                 # Backend services
│   ├── ai/                 # AI flows and services
│   └── api/                # API routes
├── config/                 # Configuration files
│   ├── firebase.json       # Firebase configuration
│   ├── firestore.rules     # Firestore security rules
│   ├── storage.rules       # Storage security rules
│   └── tsconfig.json       # TypeScript configuration
├── docs/                   # Documentation
│   ├── README.md           # Main documentation
│   ├── FIREBASE_SETUP.md   # Firebase setup guide
│   └── TROUBLESHOOTING.md  # Troubleshooting guide
├── data/                   # Data files
│   ├── Images/             # Restaurant images
│   └── Scrapped Restaurant Data/  # Restaurant data
└── package.json            # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase CLI

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
npm run firebase:deploy
```

## 🛠️ Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Backend
- `npm run genkit:dev` - Start AI development server
- `npm run genkit:watch` - Start AI server with watch mode

### Firebase
- `npm run firebase:emulators` - Start Firebase emulators
- `npm run firebase:deploy` - Deploy to Firebase
- `npm run firebase:deploy:hosting` - Deploy only hosting
- `npm run firebase:deploy:firestore` - Deploy only Firestore

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **State Management**: React hooks and local storage
- **Type Safety**: TypeScript with strict configuration

### Backend
- **AI Services**: Google Genkit for AI flows
- **API Routes**: Next.js API routes for backend logic
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (optional)
- **Storage**: Firebase Storage

### Configuration
- **Firebase**: Centralized configuration in `config/`
- **TypeScript**: Shared configuration with path mapping
- **Build**: Optimized for static export

## 📱 Features

- 🍽️ Restaurant discovery and search
- 📅 AI-powered booking suggestions
- 👤 User profile management
- 💳 Payment method storage
- 🎯 Age verification for nightlife venues
- 📱 Responsive design
- ⚡ Fast performance with static generation

## 🔧 Development

### Adding New Components
1. Create component in `frontend/src/components/`
2. Export from appropriate index file
3. Import using `@/components/` path alias

### Adding New Pages
1. Create page in `frontend/src/app/`
2. Follow Next.js App Router conventions
3. Use TypeScript for type safety

### Adding New Hooks
1. Create hook in `frontend/src/hooks/`
2. Export from hooks directory
3. Import using `@/hooks/` path alias

## 📚 Documentation

- [Firebase Setup Guide](docs/FIREBASE_SETUP.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Project Blueprint](docs/blueprint.md)

## 🚀 Deployment

The application is configured for static export and can be deployed to:
- Firebase Hosting (recommended)
- Vercel
- Netlify
- Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
