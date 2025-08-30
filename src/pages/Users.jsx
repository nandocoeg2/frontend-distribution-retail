import React, { useState } from 'react';

import HeroIcon from '../components/atoms/HeroIcon.jsx';

import toastService from '../services/toastService';

const Users = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2024-01-15',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'User',
      status: 'Active',
      lastLogin: '2024-01-14',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'Moderator',
      status: 'Inactive',
      lastLogin: '2024-01-10',
    },
  ]);

  const handleAddUser = () => {
    toastService.info('User creation form would open here');
  };

  const handleEditUser = (user) => {
    toastService.info(`Editing user: ${user.name}`);
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      toastService.success(`User ${user.name} deleted successfully`);
      setUsers(users.filter((u) => u.id !== user.id));
    }
  };

  return (
    <>
      <header className='bg-white/80 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold flex items-center'>
              User Management <HeroIcon name='users' className='w-8 h-8 ml-2' />
            </h1>
            <p>Manage users, roles, and permissions</p>
          </div>
          <button
            onClick={handleAddUser}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center'
          >
            <HeroIcon name='plus' className='w-5 h-5 mr-2' />
            Add New User
          </button>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid md:grid-cols-3 gap-6 mb-8'>
            <div className='bg-white/90 p-6 rounded-2xl shadow-sm'>
              <div className='flex items-center justify-between'>
                <div>
                  <p>Total Users</p>
                  <p className='text-3xl font-bold'>1,234</p>
                </div>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                  <HeroIcon name='users' className='w-6 h-6 text-blue-600' />
                </div>
              </div>
            </div>
            <div className='bg-white/90 p-6 rounded-2xl shadow-sm'>
              <div className='flex items-center justify-between'>
                <div>
                  <p>Active Users</p>
                  <p className='text-3xl font-bold text-green-600'>1,187</p>
                </div>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                  <HeroIcon
                    name='check-circle'
                    className='w-6 h-6 text-green-600'
                  />
                </div>
              </div>
            </div>
            <div className='bg-white/90 p-6 rounded-2xl shadow-sm'>
              <div className='flex items-center justify-between'>
                <div>
                  <p>New This Month</p>
                  <p className='text-3xl font-bold text-purple-600'>47</p>
                </div>
                <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                  <HeroIcon
                    name='chart-bar'
                    className='w-6 h-6 text-purple-600'
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white/90 rounded-2xl shadow-sm'>
            <div className='p-6 border-b'>
              <h3 className='text-lg font-semibold'>All Users</h3>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='p-3 text-left'>User</th>
                    <th className='p-3 text-left'>Role</th>
                    <th className='p-3 text-left'>Status</th>
                    <th className='p-3 text-left'>Last Login</th>
                    <th className='p-3 text-left'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className='hover:bg-gray-50'>
                      <td className='p-3'>{user.name}</td>
                      <td className='p-3'>{user.role}</td>
                      <td className='p-3'>{user.status}</td>
                      <td className='p-3'>{user.lastLogin}</td>
                      <td className='p-3'>
                        <button
                          onClick={() => handleEditUser(user)}
                          className='text-blue-600'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className='text-red-600 ml-2'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Users;
