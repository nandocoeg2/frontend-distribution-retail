import React, { useState, useMemo } from 'react';
import {
  ClockIcon,
  ListBulletIcon,
  TruckIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { resolveStatusVariant } from '../../utils/modalUtils';
import { StatusBadge, InfoTable, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import { formatDateTime, formatDate } from '../../utils/formatUtils';
import ActivityTimeline from '../common/ActivityTimeline';
import suratJalanService from '../../services/suratJalanService';
import toastService from '../../services/toastService';
import { getPackingBoxes, getTotals } from '../../utils/suratJalanHelpers';
import SuratJalanForm from './SuratJalanForm';
import SuratJalanDetailsTable from './SuratJalanDetailsTable';

const SuratJalanDetailCard = ({ suratJalan, onClose, loading = false, onUpdate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  if (!suratJalan) return null;

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);

      const submitData = {
        no_surat_jalan: formData.no_surat_jalan,
        deliver_to: formData.deliver_to,
        PIC: formData.PIC,
        alamat_tujuan: formData.alamat_tujuan,
        invoiceId: formData.invoiceId || null,
      };

      const result = await suratJalanService.updateSuratJalan(suratJalan.id, submitData);

      if (result.success) {
        toastService.success('Surat jalan updated successfully');
        setIsEditMode(false);
        if (onUpdate) {
          onUpdate(result.data);
        }
      } else {
        throw new Error(result.message || 'Failed to update surat jalan');
      }
    } catch (err) {
      console.error('Error updating surat jalan:', err);
      toastService.error(err.message || 'Failed to update surat jalan');
    } finally {
      setSaving(false);
    }
  };

  const rawAuditTrailData = suratJalan?.auditTrails;
  const normalizedAuditTrails = useMemo(() => {
    const raw = Array.isArray(rawAuditTrailData)
      ? rawAuditTrailData
      : rawAuditTrailData
        ? [rawAuditTrailData]
        : [];

    return raw.map((trail) => {
      const timestampSource =
        trail?.timestamp ||
        trail?.createdAt ||
        trail?.updatedAt ||
        trail?.created_at ||
        trail?.updated_at;
      let timestamp = null;

      if (timestampSource) {
        const parsed = new Date(timestampSource);
        if (!Number.isNaN(parsed.getTime())) {
          timestamp = parsed.toISOString();
        }
      }

      return {
        ...trail,
        timestamp,
        tableName: trail?.tableName || trail?.entityType || 'Surat Jalan',
      };
    });
  }, [rawAuditTrailData]);

  const packingBoxes = useMemo(() => getPackingBoxes(suratJalan), [suratJalan]);

  return (
    <div className='bg-white shadow rounded-lg p-3 mt-3'>
      <div className='flex justify-between items-center mb-2'>
        <div className='flex items-center gap-2'>
          <div className='p-1.5 bg-teal-100 rounded'>
            <TruckIcon className='w-4 h-4 text-teal-600' />
          </div>
          <div>
            <h2 className='text-sm font-bold text-gray-900'>Surat Jalan</h2>
            <p className='text-xs text-gray-600'>{suratJalan.no_surat_jalan}</p>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          {!isEditMode ? (
            <>
              <button onClick={handleEditClick} className='inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50'>
                <PencilIcon className='w-3 h-3 mr-1' />Edit
              </button>
              {onClose && (
                <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded' title='Close'>
                  <XMarkIcon className='w-4 h-4 text-gray-500' />
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={handleCancelEdit} disabled={saving} className='px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50'>Cancel</button>
              <button form='surat-jalan-form' type='submit' disabled={saving} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50'>
                <CheckIcon className='w-3 h-3 mr-1' />{saving ? '...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-4'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-xs text-gray-600'>Loading...</span>
        </div>
      ) : isEditMode ? (
        <div className='bg-gray-50 rounded p-3'>
          <SuratJalanForm
            suratJalan={suratJalan}
            onSubmit={handleSave}
            onCancel={handleCancelEdit}
            isSubmitting={saving}
            formId="surat-jalan-form"
          />
        </div>
      ) : (
        <div>
          <TabContainer activeTab={activeTab} onTabChange={setActiveTab} variant='underline' className='mb-2'>
            <Tab id='details' label='Boxes' icon={<ListBulletIcon className='w-3 h-3' />} badge={packingBoxes.length} />
            <Tab id='activity' label='Activity' icon={<ClockIcon className='w-3 h-3' />} badge={normalizedAuditTrails.length || null} />
          </TabContainer>

          <TabContent activeTab={activeTab}>
            <TabPanel tabId='details'>
              <div className='overflow-hidden bg-white border border-gray-200 rounded'>
                <SuratJalanDetailsTable packingBoxes={packingBoxes} />
              </div>
            </TabPanel>

            <TabPanel tabId='activity'>
              <ActivityTimeline auditTrails={normalizedAuditTrails} title='Timeline' emptyMessage='Belum ada audit trail.' formatDate={formatDate} />
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default SuratJalanDetailCard;
