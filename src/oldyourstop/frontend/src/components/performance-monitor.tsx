'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Clock, Database, Wifi, WifiOff } from 'lucide-react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  isOnline: boolean;
  connectionType: string;
  memoryUsage: number | null;
  cacheSize: number;
  bundleSize: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    memoryUsage: null,
    cacheSize: 0,
    bundleSize: 0,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or for admin users
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const measurePerformance = () => {
      // Web Vitals
      if ('PerformanceObserver' in window) {
        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries[0]?.startTime;
          if (fcp) {
            setMetrics(prev => ({ ...prev, fcp }));
          }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1]?.startTime;
          if (lcp) {
            setMetrics(prev => ({ ...prev, lcp }));
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fid = entries[0]?.processingStart - entries[0]?.startTime;
          if (fid) {
            setMetrics(prev => ({ ...prev, fid }));
          }
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          setMetrics(prev => ({ ...prev, cls: clsValue }));
        }).observe({ entryTypes: ['layout-shift'] });
      }

      // Time to First Byte
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }

      // Connection information
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown',
        }));
      }

      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        }));
      }

      // Cache size
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          Promise.all(
            cacheNames.map(cacheName => caches.open(cacheName))
          ).then(caches => {
            Promise.all(
              caches.map(cache => cache.keys())
            ).then(keys => {
              const totalSize = keys.flat().length;
              setMetrics(prev => ({ ...prev, cacheSize: totalSize }));
            });
          });
        });
      }

      // Bundle size estimation
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.includes('_next/static')) {
          // Estimate based on script count
          totalSize += 100; // KB per script estimate
        }
      });
      setMetrics(prev => ({ ...prev, bundleSize: totalSize }));
    };

    // Online/offline status
    const handleOnlineStatus = () => {
      setMetrics(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Measure performance after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const getPerformanceScore = () => {
    let score = 100;
    
    // FCP scoring (0-2.5s is good)
    if (metrics.fcp && metrics.fcp > 2500) score -= 20;
    else if (metrics.fcp && metrics.fcp > 1500) score -= 10;
    
    // LCP scoring (0-2.5s is good)
    if (metrics.lcp && metrics.lcp > 4000) score -= 25;
    else if (metrics.lcp && metrics.lcp > 2500) score -= 15;
    
    // FID scoring (0-100ms is good)
    if (metrics.fid && metrics.fid > 300) score -= 20;
    else if (metrics.fid && metrics.fid > 100) score -= 10;
    
    // CLS scoring (0-0.1 is good)
    if (metrics.cls && metrics.cls > 0.25) score -= 15;
    else if (metrics.cls && metrics.cls > 0.1) score -= 10;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Don't show in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const score = getPerformanceScore();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2"
        size="sm"
        variant="outline"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>

      {isVisible && (
        <Card className="w-80 max-h-96 overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Performance Monitor</CardTitle>
              <Badge className={getScoreBadge(score)}>
                {score}/100
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Real-time performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Core Web Vitals */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700">Core Web Vitals</h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>FCP:</span>
                  <span className={metrics.fcp && metrics.fcp > 2500 ? 'text-red-600' : 'text-green-600'}>
                    {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>LCP:</span>
                  <span className={metrics.lcp && metrics.lcp > 4000 ? 'text-red-600' : 'text-green-600'}>
                    {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>FID:</span>
                  <span className={metrics.fid && metrics.fid > 300 ? 'text-red-600' : 'text-green-600'}>
                    {metrics.fid ? `${Math.round(metrics.fid)}ms` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>CLS:</span>
                  <span className={metrics.cls && metrics.cls > 0.25 ? 'text-red-600' : 'text-green-600'}>
                    {metrics.cls ? metrics.cls.toFixed(3) : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Network & System */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700">Network & System</h4>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <div className="flex items-center gap-1">
                    {metrics.isOnline ? (
                      <Wifi className="w-3 h-3 text-green-600" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-600" />
                    )}
                    <span className={metrics.isOnline ? 'text-green-600' : 'text-red-600'}>
                      {metrics.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className="text-gray-600">{metrics.connectionType}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>TTFB:</span>
                  <span className={metrics.ttfb && metrics.ttfb > 600 ? 'text-red-600' : 'text-green-600'}>
                    {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : '-'}
                  </span>
                </div>
                
                {metrics.memoryUsage && (
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span className={metrics.memoryUsage > 100 ? 'text-red-600' : 'text-green-600'}>
                      {metrics.memoryUsage}MB
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Cache:</span>
                  <span className="text-gray-600">{metrics.cacheSize} items</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Bundle:</span>
                  <span className="text-gray-600">~{metrics.bundleSize}KB</span>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            {score < 90 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Optimization Tips</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {metrics.fcp && metrics.fcp > 2500 && (
                    <div>• Optimize images and reduce bundle size</div>
                  )}
                  {metrics.lcp && metrics.lcp > 4000 && (
                    <div>• Lazy load images and optimize LCP element</div>
                  )}
                  {metrics.fid && metrics.fid > 300 && (
                    <div>• Reduce JavaScript execution time</div>
                  )}
                  {metrics.cls && metrics.cls > 0.1 && (
                    <div>• Reserve space for dynamic content</div>
                  )}
                  {metrics.ttfb && metrics.ttfb > 600 && (
                    <div>• Optimize server response time</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
