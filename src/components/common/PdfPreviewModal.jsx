import React, { useState, useCallback, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Modal component for HTML/PDF preview with print and download capabilities
 * Uses HTML content in iframe for preview, generates PDF only for download
 */
const PdfPreviewModal = ({
    isOpen,
    onClose,
    htmlContent,
    title = 'Preview',
    fileName = 'document.pdf',
}) => {
    const iframeRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    // Write HTML content to iframe when it loads
    useEffect(() => {
        if (isOpen && htmlContent && iframeRef.current) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(htmlContent);
                doc.close();

                // Inject CSS to remove scrollbar and add page break styling
                const style = doc.createElement('style');
                style.textContent = `
                    html, body {
                        overflow: hidden !important;
                        margin: 0 !important;
                    }
                    /* Page break visual styling */
                    @media screen {
                        .page-break, [style*="page-break"] {
                            border-top: 3px dashed #0066cc !important;
                            margin: 20px 0 !important;
                            padding-top: 20px !important;
                            position: relative !important;
                        }
                        .page-break::before, [style*="page-break"]::before {
                            content: "— Halaman Baru —" !important;
                            position: absolute !important;
                            top: -12px !important;
                            left: 50% !important;
                            transform: translateX(-50%) !important;
                            background: #0066cc !important;
                            color: white !important;
                            padding: 2px 12px !important;
                            font-size: 11px !important;
                            border-radius: 4px !important;
                        }
                    }
                `;
                doc.head.appendChild(style);

                // Wait for content/images to load then resize iframe
                setTimeout(() => {
                    try {
                        if (doc.body) {
                            const height = Math.max(
                                doc.body.scrollHeight,
                                doc.documentElement.scrollHeight,
                                500
                            );
                            const width = Math.max(
                                doc.body.scrollWidth,
                                doc.documentElement.scrollWidth,
                                794 // 210mm in pixels approx
                            );
                            iframe.style.height = height + 'px';
                            iframe.style.width = width + 'px';
                        }
                    } catch (err) {
                        console.warn('Could not resize iframe:', err);
                    }
                }, 300);
            }
        }
    }, [isOpen, htmlContent]);

    const handlePrint = useCallback(() => {
        if (iframeRef.current) {
            const iframe = iframeRef.current;
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }
    }, []);

    const handleDownload = useCallback(async () => {
        if (!htmlContent) return;

        setDownloading(true);
        try {
            // Create a hidden container for rendering
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '-9999px';
            container.style.width = '210mm'; // A4 width
            container.style.backgroundColor = 'white';
            container.innerHTML = htmlContent;
            document.body.appendChild(container);

            // Wait for images to load
            const images = container.querySelectorAll('img');
            await Promise.all(
                Array.from(images).map(
                    (img) =>
                        new Promise((resolve) => {
                            if (img.complete) {
                                resolve();
                            } else {
                                img.onload = resolve;
                                img.onerror = resolve;
                            }
                        })
                )
            );

            // Small delay to ensure styles are applied
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Generate canvas from HTML
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
            });

            // Remove the container
            document.body.removeChild(container);

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;

            // Calculate dimensions to fit content
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Handle multi-page if content is taller than page
            let heightLeft = imgHeight;
            let position = margin;
            let pageCount = 0;

            while (heightLeft > 0) {
                if (pageCount > 0) {
                    pdf.addPage();
                }

                pdf.addImage(
                    imgData,
                    'PNG',
                    margin,
                    position - pageCount * (pageHeight - margin * 2),
                    imgWidth,
                    imgHeight
                );

                heightLeft -= pageHeight - margin * 2;
                pageCount++;
            }

            // Download the PDF
            pdf.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal membuat PDF: ' + error.message);
        } finally {
            setDownloading(false);
        }
    }, [htmlContent, fileName]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative flex flex-col h-full max-h-screen">
                {/* Header */}
                <div className="bg-white shadow-md px-4 py-3 flex items-center justify-between z-10">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {title}
                    </h2>

                    {/* Controls */}
                    <div className="flex items-center space-x-2">
                        {/* Action Buttons */}
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            title="Download PDF"
                        >
                            {downloading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4 mr-1.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    Download
                                </>
                            )}
                        </button>

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
                            title="Print"
                        >
                            <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            Print
                        </button>

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded hover:bg-gray-100 ml-2"
                            title="Close"
                        >
                            <svg
                                className="w-6 h-6 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* HTML Preview using iframe - paper-like appearance with outer scroll */}
                <div className="flex-1 bg-gray-300 overflow-auto p-6">
                    <div
                        className="bg-white shadow-2xl mx-auto"
                        style={{
                            minWidth: '210mm',
                            width: 'fit-content',
                            maxWidth: 'none'
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            className="w-full border-0"
                            style={{
                                minHeight: '500px',
                                minWidth: '210mm',
                                width: 'fit-content'
                            }}
                            title="Document Preview"
                            onLoad={(e) => {
                                // Auto-resize iframe to fit content
                                try {
                                    const iframe = e.target;
                                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                                    if (doc && doc.body) {
                                        const height = Math.max(
                                            doc.body.scrollHeight,
                                            doc.documentElement.scrollHeight,
                                            500
                                        );
                                        const width = Math.max(
                                            doc.body.scrollWidth,
                                            doc.documentElement.scrollWidth,
                                            794 // 210mm in pixels
                                        );
                                        iframe.style.height = height + 'px';
                                        iframe.style.width = width + 'px';
                                    }
                                } catch (err) {
                                    console.warn('Could not resize iframe:', err);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfPreviewModal;
