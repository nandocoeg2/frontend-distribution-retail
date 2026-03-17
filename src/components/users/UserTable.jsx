import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { StatusBadge } from '../ui/Badge';

const getDisplayName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return fullName || user?.username || '-';
};

const UserTable = ({ users, pagination, onPageChange, onLimitChange, onEdit, onDelete, onView, searchQuery }) => {
  const hasUsers = users.length > 0;

  return (
    <div className='space-y-2'>
      <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
        <div className='overflow-x-auto'>
          <table className='min-w-[720px] w-full divide-y divide-gray-200 text-xs'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  User
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Email
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Role
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Status
                </th>
                <th className='px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 bg-white'>
              {!hasUsers ? (
                <tr>
                  <td colSpan='5' className='px-3 py-6 text-center text-xs text-gray-500'>
                    {searchQuery ? 'No users found matching your search.' : 'No users available.'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-2.5 py-1.5 align-top'>
                      <div className='min-w-[180px]'>
                        <div className='font-medium text-gray-900'>{getDisplayName(user)}</div>
                        <div className='text-[11px] text-gray-500'>@{user.username || '-'}</div>
                      </div>
                    </td>
                    <td className='px-2.5 py-1.5 align-top text-gray-700'>
                      <div className='max-w-[240px] truncate'>{user.email || '-'}</div>
                    </td>
                    <td className='px-2.5 py-1.5 align-top'>
                      <StatusBadge
                        status={user.role?.name || 'No Role'}
                        variant={user.role?.name ? 'secondary' : 'light'}
                        size='xs'
                      />
                    </td>
                    <td className='px-2.5 py-1.5 align-top'>
                      <StatusBadge
                        status={user.isActive ? 'Active' : 'Inactive'}
                        variant={user.isActive ? 'success' : 'danger'}
                        size='xs'
                        dot
                      />
                    </td>
                    <td className='px-2.5 py-1.5 align-top'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => onView(user)}
                          className='inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                          title='View'
                        >
                          <EyeIcon className='h-3.5 w-3.5' />
                        </button>
                        <button
                          onClick={() => onEdit(user)}
                          className='inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
                          title='Edit'
                        >
                          <PencilIcon className='h-3.5 w-3.5' />
                        </button>
                        <button
                          onClick={() => onDelete(user.id)}
                          className='inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                          title='Delete'
                        >
                          <TrashIcon className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          compact
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </div>
    </div>
  );
};

export default UserTable;
