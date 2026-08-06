import React from 'react';
import { DeveloperDashboard } from './DeveloperDashboard';

export const DevConsolePage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <DeveloperDashboard onBack={onBack} />
);
