import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./frontend/styles/global.css";
import { CompanyProvider } from "./backend/context/CompanyContext";
import { SettingsProvider } from "./backend/context/SettingsContext";
import { LazyContextProvider } from "./frontend/components/global/LazyContextProvider";
import { EncryptionProvider } from "./backend/services/encryption/EncryptionInitializer";

const container = document.getElementById("root");

if (container) {
  const root = ReactDOM.createRoot(container);

  // Device detection happens in DeviceRouter component
  // This ensures proper client-side routing without page reload
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        {/* Initialize encryption FIRST - required for UK GDPR compliance */}
        <EncryptionProvider>
          {/* Load Settings and Company FIRST - they're always needed and must load instantly */}
          <SettingsProvider>
            <CompanyProvider>
              {/* LazyContextProvider only manages module contexts, not core contexts */}
              <LazyContextProvider>
                <App />
              </LazyContextProvider>
            </CompanyProvider>
          </SettingsProvider>
        </EncryptionProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  console.error("Root container not found");
}
