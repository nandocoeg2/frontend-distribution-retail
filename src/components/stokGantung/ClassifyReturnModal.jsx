import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const ClassifyReturnModal = ({
    isOpen,
    onClose,
    movement,
    onConfirm,
    isLoading = false,
}) => {
    const totalQty = useMemo(() => {
        if (!movement) return 0;
        const items = Array.isArray(movement.items) ? movement.items : [];
        return items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
    }, [movement]);

    // Initial split parsed from movement or notes if already classified
    const [restockQty, setRestockQty] = useState(totalQty);
    const [rejectQty, setRejectQty] = useState(0);
    const [notes, setNotes] = useState('');
    const [mode, setMode] = useState('restock'); // 'restock' | 'reject' | 'split'

    useEffect(() => {
        if (!movement) return;
        const total = totalQty;

        // Parse existing split from notes if any
        const splitMatch = movement.notes?.match(/Restock:\s*(\d+),\s*Reject:\s*(\d+)/i);
        const restockMatch = movement.notes?.match(/\[RESTOCK\s*(\d+)\]/i);
        const rejectMatch = movement.notes?.match(/\[REJECT\s*(\d+)\]/i);

        if (splitMatch) {
            const r = parseInt(splitMatch[1], 10) || 0;
            const j = parseInt(splitMatch[2], 10) || 0;
            setRestockQty(r);
            setRejectQty(j);
            setMode('split');
        } else if (rejectMatch || movement.status === 'REJECTED') {
            setRestockQty(0);
            setRejectQty(total);
            setMode('reject');
        } else if (restockMatch || movement.status === 'COMPLETED') {
            setRestockQty(total);
            setRejectQty(0);
            setMode('restock');
        } else {
            setRestockQty(total);
            setRejectQty(0);
            setMode('restock');
        }

        // Clean user notes without tags
        const cleanNotes = (movement.notes || '')
            .replace(/\[SPLIT\][^\n|]*/g, '')
            .replace(/\[RESTOCK\s*\d*\]/g, '')
            .replace(/\[REJECT\s*\d*\]/g, '')
            .replace(/\|\s*/g, '')
            .trim();
        setNotes(cleanNotes);
    }, [movement, totalQty]);

    if (!isOpen || !movement) return null;

    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === 'restock') {
            setRestockQty(totalQty);
            setRejectQty(0);
        } else if (newMode === 'reject') {
            setRestockQty(0);
            setRejectQty(totalQty);
        } else if (newMode === 'split') {
            // Default split half or keep existing
            if (restockQty === totalQty || restockQty === 0) {
                const half = Math.floor(totalQty / 2);
                setRestockQty(half);
                setRejectQty(totalQty - half);
            }
        }
    };

    const handleRestockQtyChange = (e) => {
        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
        const boundedVal = Math.min(val, totalQty);
        setRestockQty(boundedVal);
        setRejectQty(totalQty - boundedVal);
        setMode('split');
    };

    const handleRejectQtyChange = (e) => {
        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
        const boundedVal = Math.min(val, totalQty);
        setRejectQty(boundedVal);
        setRestockQty(totalQty - boundedVal);
        setMode('split');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (restockQty + rejectQty !== totalQty) {
            return;
        }

        onConfirm({
            movementId: movement.id,
            action: restockQty === totalQty ? 'restock' : rejectQty === totalQty ? 'reject' : 'split',
            restockQuantity: restockQty,
            rejectQuantity: rejectQty,
            notes: notes.trim() || undefined,
        });
    };

    const poNumber = movement.poNumber || movement.purchaseOrder?.po_number || movement.no_po || '-';
    const customerName = movement.customerName || movement.customer?.namaCustomer || movement.purchaseOrder?.customer?.namaCustomer || '-';
    const items = Array.isArray(movement.items) ? movement.items : [];
    const productNames = items.map((i) => i.item?.nama_barang || i.inventory?.nama_barang || i.productName || '-').join(', ');

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            Update Status & Klasifikasi Return
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Pilih opsi restock, reject, atau split kuantitas return
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 rounded p-1 hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-4 text-xs">
                        {/* Info PO & Item */}
                        <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 space-y-1.5 text-gray-700">
                            <div className="flex justify-between">
                                <span className="text-gray-500">No. PO:</span>
                                <span className="font-semibold text-gray-900">{poNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Customer:</span>
                                <span className="font-medium text-gray-900">{customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Product:</span>
                                <span className="font-medium text-gray-900 text-right max-w-[280px] truncate" title={productNames}>
                                    {productNames}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-blue-200/60 pt-1.5 mt-1.5">
                                <span className="font-medium text-gray-600">Total Qty Return:</span>
                                <span className="font-bold text-blue-700 text-sm">{totalQty.toLocaleString('id-ID')} PCS</span>
                            </div>
                        </div>

                        {/* Mode Selector */}
                        <div className="space-y-1.5">
                            <label className="block font-medium text-gray-700">Opsi Klasifikasi Status</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleModeChange('restock')}
                                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
                                        mode === 'restock'
                                            ? 'border-green-600 bg-green-50 text-green-700 ring-2 ring-green-600 ring-opacity-20'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    Full Restock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleModeChange('reject')}
                                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
                                        mode === 'reject'
                                            ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-600 ring-opacity-20'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <XCircleIcon className="w-4 h-4 text-red-600" />
                                    Full Reject
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleModeChange('split')}
                                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
                                        mode === 'split'
                                            ? 'border-amber-600 bg-amber-50 text-amber-700 ring-2 ring-amber-600 ring-opacity-20'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <ArrowsRightLeftIcon className="w-4 h-4 text-amber-600" />
                                    Split Qty
                                </button>
                            </div>
                        </div>

                        {/* Qty Input Area */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <label className="block text-[11px] font-semibold text-green-700 mb-1">
                                    Qty Restock (Masuk Stok)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max={totalQty}
                                        value={restockQty}
                                        onChange={handleRestockQtyChange}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 font-medium text-gray-900"
                                    />
                                    <span className="absolute right-2.5 top-1.5 text-gray-400 text-[10px]">PCS</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-red-700 mb-1">
                                    Qty Reject (Ditolak)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max={totalQty}
                                        value={rejectQty}
                                        onChange={handleRejectQtyChange}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 font-medium text-gray-900"
                                    />
                                    <span className="absolute right-2.5 top-1.5 text-gray-400 text-[10px]">PCS</span>
                                </div>
                            </div>
                        </div>

                        {/* Stock In notice */}
                        {restockQty > 0 && (
                            <div className="flex items-start gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-[11px]">
                                <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold">Otomatis Masuk ke Stock In:</span> Sebanyak{' '}
                                    <span className="font-bold">{restockQty.toLocaleString('id-ID')} PCS</span> akan otomatis dibuatkan catatan di menu <strong>Stock In</strong> dengan Supplier <strong>&quot;RETURN&quot;</strong>.
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Catatan / Keterangan (Opsional)</label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: 50 pcs reject karena kemasan sobek"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-3 py-1.5 rounded border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || restockQty + rejectQty !== totalQty}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClassifyReturnModal;
