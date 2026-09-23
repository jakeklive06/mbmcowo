import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Upload, AlertCircle } from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'file'
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (scanMode === 'camera') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode]);

  const extractCode = (decodedText) => {
    // If it's a URL like http://localhost:5000/scan/MBMC-AST-0001
    const match = decodedText.match(/\/scan\/([A-Za-z0-9-_]+)/);
    if (match) return match[1];
    return decodedText.trim();
  };

  const startCamera = async () => {
    setError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const code = extractCode(decodedText);
          stopCamera();
          onScanSuccess(code);
        },
        () => {
          // ignore scan frame misses
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.warn('Camera error:', err);
      setError('Camera access unavailable or permission denied. You can upload an image file instead.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        // ignore
      }
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setError(null);
    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      const code = extractCode(decodedText);
      onScanSuccess(code);
    } catch (err) {
      setError('Could not decode QR code from the uploaded image. Please try a clearer image.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Scan Asset QR Code</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn ${scanMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => setScanMode('camera')}
          >
            <Camera size={16} /> Live Camera
          </button>
          <button
            className={`btn ${scanMode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => {
              stopCamera();
              setScanMode('file');
            }}
          >
            <Upload size={16} /> Upload Image
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {scanMode === 'camera' ? (
          <div
            id={scannerContainerId}
            style={{
              width: '100%',
              minHeight: '260px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#090d16',
              border: '1px solid #334155',
            }}
          />
        ) : (
          <div
            style={{
              border: '2px dashed #334155',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              background: '#090d16',
            }}
          >
            <Upload size={36} color="#38bdf8" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
              Choose or drag a photo of the QR code
            </p>
            <input
              type="file"
              accept="image/*"
              id="qr-file-input"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label htmlFor="qr-file-input" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Select QR Image
            </label>
            <div id="file-scanner-temp" style={{ display: 'none' }}></div>
          </div>
        )}

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          Point camera at the MBMC sticker attached to the furniture/item
        </div>
      </div>
    </div>
  );
}
