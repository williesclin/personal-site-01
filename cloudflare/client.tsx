import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../app/page';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<App/>);

import {installAnalytics} from './analytics-browser.mjs';
installAnalytics(import.meta.env.VITE_GA4_MEASUREMENT_ID);

