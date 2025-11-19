import React, { useState, useRef, useEffect } from 'react';
import HeroIcon from '../atoms/HeroIcon';
import toastService from '@/services/toastService';

const ImageUpload = ({ logo, onLogoChange, onLogoRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(logo || null);
  const fileInputRef = useRef(null);

  // Update preview when logo prop changes
  useEffect(() => {
    setPreviewUrl(logo || null);
  }, [logo]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toastService.error('Only JPG, JPEG, and PNG files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toastService.error('File size must be less than 5MB');
      return;
    }

    // Convert to base64 and update
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPreviewUrl(base64String);
      onLogoChange(base64String);
      toastService.success('Logo loaded successfully');
      setUploading(false);
    };
    reader.onerror = () => {
      toastService.error('Failed to read file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    onLogoRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='space-y-2'>
      <label className='block text-sm font-medium text-gray-700 mb-1'>
        Company Logo
      </label>
      
      <div className='flex items-start space-x-4'>
        {/* Preview area */}
        <div className='flex-shrink-0'>
          {previewUrl ? (
            <div className='relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50'>
              <img
                src={previewUrl}
                alt='Company logo preview'
                className='w-full h-full object-contain'
              />
              {uploading && (
                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
                </div>
              )}
            </div>
          ) : (
            <div className='w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50'>
              <HeroIcon name='photo' className='w-12 h-12 text-gray-400' />
            </div>
          )}
        </div>

        {/* Upload controls */}
        <div className='flex-1 space-y-2'>
          <input
            ref={fileInputRef}
            type='file'
            accept='.jpg,.jpeg,.png'
            onChange={handleFileSelect}
            className='hidden'
          />
          
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={handleButtonClick}
              disabled={uploading}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <HeroIcon name='arrow-up-tray' className='w-4 h-4 mr-2' />
              {uploading ? 'Uploading...' : previewUrl ? 'Change Logo' : 'Upload Logo'}
            </button>

            {previewUrl && !uploading && (
              <button
                type='button'
                onClick={handleRemoveLogo}
                className='inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50'
              >
                <HeroIcon name='trash' className='w-4 h-4 mr-2' />
                Remove
              </button>
            )}
          </div>

          <p className='text-xs text-gray-500'>
            Accepted formats: JPG, JPEG, PNG (max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;

