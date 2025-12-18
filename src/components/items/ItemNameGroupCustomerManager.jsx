import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import itemNameGroupCustomerService from '../../services/itemNameGroupCustomerService';
import groupCustomerService from '../../services/groupCustomerService';
import toastService from '../../services/toastService';

/**
 * Component for managing item names per group customer
 * Displays a list of custom names for different group customers and allows adding/editing/deleting
 */
const ItemNameGroupCustomerManager = ({ itemId, defaultItemName }) => {
    const [names, setNames] = useState([]);
    const [groupCustomers, setGroupCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form state for adding new
    const [newGroupCustomerId, setNewGroupCustomerId] = useState('');
    const [newNamaBarang, setNewNamaBarang] = useState('');

    // Form state for editing
    const [editNamaBarang, setEditNamaBarang] = useState('');

    // Load names for this item
    const loadNames = useCallback(async () => {
        if (!itemId) return;

        setLoading(true);
        try {
            const response = await itemNameGroupCustomerService.getByItemId(itemId);
            // Response is already an array from the API interceptor
            setNames(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error('Error loading item names:', error);
            toastService.error('Gagal memuat daftar nama per group');
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    // Load group customers for dropdown
    const loadGroupCustomers = useCallback(async () => {
        try {
            const response = await groupCustomerService.getAll(1, 100);
            setGroupCustomers(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Error loading group customers:', error);
        }
    }, []);

    useEffect(() => {
        loadNames();
        loadGroupCustomers();
    }, [loadNames, loadGroupCustomers]);

    // Get available group customers (not yet assigned)
    const availableGroupCustomers = groupCustomers.filter(
        gc => !names.some(n => n.groupCustomerId === gc.id)
    );

    // Handle add new name
    const handleAdd = async () => {
        if (!newGroupCustomerId || !newNamaBarang.trim()) {
            toastService.error('Pilih group customer dan masukkan nama barang');
            return;
        }

        try {
            await itemNameGroupCustomerService.create({
                itemId,
                groupCustomerId: newGroupCustomerId,
                nama_barang: newNamaBarang.trim(),
            });
            toastService.success('Nama berhasil ditambahkan');
            setIsAdding(false);
            setNewGroupCustomerId('');
            setNewNamaBarang('');
            loadNames();
        } catch (error) {
            console.error('Error adding name:', error);
            toastService.error(error.response?.data?.message || 'Gagal menambahkan nama');
        }
    };

    // Handle edit name
    const handleEdit = async (id) => {
        if (!editNamaBarang.trim()) {
            toastService.error('Nama barang tidak boleh kosong');
            return;
        }

        try {
            await itemNameGroupCustomerService.update(id, {
                nama_barang: editNamaBarang.trim(),
            });
            toastService.success('Nama berhasil diupdate');
            setEditingId(null);
            setEditNamaBarang('');
            loadNames();
        } catch (error) {
            console.error('Error updating name:', error);
            toastService.error(error.response?.data?.message || 'Gagal mengupdate nama');
        }
    };

    // Handle delete name
    const handleDelete = async (id, groupName) => {
        if (!window.confirm(`Hapus nama untuk group "${groupName}"?`)) {
            return;
        }

        try {
            await itemNameGroupCustomerService.delete(id);
            toastService.success('Nama berhasil dihapus');
            loadNames();
        } catch (error) {
            console.error('Error deleting name:', error);
            toastService.error(error.response?.data?.message || 'Gagal menghapus nama');
        }
    };

    // Start editing
    const startEdit = (item) => {
        setEditingId(item.id);
        setEditNamaBarang(item.nama_barang);
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingId(null);
        setEditNamaBarang('');
    };

    if (loading && names.length === 0) {
        return (
            <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-indigo-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Nama per Group Customer</h3>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        disabled={groupCustomers.length === 0}
                        className="flex items-center px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title={groupCustomers.length === 0 ? 'Tidak ada group customer tersedia' : 'Tambah nama baru'}
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Tambah
                    </button>
                )}
            </div>

            {/* Info about default name */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-600">
                    <span className="font-medium">Nama Default:</span> {defaultItemName || '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    Nama default digunakan jika tidak ada nama khusus untuk group customer tertentu.
                </p>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <h4 className="text-sm font-medium text-indigo-900 mb-3">Tambah Nama Baru</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Group Customer</label>
                            <select
                                value={newGroupCustomerId}
                                onChange={(e) => setNewGroupCustomerId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">Pilih Group Customer</option>
                                {availableGroupCustomers.map((gc) => (
                                    <option key={gc.id} value={gc.id}>
                                        {gc.kode_group} - {gc.nama_group}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nama Barang</label>
                            <input
                                type="text"
                                value={newNamaBarang}
                                onChange={(e) => setNewNamaBarang(e.target.value)}
                                placeholder="Masukkan nama barang untuk group ini"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-3">
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setNewGroupCustomerId('');
                                setNewNamaBarang('');
                            }}
                            className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            )}

            {/* Names List */}
            {names.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Group Customer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Barang
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {names.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-indigo-600">
                                                    {item.groupCustomer?.kode_group?.substring(0, 2) || 'GC'}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {item.groupCustomer?.nama_group || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {item.groupCustomer?.kode_group || ''}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingId === item.id ? (
                                            <input
                                                type="text"
                                                value={editNamaBarang}
                                                onChange={(e) => setEditNamaBarang(e.target.value)}
                                                className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-900">{item.nama_barang}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                        {editingId === item.id ? (
                                            <div className="flex justify-end space-x-1">
                                                <button
                                                    onClick={() => handleEdit(item.id)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                                    title="Simpan"
                                                >
                                                    <CheckIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                                    title="Batal"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end space-x-1">
                                                <button
                                                    onClick={() => startEdit(item)}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.groupCustomer?.nama_group)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Belum ada nama khusus per group customer</p>
                    <p className="text-gray-400 text-xs mt-1">
                        Klik tombol "Tambah" untuk menambahkan nama khusus
                    </p>
                </div>
            )}
        </div>
    );
};

export default ItemNameGroupCustomerManager;
