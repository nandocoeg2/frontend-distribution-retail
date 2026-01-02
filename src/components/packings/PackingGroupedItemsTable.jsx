import React, { useMemo } from 'react';

const PackingGroupedItemsTable = ({ packingBoxes }) => {
    const groupedItems = useMemo(() => {
        if (!packingBoxes || packingBoxes.length === 0) return [];

        const groups = {};

        packingBoxes.forEach((box) => {
            // Robustly parse box number: extract first sequence of digits
            const boxNumMatch = String(box.no_box).match(/\d+/);
            const boxNum = boxNumMatch ? parseInt(boxNumMatch[0], 10) : null;

            if (box.packingBoxItems) {
                box.packingBoxItems.forEach((boxItem) => {
                    // Group strictly by itemId to show 1 row per item as requested
                    const key = boxItem.itemId;

                    if (!groups[key]) {
                        groups[key] = {
                            itemId: boxItem.itemId,
                            nama_barang: boxItem.nama_barang || boxItem.item?.nama_barang,
                            plu: boxItem.item?.plu || '-',
                            satuan: boxItem.item?.uom || 'PCS',
                            keterangan: boxItem.keterangan || '-',
                            qtyPerBoxValues: [],
                            totalQty: 0,
                            boxes: [],
                        };
                    }

                    groups[key].qtyPerBoxValues.push(boxItem.quantity);
                    groups[key].totalQty += boxItem.quantity;

                    if (boxNum !== null) {
                        groups[key].boxes.push(boxNum);
                    }
                });
            }
        });

        // Process each group
        return Object.values(groups).map((group) => {
            group.boxes.sort((a, b) => a - b);
            // Dedup boxes
            group.boxes = [...new Set(group.boxes)];

            const minBox = group.boxes.length > 0 ? group.boxes[0] : '-';
            const maxBox = group.boxes.length > 0 ? group.boxes[group.boxes.length - 1] : '-';

            // Calculate Mode Qty
            const qtyCounts = {};
            let maxCount = 0;
            let modeQty = 0;
            group.qtyPerBoxValues.forEach(q => {
                qtyCounts[q] = (qtyCounts[q] || 0) + 1;
                if (qtyCounts[q] > maxCount) {
                    maxCount = qtyCounts[q];
                    modeQty = q;
                }
            });

            // Build totalBoxString range
            const ranges = [];
            if (group.boxes.length > 0) {
                let start = group.boxes[0];
                let end = group.boxes[0];

                for (let i = 1; i < group.boxes.length; i++) {
                    if (group.boxes[i] === end + 1) {
                        end = group.boxes[i];
                    } else {
                        ranges.push(start === end ? `${start}` : `${start}-${end}`);
                        start = group.boxes[i];
                        end = group.boxes[i];
                    }
                }
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
            }

            const totalBoxString = ranges.length > 0 ? ranges.join(', ') : '-';

            return {
                ...group,
                minBox,
                maxBox,
                qtyPerBox: modeQty,
                totalBoxString,
                totalBoxCount: group.boxes.length || 0
            };
        }).sort((a, b) => {
            const aBox = typeof a.minBox === 'number' ? a.minBox : 999999;
            const bBox = typeof b.minBox === 'number' ? b.minBox : 999999;
            return aBox - bBox;
        });
    }, [packingBoxes]);

    if (!packingBoxes || packingBoxes.length === 0) {
        return <div className="text-center py-4 text-xs text-gray-500">Tidak ada items.</div>;
    }

    return (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">No</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Nama Barang</th>
                        <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">PLU</th>
                        <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Jumlah</th>
                        <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Satuan</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Keterangan</th>
                        <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Qty per Box</th>
                        <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Nomor Box Dari</th>
                        <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Nomor Box Sampai</th>
                        <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Box</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {groupedItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 border-r text-center">{index + 1}.</td>
                            <td className="px-3 py-2 whitespace-normal text-xs font-medium text-gray-900 border-r">{item.nama_barang}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-500 border-r">{item.plu}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-900 border-r font-bold">{item.totalQty.toLocaleString()}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-500 border-r">{item.satuan}</td>
                            <td className="px-3 py-2 whitespace-normal text-xs text-gray-500 border-r">{item.keterangan || '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-900 border-r">{item.qtyPerBox}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-500 border-r">{item.minBox}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-500 border-r">{item.maxBox}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-900 font-medium">{item.totalBoxString}</td>
                        </tr>
                    ))}
                    {/* Summary Row */}
                    {groupedItems.length > 0 && (
                        <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                            <td colSpan={3} className="px-3 py-2 text-xs text-right text-gray-700 border-r">Grand Total</td>
                            <td className="px-3 py-2 text-xs text-center text-gray-900 border-r">
                                {groupedItems.reduce((acc, curr) => acc + curr.totalQty, 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 border-r"></td>
                            <td className="px-3 py-2 border-r"></td>
                            <td className="px-3 py-2 border-r"></td>
                            <td className="px-3 py-2 border-r"></td>
                            <td className="px-3 py-2 border-r"></td>
                            <td className="px-3 py-2 text-xs text-center text-gray-900">
                                {(() => {
                                    const allBoxes = new Set();
                                    packingBoxes.forEach(b => {
                                        const m = String(b.no_box).match(/\d+/);
                                        if (m) allBoxes.add(m[0]);
                                    });
                                    return allBoxes.size;
                                })()} Boxes
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PackingGroupedItemsTable;
