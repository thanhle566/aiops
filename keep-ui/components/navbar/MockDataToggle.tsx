import React from 'react';
import { Switch } from '@headlessui/react';
import { useMockToggle } from '@/shared/lib/hooks/useMockToggle';

export const MockDataToggle: React.FC = () => {
  const { isUseMockData, toggleMockData } = useMockToggle();

  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 bg-yellow-100 rounded-lg">
      <span className="mr-3 font-medium">Mock Data:</span>
      <Switch
        checked={isUseMockData}
        onChange={toggleMockData}
        className={`${
          isUseMockData ? 'bg-green-600' : 'bg-gray-300'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30`}
      >
        <span className="sr-only">Use mock data</span>
        <span
          className={`${
            isUseMockData ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  );
}; 