import React from 'react';
import { StatusBadge } from '../ui';

const ActivityTimeline = ({ 
  auditTrails = [], 
  title = "Activity Timeline",
  emptyMessage = "No audit trail data available.",
  showCount = true,
  formatDate = null
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
      second: '2-digit'
    });
  };

  const formatDateTime = formatDate || defaultFormatDate;

  const getActionIcon = (action) => {
    const iconMap = {
      'CREATE': '✨',
      'UPDATE': '📝',
      'DELETE': '🗑️',
      'APPROVE': '✅',
      'REJECT': '❌',
      'SUBMIT': '📤',
      'PROCESS': '⚡',
      'DEFAULT': '🔄'
    };
    return iconMap[action] || iconMap.DEFAULT;
  };

  const getActionColor = (action) => {
    const colorMap = {
      'CREATE': 'bg-green-100',
      'UPDATE': 'bg-blue-100',
      'DELETE': 'bg-red-100',
      'APPROVE': 'bg-emerald-100',
      'REJECT': 'bg-red-100',
      'SUBMIT': 'bg-purple-100',
      'PROCESS': 'bg-orange-100',
      'DEFAULT': 'bg-gray-100'
    };
    return colorMap[action] || colorMap.DEFAULT;
  };

  const getStatusVariant = (action) => {
    if (action === 'CREATE') return 'success';
    if (action === 'UPDATE') return 'primary';
    if (action === 'DELETE') return 'danger';
    if (action === 'PROCESS') return 'warning';
    return 'secondary';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'object') {
      // Handle nested objects
      if (value.status) {
        if (typeof value.status === 'object') {
          return value.status.status_name || value.status.status_code || 'Status Object';
        }
        return value.status;
      }
      if (value.action) return value.action;
      if (value.result) {
        return typeof value.result === 'object' ? 'See details below' : value.result;
      }
      return JSON.stringify(value).length > 20 ? 
        `${JSON.stringify(value).substring(0, 20)}...` : 
        JSON.stringify(value);
    }
    
    if (typeof value === 'string' && value.length > 20) {
      return `${value.substring(0, 20)}...`;
    }
    
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {showCount && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {auditTrails?.length || 0} activities
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {auditTrails?.length > 0 ? (
          auditTrails
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((trail, index) => (
              <div key={trail.id} className="relative flex items-start mb-6">
                <div className={`flex-shrink-0 w-8 h-8 ${getActionColor(trail.action)} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                  <span className="text-sm">{getActionIcon(trail.action)}</span>
                </div>
                <div className="ml-4 bg-white p-4 rounded-lg border border-gray-200 flex-1 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {trail.action.toLowerCase().replace('_', ' ')} {trail.tableName}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(trail.timestamp)}
                      </p>
                      {trail.user && (
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-semibold">
                              {trail.user.firstName?.charAt(0) || trail.user.username?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700">
                            {trail.user.firstName && trail.user.lastName 
                              ? `${trail.user.firstName} ${trail.user.lastName}`
                              : trail.user.username
                            }
                          </span>
                          <span className="text-xs text-gray-500">({trail.user.username})</span>
                        </div>
                      )}
                    </div>
                    <StatusBadge 
                      status={trail.action} 
                      variant={getStatusVariant(trail.action)} 
                    />
                  </div>
                  
                  {/* Show details if available */}
                  {trail.details && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Details:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {Object.entries(trail.details)
                          .filter(([key, value]) => !['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(key))
                          .slice(0, 6)
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <span className="text-gray-900 font-medium ml-2 truncate">
                                {formatValue(value)}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                      
                      {/* Show result details if available */}
                      {trail.details.result && typeof trail.details.result === 'object' && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h6 className="text-sm font-medium text-gray-700 mb-2">Process Result:</h6>
                          <div className="space-y-2 text-xs">
                            {trail.details.result.status && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="text-gray-900 font-medium">
                                  {trail.details.result.status.status_name || trail.details.result.status.status_code}
                                </span>
                              </div>
                            )}
                            {trail.details.result.po_number && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">PO Number:</span>
                                <span className="text-gray-900 font-medium">{trail.details.result.po_number}</span>
                              </div>
                            )}
                            {trail.details.result.customer && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Customer:</span>
                                <span className="text-gray-900 font-medium">{trail.details.result.customer.namaCustomer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
