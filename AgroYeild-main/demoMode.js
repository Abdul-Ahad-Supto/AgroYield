// config/demoMode.js
export const DEMO_CONFIG = {
  isDemoMode: process.env.REACT_APP_DEMO_MODE === 'true',
  quickApproval: true,
  skipComplexForms: true,
  preloadedData: true,
  oneClickActions: true
};

// Use in components
import { DEMO_CONFIG } from '../config/demoMode';