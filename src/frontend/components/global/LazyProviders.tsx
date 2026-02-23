import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLazyLoad } from './LazyContextProvider';
import { useBackgroundPreloader } from '../../hooks/useBackgroundPreloader';
import { useSettings } from '../../../backend/context/SettingsContext';
import { useCompany } from '../../../backend/context/CompanyContext';
import { isSettingsReady, isCompanyReady } from '../../../backend/utils/ContextDependencies';

// Import providers directly for now (we'll optimize further later)
import { HRProvider } from '../../../backend/context/HRContext';
import { BookingsProvider } from '../../../backend/context/BookingsContext';
import { StockProvider } from '../../../backend/context/StockContext';
import { MessengerProvider } from '../../../backend/context/MessengerContext';
import { FinanceProvider } from '../../../backend/context/FinanceContext';
import { AnalyticsProvider } from '../../../backend/context/AnalyticsContext';
import { NotificationsProvider } from '../../../backend/context/NotificationsContext';
import { AssistantProvider } from '../../../backend/context/AssistantContext';
import { DashboardProvider } from '../../../backend/context/DashboardContext';
import { POSProvider } from '../../../backend/context/POSContext';

interface LazyProvidersProps {
  children: ReactNode;
}

export const LazyProviders: React.FC<LazyProvidersProps> = ({ children }) => {
  const location = useLocation();
  const { isLoaded, loadSection } = useLazyLoad();
  const { 
    startBackgroundPreloading, 
    preloadCurrentRouteRelated, 
    getPreloadProgress 
  } = useBackgroundPreloader();
  
  // Get Settings and Company states to check readiness
  const { state: settingsState } = useSettings();
  const { state: companyState } = useCompany();
  
  // Track if Settings and Company are ready
  const [coreReady, setCoreReady] = useState(false);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);

  // Check if Settings and Company are ready
  useEffect(() => {
    const settingsReady = isSettingsReady(settingsState);
    const companyReady = isCompanyReady(companyState, settingsState);
    const ready = settingsReady && companyReady;
    
    // Reduced logging for performance - only log once when ready
    if (ready && !coreReady) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Core contexts ready - Settings and Company initialized');
      }
      setCoreReady(true);
    }
  }, [settingsState, companyState, coreReady]);

  // Determine which sections are needed based on current route
  // BUT ONLY AFTER Settings and Company are ready
  useEffect(() => {
    // CRITICAL: Wait for Settings and Company to be ready before loading ANY sections
    if (!coreReady) {
      return; // Don't load anything until core contexts are ready
    }
    
    const currentPath = location.pathname;
    
    // Load sections based on current route (immediate loading on every route change)
    // Note: Routes can be /app/..., /HR, /hr, etc. depending on routing setup
    if (currentPath.startsWith('/app/hr') || currentPath.startsWith('/HR') || currentPath.startsWith('/hr')) {
      loadSection('hr');
      loadSection('bookings'); // HR ScheduleManager needs bookings data
    } else if (currentPath.startsWith('/app/company') || currentPath.startsWith('/Company') || currentPath.startsWith('/company')) {
      loadSection('hr'); // Company pages like checklists depend on HR data
    } else if (currentPath === '/' || currentPath === '/app' || currentPath.startsWith('/app/dashboard') || currentPath.startsWith('/Dashboard') || currentPath.startsWith('/dashboard')) {
      loadSection('hr'); // Dashboard uses HR data
      loadSection('analytics'); // Dashboard uses analytics
    } else if (currentPath.startsWith('/app/bookings') || currentPath.startsWith('/Bookings') || currentPath.startsWith('/bookings')) {
      loadSection('bookings');
    } else if (currentPath.startsWith('/app/stock') || currentPath.startsWith('/Stock') || currentPath.startsWith('/stock')) {
      loadSection('stock');
      loadSection('analytics'); // Stock dashboard uses analytics
      loadSection('pos'); // Stock reports use POS data
    } else if (currentPath.startsWith('/app/messenger') || currentPath.startsWith('/Messenger') || currentPath.startsWith('/messenger')) {
      loadSection('messenger', true); // Load immediately (sync) for current route
      loadSection('hr'); // Messenger ContactsManager uses HR data
    } else if (currentPath.startsWith('/app/finance') || currentPath.startsWith('/Finance') || currentPath.startsWith('/finance')) {
      loadSection('finance');
    } else if (currentPath.startsWith('/app/analytics') || currentPath.startsWith('/Analytics') || currentPath.startsWith('/analytics')) {
      loadSection('analytics');
    } else if (currentPath.startsWith('/app/pos') || currentPath.startsWith('/POS') || currentPath.startsWith('/pos')) {
      loadSection('pos'); // Load POS section
      loadSection('stock'); // POS needs stock
    }

    // Always load core functionality immediately (but only after Settings/Company ready)
    // Only load these once to avoid redundant calls
    if (!hasStartedLoading) {
      loadSection('notifications');
      loadSection('assistant');
      loadSection('analytics'); // Always load analytics since DashboardProvider depends on it
      setHasStartedLoading(true);
    }

    // Preload related sections for current route
    preloadCurrentRouteRelated(currentPath);

    // Start intelligent background preloading after longer delay to let critical data load first
    // Only start once to avoid multiple timers
    if (!hasStartedLoading) {
      const timer = setTimeout(() => {
        startBackgroundPreloading();
        // Only log progress if it's significant (every 25%)
        const progress = getPreloadProgress();
        if (progress.percentage % 25 === 0) {
          console.log(`📊 Preload Progress: ${progress.percentage}% (${progress.loaded}/${progress.total})`);
        }
      }, 4000); // Increased from 1500ms to 4000ms

      return () => clearTimeout(timer);
    }
  }, [coreReady, hasStartedLoading, location.pathname, loadSection, preloadCurrentRouteRelated, startBackgroundPreloading, getPreloadProgress]);

  // Conditional provider rendering based on what's loaded
  let wrappedChildren = children;

  // Always wrap with core providers FIRST - they don't depend on Settings/Company
  // These must be available immediately for components like AssistantContainer
  wrappedChildren = <AssistantProvider>{wrappedChildren}</AssistantProvider>;
  
  // NotificationsProvider depends on CompanyProvider, so only render when coreReady
  // Otherwise it will throw "useCompany must be used within a CompanyProvider"
  if (coreReady) {
    wrappedChildren = <NotificationsProvider>{wrappedChildren}</NotificationsProvider>;
  }

  // Only render module providers if Settings and Company are ready
  if (!coreReady) {
    // Return with core providers only - module providers wait for Settings/Company
    return <>{wrappedChildren}</>;
  }
  
  // Load module-specific providers BEFORE Analytics so data is available
  if (isLoaded('finance')) {
    wrappedChildren = <FinanceProvider>{wrappedChildren}</FinanceProvider>;
  }

  if (isLoaded('messenger')) {
    wrappedChildren = <MessengerProvider>{wrappedChildren}</MessengerProvider>;
  }

  if (isLoaded('stock')) {
    wrappedChildren = <StockProvider>{wrappedChildren}</StockProvider>;
  }

  if (isLoaded('bookings')) {
    wrappedChildren = <BookingsProvider>{wrappedChildren}</BookingsProvider>;
  }

  if (isLoaded('hr')) {
    wrappedChildren = <HRProvider>{wrappedChildren}</HRProvider>;
  }

  if (isLoaded('pos')) {
    wrappedChildren = <POSProvider>{wrappedChildren}</POSProvider>;
  }
  
  // Always load analytics AFTER module providers so it can access their data
  // Only render if analytics section is loaded
  if (isLoaded('analytics')) {
    wrappedChildren = <AnalyticsProvider>{wrappedChildren}</AnalyticsProvider>;
  }
  
  // DashboardProvider depends on AnalyticsProvider, so only render if analytics is loaded
  if (isLoaded('analytics')) {
    wrappedChildren = <DashboardProvider>{wrappedChildren}</DashboardProvider>;
  }

  return <>{wrappedChildren}</>;
};
