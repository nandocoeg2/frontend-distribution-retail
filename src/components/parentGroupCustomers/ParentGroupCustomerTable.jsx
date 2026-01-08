import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const ParentGroupCustomerTable = ({
    parentGroupCustomers,
    pagination,
    onPageChange,
    onLimitChange,
    onDelete,
    onViewDetail,
    selectedParentGroupCustomerId,
    searchQuery
}) => {
    return (
        <div className='space-y-2'>
            <div className='overflow-x-auto'>
                <table className='min-w-full bg-white border border-gray-200 text-xs table-fixed'>
                    <colgroup>
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '60px' }} />
                    </colgroup>
                    <thead className='bg-gray-50'>
                        <tr>
                            <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Kode Parent
                            </th>
                            <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Nama Parent
                            </th>
                            <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Jumlah Group
                            </th>
                            <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Created At
                            </th>
                            <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-100'>
                        {parentGroupCustomers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className='px-2 py-1 text-center text-gray-500 text-xs'>
                                    {searchQuery ? 'No parent group customers found matching your search.' : 'No parent group customers available.'}
                                </td>
                            </tr>
                        ) : (
                            parentGroupCustomers.map((pgc) => (
                                <tr
                                    key={pgc.id}
                                    onClick={() => onViewDetail(pgc)}
                                    className={`cursor-pointer transition-colors h-8 ${selectedParentGroupCustomerId === pgc.id
                                        ? 'bg-blue-50 border-l-4 border-blue-500'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <td className='px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900'>
                                        {pgc.kode_parent}
                                    </td>
                                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={pgc.nama_parent}>
                                        {pgc.nama_parent}
                                    </td>
                                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-600'>
                                        {pgc.groupCustomers?.length || 0} group(s)
                                    </td>
                                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-600'>
                                        {new Date(pgc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className='px-2 py-1 whitespace-nowrap text-xs'>
                                        <div className='flex space-x-1'>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(pgc.id);
                                                }}
                                                className='p-0.5 text-red-600 hover:text-red-900'
                                                title='Delete'
                                            >
                                                <TrashIcon className='h-4 w-4' />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
        </div>
    );
};

export default ParentGroupCustomerTable;
