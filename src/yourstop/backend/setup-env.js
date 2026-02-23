#!/usr/bin/env node

/**
 * Environment setup script for BookMyTable backend
 * This script helps set up the required environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

console.log('🚀 BookMyTable Backend Environment Setup');
console.log('==========================================\n');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
    setupEnvironment();
  });
} else {
  setupEnvironment();
}

function setupEnvironment() {
  console.log('\n📋 Setting up environment variables...\n');
  
  const envVars = [
    {
      key: 'FIREBASE_API_KEY',
      description: 'Firebase API Key',
      required: true,
      example: 'AIzaSyC...'
    },
    {
      key: 'FIREBASE_AUTH_DOMAIN',
      description: 'Firebase Auth Domain',
      required: true,
      example: 'your-project.firebaseapp.com'
    },
    {
      key: 'FIREBASE_PROJECT_ID',
      description: 'Firebase Project ID',
      required: true,
      example: 'your-project-id'
    },
    {
      key: 'FIREBASE_STORAGE_BUCKET',
      description: 'Firebase Storage Bucket',
      required: true,
      example: 'your-project.appspot.com'
    },
    {
      key: 'FIREBASE_MESSAGING_SENDER_ID',
      description: 'Firebase Messaging Sender ID',
      required: true,
      example: '123456789'
    },
    {
      key: 'FIREBASE_APP_ID',
      description: 'Firebase App ID',
      required: true,
      example: '1:123456789:web:abcdef123456'
    },
    {
      key: 'SENDGRID_API_KEY',
      description: 'SendGrid API Key (optional)',
      required: false,
      example: 'SG.abc123...'
    },
    {
      key: 'STRIPE_SECRET_KEY',
      description: 'Stripe Secret Key (optional)',
      required: false,
      example: 'sk_test_...'
    },
    {
      key: 'JWT_SECRET',
      description: 'JWT Secret Key',
      required: true,
      example: 'your-super-secret-jwt-key'
    }
  ];

  let envContent = '# BookMyTable Backend Environment Variables\n';
  envContent += '# Generated on ' + new Date().toISOString() + '\n\n';

  let currentIndex = 0;

  function askNextQuestion() {
    if (currentIndex >= envVars.length) {
      finishSetup();
      return;
    }

    const envVar = envVars[currentIndex];
    const requiredText = envVar.required ? ' (required)' : ' (optional)';
    
    rl.question(`${envVar.description}${requiredText}: `, (answer) => {
      if (envVar.required && !answer.trim()) {
        console.log('❌ This field is required!');
        askNextQuestion();
        return;
      }

      if (answer.trim()) {
        envContent += `${envVar.key}=${answer.trim()}\n`;
      } else {
        envContent += `# ${envVar.key}=${envVar.example}\n`;
      }

      currentIndex++;
      askNextQuestion();
    });
  }

  function finishSetup() {
    // Add additional configuration
    envContent += '\n# Application Configuration\n';
    envContent += 'NODE_ENV=development\n';
    envContent += 'PORT=3001\n';
    envContent += 'CORS_ORIGIN=http://localhost:3000\n';

    // Write .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Environment setup complete!');
    console.log('📁 .env file created at:', envPath);
    console.log('\n🔧 Next steps:');
    console.log('1. Review the .env file and update any values if needed');
    console.log('2. Install dependencies: npm install');
    console.log('3. Start the development server: npm run dev');
    console.log('\n📚 For more information, see the README.md file');
    
    rl.close();
  }

  askNextQuestion();
}
