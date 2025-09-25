import React from 'react';
import { StatusBadge } from '../ui';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  Cog8ToothIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';

const ActivityTimeline = ({
  auditTrails = [],
  title = 'Activity Timeline',
  emptyMessage = 'No activity found.',
  showCount = true,
  formatDate = null,
}) => {
  const defaultFormatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDateTime = formatDate || defaultFormatDate;
  const iconClasses = 'w-5 h-5';

  const iconMap = {
    CREATE: <PlusCircleIcon className={iconClasses + ' text-green-600'} />,
    UPDATE: <PencilSquareIcon className={iconClasses + ' text-blue-600'} />,
    DELETE: <TrashIcon className={iconClasses + ' text-red-600'} />,
    APPROVE: <CheckCircleIcon className={iconClasses + ' text-emerald-600'} />,
    REJECT: <XCircleIcon className={iconClasses + ' text-red-500'} />,
    SUBMIT: <PaperAirplaneIcon className={iconClasses + ' text-purple-500'} />,
    PROCESS: <Cog8ToothIcon className={iconClasses + ' text-orange-500'} />,
    DEFAULT: <QuestionMarkCircleIcon className={iconClasses + ' text-gray-500'} />,
  };

  const renderActionIcon = (action) => {
    const normalizedAction = (action || '').toUpperCase();
    return iconMap[normalizedAction] || iconMap.DEFAULT;
  };

  const getStatusVariant = (action) => {
    const normalizedAction = (action || '').toUpperCase();
    if (normalizedAction === 'CREATE') return 'success';
    if (normalizedAction === 'UPDATE') return 'primary';
    if (normalizedAction === 'DELETE') return 'danger';
    if (normalizedAction === 'PROCESS') return 'warning';
    return 'secondary';
  };

  const truncate = (value) => {
    return value.length > 60 ? value.slice(0, 57) + '...' : value;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'object') {
      if (value.status) {
        if (typeof value.status === 'object') {
          return (
            value.status.status_name ||
            value.status.status_code ||
            'Status Object'
          );
        }
        return value.status;
      }
      if (value.action) {
        return value.action;
      }
      if (value.result) {
        return typeof value.result === 'object'
          ? 'See details below'
          : value.result;
      }

      const serialized = JSON.stringify(value);
      return truncate(serialized);
    }

    if (typeof value === 'string') {
      return truncate(value);
    }

    return String(value);
  };

  const entries = Array.isArray(auditTrails)
    ? [...auditTrails].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-xl font-semibold text-gray-900'>{title}</h3>
        {showCount && (
          <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
            {entries.length} activities
          </div>
        )}
      </div>

      <div className='relative'>
        <div className='absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200' />

        {entries.length > 0 ? (
          entries.map((trail) => {
            const actionLabel = (trail.action || '').toUpperCase();
            const displayAction = (trail.action || '')
              .toLowerCase()
              .replace('_', ' ');

            const userInitial =
              (trail.user?.firstName && trail.user.firstName.charAt(0)) ||
              (trail.user?.username && trail.user.username.charAt(0)) ||
              'U';
            const userFullName =
              trail.user?.firstName && trail.user?.lastName
                ? trail.user.firstName + ' ' + trail.user.lastName
                : trail.user?.username;

            return (
              <div key={trail.id} className='relative flex items-start mb-6'>
                <div className='flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-white'>
                  {renderActionIcon(actionLabel)}
                </div>
                <div className='flex-1 p-4 ml-4 bg-white border border-gray-200 rounded-lg shadow-sm'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <h4 className='font-semibold text-gray-900 capitalize'>
                        {displayAction} {trail.tableName}
                      </h4>
                      <p className='mt-1 text-sm text-gray-600'>
                        {formatDateTime(trail.timestamp)}
                      </p>
                      {trail.user && (
                        <div className='flex items-center mt-2 space-x-2'>
                          <div className='flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full'>
                            <span className='text-xs font-semibold text-white'>{userInitial}</span>
                          </div>
                          <span className='text-sm text-gray-700'>{userFullName}</span>
                          <span className='text-xs text-gray-500'>
                            ({trail.user.username})
                          </span>
                        </div>
                      )}
                    </div>
                    <StatusBadge
                      status={actionLabel || 'UNKNOWN'}
                      variant={getStatusVariant(actionLabel)}
                    />
                  </div>

                  {trail.details && (
                    <div className='pt-3 mt-3 border-t border-gray-100'>
                      <h5 className='mb-2 text-sm font-medium text-gray-700'>Details:</h5>
                      <div className='grid grid-cols-1 gap-2 text-xs md:grid-cols-2'>
                        {Object.entries(trail.details)
                          .filter(
                            ([key]) =>
                              ![
                                'id',
                                'createdAt',
                                'updatedAt',
                                'createdBy',
                                'updatedBy',
                              ].includes(key)
                          )
                          .map(([key, value]) => {
                            const label = key
                              .replace(/([A-Z])/g, ' ')
                              .replace(/_/g, ' ')
                              .trim();

                            return (
                              <div
                                key={key}
                                className='flex items-start justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-100'
                              >
                                <span className='font-medium text-gray-700 capitalize'>{label}</span>
                                <span className='text-gray-600 ml-2 text-right'>{formatValue(value)}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className='text-center py-8 text-gray-500'>{emptyMessage}</div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
