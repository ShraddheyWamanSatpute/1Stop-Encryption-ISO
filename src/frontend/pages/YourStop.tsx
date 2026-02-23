import { useEffect } from 'react';

/**
 * YourStop Route Handler
 * 
 * This component handles routing to the YourStop Next.js application.
 * The YourStop app runs on a separate Next.js server (port 3000).
 * 
 * Options:
 * 1. Redirect to Next.js app directly (http://localhost:3000)
 * 2. Use iframe to embed (if needed)
 * 3. Use proxy (configured in vite.config.ts)
 */
export default function YourStop() {

  useEffect(() => {
    // Option 1: Redirect to Next.js app directly
    // This is the simplest approach - redirect to the Next.js app
    const yourStopUrl = 'http://localhost:3000';
    
    // Check if we're in development
    if (import.meta.env.DEV) {
      // In development, redirect to Next.js app
      window.location.href = yourStopUrl;
    } else {
      // In production, you might want to use the proxy or iframe
      // For now, redirect to the Next.js app
      window.location.href = yourStopUrl;
    }
  }, []);

  // Show loading state while redirecting
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p>Loading YourStop...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

