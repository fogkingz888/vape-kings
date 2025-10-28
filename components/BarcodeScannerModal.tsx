import React, { useRef, useEffect, useState } from 'react';

type BarcodeScannerModalProps = {
  onScan: (barcode: string) => void;
  onClose: () => void;
};

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: number | null = null;

    const startScanner = async () => {
      if (!('BarcodeDetector' in window)) {
        setError('Barcode Detector API is not supported in this browser.');
        return;
      }
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code'] });
        
        intervalId = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.paused || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              onScan(barcodes[0].rawValue);
            }
          } catch (e) {
            console.error('Barcode detection failed:', e);
          }
        }, 500);

      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                 setError('Camera access was denied. Please allow camera permissions in your browser settings.');
            } else {
                setError('Could not access the camera. Please check permissions and ensure no other app is using it.');
            }
        } else {
             setError('An unknown error occurred while accessing the camera.');
        }
      }
    };

    startScanner();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-hiphop-900 rounded-sm shadow-xl p-6 w-full max-w-lg transform transition-all border-2 border-hiphop-700 relative">
        <h3 className="text-2xl font-marker text-hiphop-light mb-4">Scan Barcode</h3>
        {error ? (
          <div className="bg-red-900 bg-opacity-50 text-red-300 p-4 rounded-sm text-center">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="relative w-full aspect-video bg-hiphop-950 rounded overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline></video>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-1/2 border-4 border-hiphop-cyan rounded opacity-75 animate-pulse"></div>
            </div>
            <p className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 p-1 rounded">Point camera at a barcode</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-hiphop-800 hover:bg-hiphop-700 text-hiphop-light font-bold py-3 px-4 rounded-sm uppercase tracking-wider"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
