import React from 'react';
import { AuthContent } from '../components/auth';

export const VistaAuth: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 flex items-center justify-center p-4">
      <AuthContent />
    </div>
  );
};
