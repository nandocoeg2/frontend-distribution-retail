import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ViewUserModal = ({ show, onClose, user }) => {
  if (!show || !user) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Details</h2>
            <p className="text-sm text-gray-600">View user information</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{user.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{user.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Role & Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{user.role?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <p className="mt-1 text-sm text-gray-900">{user.company?.name || 'N/A'}</p>
                </div>
              </div>
              
              {user.role?.menus && user.role.menus.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accessible Menus</label>
                  <div className="flex flex-wrap gap-2">
                    {user.role.menus.map((menu) => (
                      <span
                        key={menu.id}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                      >
                        {menu.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Information */}
            {(user.profile?.phoneNumber || user.profile?.address || user.profile?.position) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.profile?.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="mt-1 text-sm text-gray-900">{user.profile.phoneNumber}</p>
                    </div>
                  )}
                  {user.profile?.position && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Position</label>
                      <p className="mt-1 text-sm text-gray-900">{user.profile.position}</p>
                    </div>
                  )}
                  {user.profile?.address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-sm text-gray-900">{user.profile.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Company Information */}
            {user.company && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user.company.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Code</label>
                    <p className="mt-1 text-sm text-gray-900">{user.company.code}</p>
                  </div>
                  {user.company.address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Company Address</label>
                      <p className="mt-1 text-sm text-gray-900">{user.company.address}</p>
                    </div>
                  )}
                  {user.company.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{user.company.phoneNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                {user.lastLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(user.lastLogin).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;
