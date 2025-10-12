import React, { useState } from 'react';
import { formatDateTime } from '../../utils/formatUtils';
import {
  XMarkIcon,
  UserCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  UserIcon,
  KeyIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import ActivityTimeline from '../common/ActivityTimeline';
import {
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
  AccordionItem,
  InfoTable,
  StatusBadge,
} from '../ui';

const ViewUserModal = ({ show, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    roleInfo: false,
    metaInfo: false,
  });

  if (!show || !user) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const statusLabel = user.isActive ? 'Active' : 'Inactive';
  const statusVariant = user.isActive ? 'success' : 'danger';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <InformationCircleIcon className='w-5 h-5' />,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <ClockIcon className='w-5 h-5' />,
      badge: user.auditTrails?.length,
    },
  ];
  const auditTrails = Array.isArray(user.auditTrails) ? user.auditTrails : [];

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <UserCircleIcon className='w-8 h-8 text-blue-600' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>User Details</h2>
              <p className='text-sm text-gray-600'>
                {fullName || user.username || '-'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            aria-label='Close user details'
          >
            <XMarkIcon className='w-6 h-6 text-gray-500' />
          </button>
        </div>

        <div className='border-b border-gray-200 bg-gray-50 px-6'>
          <TabContainer activeTab={activeTab} onTabChange={setActiveTab}>
            {tabs.map((tab) => (
              <Tab key={tab.id} {...tab} />
            ))}
          </TabContainer>
        </div>

        <div className='flex-1 overflow-y-auto p-6 bg-gray-50'>
          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
              <div className='space-y-6'>
                <AccordionItem
                  title='Basic Information'
                  isExpanded={expandedSections.basicInfo}
                  onToggle={() => toggleSection('basicInfo')}
                  bgColor='bg-gradient-to-r from-blue-50 to-blue-100'
                  icon={<UserIcon className='w-5 h-5 text-blue-600' />}
                >
                  <InfoTable
                    data={[
                      { label: 'Username', value: user.username || '-' },
                      { label: 'Full Name', value: fullName || '-' },
                      { label: 'Email', value: user.email || '-' },
                      {
                        label: 'Status',
                        component: (
                          <StatusBadge status={statusLabel} variant={statusVariant} size='sm' />
                        ),
                      },
                      {
                        label: 'User ID',
                        value: user.id || '-',
                        copyable: Boolean(user.id),
                      },
                    ]}
                  />
                </AccordionItem>

                <AccordionItem
                  title='Access Information'
                  isExpanded={expandedSections.roleInfo}
                  onToggle={() => toggleSection('roleInfo')}
                  bgColor='bg-gradient-to-r from-indigo-50 to-indigo-100'
                  icon={<KeyIcon className='w-5 h-5 text-indigo-600' />}
                >
                  <InfoTable
                    data={[
                      {
                        label: 'Role',
                        component: user.role?.name ? (
                          <StatusBadge status={user.role.name} variant='primary' size='sm' />
                        ) : (
                          <span className='text-gray-500'>-</span>
                        ),
                      },
                      {
                        label: 'Role Description',
                        value: user.role?.description || '-',
                      },
                      {
                        label: 'Role ID',
                        value: user.role?.id || user.roleId || '-',
                        copyable: Boolean(user.role?.id || user.roleId),
                      },
                    ]}
                  />
                </AccordionItem>

                <AccordionItem
                  title='System Information'
                  isExpanded={expandedSections.metaInfo}
                  onToggle={() => toggleSection('metaInfo')}
                  bgColor='bg-gradient-to-r from-gray-50 to-gray-100'
                  icon={<Cog6ToothIcon className='w-5 h-5 text-gray-600' />}
                >
                  <InfoTable
                    data={[
                      { label: 'Created At', value: formatDateTime(user.createdAt) },
                      { label: 'Updated At', value: formatDateTime(user.updatedAt) },
                      { label: 'Created By', value: user.createdBy || '-' },
                      { label: 'Updated By', value: user.updatedBy || '-' },
                    ]}
                  />
                </AccordionItem>
              </div>
            </TabPanel>

            <TabPanel tabId='timeline'>
              <ActivityTimeline
                auditTrails={auditTrails}
                title='User Activity'
                emptyMessage='No activity data available for this user.'
                formatDate={formatDateTime}
              />
            </TabPanel>
          </TabContent>
        </div>

        <div className='border-t border-gray-200 p-6 bg-white'>
          <div className='flex justify-end space-x-3'>
            <button
              onClick={onClose}
              className='px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;

