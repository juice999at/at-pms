
import React from 'react';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error';
}

const Notification: React.FC<NotificationProps> = ({ message, type = 'success' }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
      <div className={`px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3 border ${
        type === 'success' ? 'bg-white border-emerald-100 text-emerald-800' : 'bg-white border-red-100 text-red-800'
      }`}>
        <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-bold tracking-tight">{message}</span>
      </div>
    </div>
  );
};

export default Notification;
