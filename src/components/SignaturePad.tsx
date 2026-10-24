import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  signeeName?: string;
  initialSignature?: string;
  onSave: (dataUrl: string) => void;
  required?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  signeeName,
  initialSignature,
  onSave,
  required = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | null>(initialSignature || null);
  const [isEditing, setIsEditing] = useState(!initialSignature);

  useEffect(() => {
    if (initialSignature) {
      setCurrentSignature(initialSignature);
      setIsEditing(false);
    }
  }, [initialSignature]);

  // Setup canvas high-DPI
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0F2942'; // Dark Navy ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (isEditing) {
      setupCanvas();
      window.addEventListener('resize', setupCanvas);
      return () => window.removeEventListener('resize', setupCanvas);
    }
  }, [isEditing]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const dataUrl = canvas.toDataURL('image/png');
    setCurrentSignature(dataUrl);
    setIsEditing(false);
    onSave(dataUrl);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-teal-600" />
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {signeeName && (
          <span className="text-xs text-slate-500 font-medium">{signeeName}</span>
        )}
      </div>

      {currentSignature && !isEditing ? (
        <div className="relative border border-slate-200 rounded-lg bg-slate-50 p-2 flex flex-col items-center justify-center">
          <img
            src={currentSignature}
            alt={label}
            className="h-24 max-w-full object-contain"
          />
          <div className="w-full border-t border-dashed border-slate-300 mt-1 pt-1 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Tanda Tangan Tersimpan ({signeeName || 'Digital Signature'})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setHasDrawn(false);
            }}
            className="mt-2 text-xs text-teal-700 hover:text-teal-800 font-medium underline"
          >
            Ubah Tanda Tangan
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/70 overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-28 cursor-crosshair block"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                Goreskan tanda tangan di sini (Sentuh / Mouse)
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Bersihkan
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasDrawn}
              className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                hasDrawn
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Kunci Tanda Tangan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
