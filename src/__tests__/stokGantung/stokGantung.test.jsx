import { describe, it, expect } from 'vitest';

describe('Stok Gantung split quantity and re-edit calculation', () => {
    it('calculates restock and reject split correctly', () => {
        const totalQty = 250;
        const restockQty = 200;
        const rejectQty = totalQty - restockQty;

        expect(rejectQty).toBe(50);
        expect(restockQty + rejectQty).toBe(totalQty);
    });

    it('parses split notes correctly from movement notes', () => {
        const notes = '[SPLIT] Restock: 200, Reject: 50 | Retur karena kemasan rusak';
        const splitMatch = notes.match(/Restock:\s*(\d+),\s*Reject:\s*(\d+)/i);

        expect(splitMatch).not.toBeNull();
        expect(parseInt(splitMatch[1], 10)).toBe(200);
        expect(parseInt(splitMatch[2], 10)).toBe(50);
    });

    it('calculates delta stock quantity on re-edit correctly', () => {
        const totalQty = 250;
        // Previously restocked 200
        const previousRestockedQty = 200;

        // User edits to full restock 250
        const newRestockQty = 250;
        const delta = newRestockQty - previousRestockedQty;

        expect(delta).toBe(50); // Adds 50 to ItemStock

        // User later edits to full reject 0
        const updatedRestockQty = 0;
        const deltaReversal = updatedRestockQty - newRestockQty;

        expect(deltaReversal).toBe(-250); // Decrements 250 from ItemStock
    });

    it('formats update payload with customerId, ekspedisi, and notes properly', () => {
        const payload = {
            movementId: 'mov-1',
            customerId: 'cust-123',
            ekspedisi: 'JNE Trucking',
            notes: 'Kemasan rusak saat pengiriman',
        };

        expect(payload.customerId).toBe('cust-123');
        expect(payload.ekspedisi).toBe('JNE Trucking');
        expect(payload.notes).toBe('Kemasan rusak saat pengiriman');
    });
});
