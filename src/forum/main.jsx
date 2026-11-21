import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ForumApp from './ForumApp.jsx';

createRoot(document.getElementById('forum-root')).render(
  <StrictMode>
    <ForumApp />
  </StrictMode>
);
