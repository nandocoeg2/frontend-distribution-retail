import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const PdfCanvasViewer = ({ fileUrl, blob, filename }) => {
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.2);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTasksRef = useRef([]);

  // Load the PDF document
  useEffect(() => {
    let isCancelled = false;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      pdfDocRef.current = null;

      try {
        let loadingTask;
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else if (fileUrl) {
          loadingTask = pdfjsLib.getDocument(fileUrl);
        } else {
          throw new Error('Tidak ada file PDF yang diberikan');
        }

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        if (isCancelled) return;
        console.error('Error loading PDF with pdfjs-dist:', err);
        setError(err.message || 'Gagal memuat dokumen PDF');
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl, blob]);

  // Render all pages onto canvas elements
  const renderPages = useCallback(async () => {
    if (!pdfDocRef.current || !containerRef.current) return;

    // Cancel any ongoing renders
    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch (_) {}
    });
    renderTasksRef.current = [];

    const container = containerRef.current;
    container.innerHTML = '';

    const pdf = pdfDocRef.current;
    const dpr = window.devicePixelRatio || 1;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Container for each page (shadowed page effect)
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'mb-6 relative shadow-lg rounded bg-white overflow-hidden flex flex-col items-center';
        pageWrapper.style.maxWidth = '100%';

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.style.display = 'block';

        context.scale(dpr, dpr);

        pageWrapper.appendChild(canvas);

        // Page number badge
        const badge = document.createElement('div');
        badge.className = 'py-1 text-[11px] text-gray-500 bg-gray-50 w-full text-center border-t border-gray-100 font-mono';
        badge.textContent = `Halaman ${pageNum} dari ${pdf.numPages}`;
        pageWrapper.appendChild(badge);

        container.appendChild(pageWrapper);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current.push(renderTask);
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }
    }
  }, [scale]);

  useEffect(() => {
    if (!loading && !error && numPages > 0) {
      renderPages();
    }
  }, [loading, error, numPages, renderPages]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.2);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden relative">
      {/* Zoom / View Toolbar */}
      {!loading && !error && numPages > 0 && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-1.5 flex items-center justify-center space-x-3 text-white z-10 shadow-sm flex-shrink-0">
          <span className="text-xs text-slate-400">
            Total <span className="font-semibold text-white">{numPages}</span> Halaman
          </span>
          <div className="h-3.5 w-px bg-slate-600" />
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Perkecil (Zoom Out)"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-0.5 text-xs rounded hover:bg-slate-700 text-slate-200 font-mono"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Perbesar (Zoom In)"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 w-full h-full overflow-y-auto p-4 flex flex-col items-center justify-start">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-300 space-y-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-purple-400" />
            <p className="text-sm font-medium">Memuat dokumen PDF...</p>
          </div>
        )}

        {error && (
          <div className="text-center text-slate-300 p-8 bg-slate-800 rounded-lg border border-red-500/30 max-w-md my-auto">
            <p className="font-semibold text-red-400 mb-2">Gagal Menampilkan Dokumen</p>
            <p className="text-xs text-slate-400 mb-4">{error}</p>
            {fileUrl && (
              <a
                href={fileUrl}
                download={filename || 'document.pdf'}
                className="inline-flex items-center px-4 py-2 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Download File PDF
              </a>
            )}
          </div>
        )}

        <div
          ref={containerRef}
          className={`flex flex-col items-center w-full ${loading || error ? 'hidden' : 'block'}`}
        />
      </div>
    </div>
  );
};

export default PdfCanvasViewer;
