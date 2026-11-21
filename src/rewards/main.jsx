import '../../js/page-guard.js'; // signed-in users only (hides the page while checking)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RewardsApp from './RewardsApp.jsx';

createRoot(document.getElementById('rewards-root')).render(
  <StrictMode>
    <RewardsApp />
  </StrictMode>
);
