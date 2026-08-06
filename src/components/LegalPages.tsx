import React from 'react';
import { LegalPageView } from './LegalPageView';

export const PrivacyPolicyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <LegalPageView pageId="privacy" onBack={onBack} />
);

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <LegalPageView pageId="terms" onBack={onBack} />
);

export const ReturnsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <LegalPageView pageId="returns" onBack={onBack} />
);

export const ShippingPolicyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <LegalPageView pageId="shipping" onBack={onBack} />
);
