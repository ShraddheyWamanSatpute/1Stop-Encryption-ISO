"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';

export function FirebaseConfigCheck() {
  const [configStatus, setConfigStatus] = useState<string>('');

  const checkConfiguration = () => {
    const config = auth.app.options;
    
    const status = {
      projectId: config.projectId,
      authDomain: config.authDomain,
      apiKey: config.apiKey ? '✅ Present' : '❌ Missing',
      currentDomain: window.location.origin,
      firebaseInitialized: auth ? '✅ Initialized' : '❌ Not initialized'
    };

    setConfigStatus(JSON.stringify(status, null, 2));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>🔍 Firebase Configuration Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkConfiguration} className="w-full">
          Check Firebase Config
        </Button>
        
        {configStatus && (
          <Alert>
            <AlertDescription>
              <pre className="whitespace-pre-wrap text-sm">
                {configStatus}
              </pre>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-gray-600 space-y-2">
          <h4 className="font-semibold">Required Google Cloud Console Settings:</h4>
          <div className="bg-gray-50 p-3 rounded">
            <p><strong>Authorized JavaScript origins:</strong></p>
            <ul className="list-disc pl-5 text-xs">
              <li>http://localhost:9002</li>
              <li>https://localhost:9002</li>
              <li>https://bookmytable-ea37d.firebaseapp.com</li>
            </ul>
            <p className="mt-2"><strong>Authorized redirect URIs:</strong></p>
            <ul className="list-disc pl-5 text-xs">
              <li>http://localhost:9002/__/auth/handler</li>
              <li>https://localhost:9002/__/auth/handler</li>
              <li>https://bookmytable-ea37d.firebaseapp.com/__/auth/handler</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
