// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ViewCustomerModal from '../../components/customers/ViewCustomerModal';
import CustomerForm from '../../components/customers/CustomerForm';
import customerService from '@/services/customerService';
import { groupCustomerService } from '@/services/groupCustomerService';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Mock customerService using alias path
vi.mock('@/services/customerService', () => ({
  default: {
    getById: vi.fn(),
  },
}));

// Mock groupCustomerService using alias path
vi.mock('@/services/groupCustomerService', () => {
  const service = {
    getGroupCustomerById: vi.fn(),
    getAllGroupCustomers: vi.fn(),
  };
  return {
    default: service,
    groupCustomerService: service,
  };
});

vi.mock('@/services/toastService', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => {
  const MockIcon = (props) => <span {...props} />;
  return {
    ClipboardDocumentIcon: MockIcon,
    XMarkIcon: MockIcon,
    BuildingStorefrontIcon: MockIcon,
    MapPinIcon: MockIcon,
    DevicePhoneMobileIcon: MockIcon,
    AtSymbolIcon: MockIcon,
    IdentificationIcon: MockIcon,
    CalendarDaysIcon: MockIcon,
    UserGroupIcon: MockIcon,
    EyeIcon: MockIcon,
    UserCircleIcon: MockIcon,
    PlusIcon: MockIcon,
    TrashIcon: MockIcon,
    UserIcon: MockIcon,
  };
});

// Mock Autocomplete for easier unit testing
vi.mock('../../components/common/Autocomplete', () => {
  return {
    default: ({ label, value, onChange, options, name }) => (
      <div data-testid="autocomplete-mock">
        <label>{label}</label>
        <select
          data-testid="autocomplete-select"
          name={name}
          value={value || ''}
          onChange={(e) => onChange({ target: { name, value: e.target.value } })}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.nama_group}
            </option>
          ))}
        </select>
      </div>
    ),
  };
});

describe('NPWP Derivation and Display Integration Tests (Commit 784d2eb)', () => {
  describe('ViewCustomerModal Tax NPWP derivation logic', () => {
    it('should derive NPWP from groupCustomer if available', async () => {
      const mockCustomer = {
        id: 'cust-1',
        namaCustomer: 'Toko Budi',
        NPWP: '1234567890123456', // old fallback
        groupCustomer: {
          id: 'group-1',
          nama_group: 'Group A',
        },
      };

      const mockGroupDetails = {
        id: 'group-1',
        nama_group: 'Group A',
        npwp: '9999999999999999', // derived source
      };

      customerService.getById.mockResolvedValue({ success: true, data: mockCustomer });
      groupCustomerService.getGroupCustomerById.mockResolvedValue({ success: true, data: mockGroupDetails });

      render(<ViewCustomerModal show={true} onClose={vi.fn()} customer={mockCustomer} />);

      // Find the NPWP values on screen. We should find '9999999999999999' instead of '1234567890123456'.
      const elements = await screen.findAllByText('9999999999999999');
      expect(elements.length).toBeGreaterThan(0);

      expect(customerService.getById).toHaveBeenCalledWith('cust-1');
      expect(groupCustomerService.getGroupCustomerById).toHaveBeenCalledWith('group-1');
    });

    it('should fall back to fullCustomer.groupCustomer.npwp if groupCustomer service detail is not yet fetched', async () => {
      const mockCustomer = {
        id: 'cust-1',
        namaCustomer: 'Toko Budi',
        groupCustomer: {
          id: 'group-1',
          nama_group: 'Group A',
          npwp: '8888888888888888', // nested in groupCustomer relation
        },
      };

      customerService.getById.mockResolvedValue({ success: true, data: mockCustomer });
      // groupCustomerService call fails
      groupCustomerService.getGroupCustomerById.mockRejectedValue(new Error('Fetch failed'));

      render(<ViewCustomerModal show={true} onClose={vi.fn()} customer={mockCustomer} />);

      const elements = await screen.findAllByText('8888888888888888');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should fall back to customer.NPWP if no groupCustomer relation exists', async () => {
      const mockCustomer = {
        id: 'cust-1',
        namaCustomer: 'Toko Budi',
        NPWP: '7777777777777777',
      };

      customerService.getById.mockResolvedValue({ success: true, data: mockCustomer });

      render(<ViewCustomerModal show={true} onClose={vi.fn()} customer={mockCustomer} />);

      const elements = await screen.findAllByText('7777777777777777');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('CustomerForm NPWP autofill logic', () => {
    it('should have NPWP and NPWP Address inputs and autofill them from selected Group Customer', async () => {
      const mockGroupCustomers = [
        { id: 'g-1', nama_group: 'Group One', npwp: '1111111111111111', alamat: 'Alamat Group One' },
        { id: 'g-2', nama_group: 'Group Two', npwp: '2222222222222222', alamat: 'Alamat Group Two' },
      ];

      groupCustomerService.getAllGroupCustomers.mockResolvedValue({
        success: true,
        data: { data: mockGroupCustomers },
      });

      const { container } = render(
        <CustomerForm onSubmit={vi.fn()} onClose={vi.fn()} />
      );

      // Wait for the group customers to be fetched and loaded
      await screen.findByText('Group Customer');

      // Assert that manual NPWP and NPWP Address text inputs exist
      const npwpInput = container.querySelector('input[name="NPWP"]');
      const npwpAddressInput = container.querySelector('input[name="alamatNPWP"]');
      
      expect(npwpInput).toBeTruthy();
      expect(npwpAddressInput).toBeTruthy();

      // Initially, they should be empty
      expect(npwpInput.value).toBe('');
      expect(npwpAddressInput.value).toBe('');

      // Simulate selecting "Group One" using fireEvent.change
      const select = screen.getByTestId('autocomplete-select');
      fireEvent.change(select, { target: { value: 'g-1' } });

      // Now NPWP and NPWP Address inputs should be autofilled with Group One values
      expect(npwpInput.value).toBe('1111111111111111');
      expect(npwpAddressInput.value).toBe('Alamat Group One');
    });
  });
});
