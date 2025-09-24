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
  ClockIcon as ClockSolidIcon,
} from '@heroicons/react/24/solid';

const ActivityTimeline = ({
  auditTrails = [],
  title = 'Activity Timeline',
  emptyMessage = 'No audit trail data available.',
  showCount = true,
  formatDate = null,
}) => {
  // Default date formatter
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

  const renderActionIcon = (action) => {
    const normalizedAction = (action || '').toUpperCase();
    const iconClasses = 'w-5 h-5';

    const iconMap = {
      CREATE: <PlusCircleIcon className={`{${iconClasses} text-green-600}`} />,
      UPDATE: <PencilSquareIcon className={`{${iconClasses} text-blue-600}`} />,
      DELETE: <TrashIcon className={`{${iconClasses} text-red-600}`} />,
      APPROVE: (
        <CheckCircleIcon className={`{${iconClasses} text-emerald-600}`} />
      ),
      REJECT: <XCircleIcon className={`{${iconClasses} text-red-500}`} />,
      SUBMIT: (
        <PaperAirplaneIcon className={`{${iconClasses} text-purple-500}`} />
      ),
      PROCESS: <Cog8ToothIcon className={`{${iconClasses} text-orange-500}`} />,
      DEFAULT: (
        <QuestionMarkCircleIcon className={`{${iconClasses} text-gray-500}`} />
      ),
    };

    return iconMap[normalizedAction] || iconMap.DEFAULT;
  };

  const getActionColor = (action) => {
    const normalizedAction = (action || '').toUpperCase();
    const colorMap = {
      CREATE: 'bg-green-100',
      UPDATE: 'bg-blue-100',
      DELETE: 'bg-red-100',
      APPROVE: 'bg-emerald-100',
      REJECT: 'bg-red-100',
      SUBMIT: 'bg-purple-100',
      PROCESS: 'bg-orange-100',
      DEFAULT: 'bg-gray-100',
    };
    return colorMap[normalizedAction] || colorMap.DEFAULT;
  };

  const getStatusVariant = (action) => {
    const normalizedAction = (action || '').toUpperCase();
    if (normalizedAction === 'CREATE') return 'success';
    if (normalizedAction === 'UPDATE') return 'primary';
    if (normalizedAction === 'DELETE') return 'danger';
    if (normalizedAction === 'PROCESS') return 'warning';
    return 'secondary';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';

    if (typeof value === 'object') {
      // Handle nested objects
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
      if (value.action) return value.action;
      if (value.result) {
        return typeof value.result === 'object'
          ? 'See details below'
          : value.result;
      }
      return JSON.stringify(value).length > 20
        ? `${JSON.stringify(value).substring(0, 20)}...`
        : JSON.stringify(value);
    }

    if (typeof value === 'string' && value.length > 20) {
      return `${value.substring(0, 20)}...`;
    }

    return String(value);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-xl font-semibold text-gray-900'>{title}</h3>
        {showCount && (
          <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
            {auditTrails?.length || 0} activities
          </div>
        )}
      </div>

      <div className='relative'>
        <div className='absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>

        {auditTrails?.length > 0 ? (
          auditTrails
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((trail) => {
              const actionLabel = (trail.action || '').toUpperCase();
              const displayAction = (trail.action || '')
                .toLowerCase()
                .replace('_', ' ');

              return (
                <div key={trail.id} className='relative flex items-start mb-6'>
                  <div
                    className={`flex-shrink-0 w-8 h-8  rounded-full flex items-center justify-center border-2 border-white shadow-sm`}
                  >
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
                              <span className='text-xs font-semibold text-white'>
                                {trail.user.firstName?.charAt(0) ||
                                  trail.user.username?.charAt(0) ||
                                  'U'}
                              </span>
                            </div>
                            <span className='text-sm text-gray-700'>
                              {trail.user.firstName && trail.user.lastName
                                ? `${trail.user.firstName} ${trail.user.lastName}`
                                : trail.user.username}
                            </span>
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

                    {/* Show details if available */}
                    {trail.details && (
                      <div className='pt-3 mt-3 border-t border-gray-100'>
                        <h5 className='mb-2 text-sm font-medium text-gray-700'>
                          Details:
                        </h5>
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
                            .slice(0, 6)
                            .map(([key, value]) => (
                              <div
                                key={key}
                                className='flex justify-between py-1'
                              >
                                <span className='text-gray-600 capitalize'>
                                  {key.replace(/([A-Z])/g, ' ').toLowerCase()}:
                                </span>
                                <span className='ml-2 font-medium text-gray-900 truncate'>
                                  {formatValue(value)}
                                </span>
                              </div>
                            ))}
                        </div>

                        {/* Show result details if available */}
                        {trail.details.result &&
                          typeof trail.details.result === 'object' && (
                            <div className='p-3 mt-4 rounded-lg bg-gray-50'>
                              <h6 className='mb-2 text-sm font-medium text-gray-700'>
                                Process Result:
                              </h6>
                              <div className='space-y-2 text-xs'>
                                {trail.details.result.status && (
                                  <div className='flex justify-between'>
                                    <span className='text-gray-600'>
                                      Status:
                                    </span>
                                    <span className='font-medium text-gray-900'>
                                      {trail.details.result.status
                                        .status_name ||
                                        trail.details.result.status.status_code}
                                    </span>
                                  </div>
                                )}
                                {trail.details.result.po_number && (
                                  <div className='flex justify-between'>
                                    <span className='text-gray-600'>
                                      PO Number:
                                    </span>
                                    <span className='font-medium text-gray-900'>
                                      {trail.details.result.po_number}
                                    </span>
                                  </div>
                                )}
                                {trail.details.result.customer && (
                                  <div className='flex justify-between'>
                                    <span className='text-gray-600'>
                                      Customer:
                                    </span>
                                    <span className='font-medium text-gray-900'>
                                      {
                                        trail.details.result.customer
                                          .namaCustomer
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        ) : (
          <div className='py-12 text-center'>
            <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
              <ClockSolidIcon className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              No Activity Found
            </h3>
            <p className='text-gray-500'>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
