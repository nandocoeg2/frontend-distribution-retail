import React, { useState } from 'react';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: 'cog' },
    { id: 'security', name: 'Security', icon: 'lock-closed' },
    { id: 'notifications', name: 'Notifications', icon: 'bell' },
    { id: 'appearance', name: 'Appearance', icon: 'paint-brush' },
  ];

  return (
    <>
      <header className='bg-white/80 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold flex items-center'>
              Settings <HeroIcon name='cog' className='w-8 h-8 ml-2' />
            </h1>
            <p>Manage your application preferences</p>
          </div>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-white/90 rounded-2xl shadow-sm'>
            <div className='border-b px-6'>
              <div className='flex space-x-8'>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    <HeroIcon name={tab.icon} className='w-5 h-5' />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className='p-6'>
              {activeTab === 'security' && (
                <div>
                  <h3 className='text-lg font-semibold'>Security Settings</h3>
                  <div className='p-4 bg-green-50 rounded-lg border border-green-200 mt-4'>
                    <div className='flex items-center'>
                      <HeroIcon
                        name='check-circle'
                        className='w-5 h-5 text-green-600 mr-2'
                      />
                      <span>Two-factor authentication is enabled</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Settings;
