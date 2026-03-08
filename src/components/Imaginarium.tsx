import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCcw, 
  Download, 
  Eraser, 
  Pencil, 
  Trash2, 
  Undo2,
  Palette,
  Minus,
  Plus
} from 'lucide-react';

interface ImaginariumProps {
  onClose: () => void;
  lang: string;
}

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#8B4513'
];

const Imaginarium: React.FC<ImaginariumProps> = ({ onClose, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory(prev => [...prev, canvas.toDataURL()]);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      saveToHistory();
    }
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      saveToHistory();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);

    if (newHistory.length === 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const img = new Image();
      img.src = newHistory[newHistory.length - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `imaginarium-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const t = {
    title: lang === 'ko' ? '이매지나리움' : 'Imaginarium',
    subtitle: lang === 'ko' ? '자유롭게 상상을 그려보세요' : 'Draw your imagination freely',
    clear: lang === 'ko' ? '전체 삭제' : 'Clear All',
    undo: lang === 'ko' ? '되돌리기' : 'Undo',
    save: lang === 'ko' ? '저장하기' : 'Save',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Palette className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg leading-none">{t.title}</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-1">{t.subtitle}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="text-white w-6 h-6" />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-white overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-900 p-4 pb-8 space-y-4">
        {/* Color Palette */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool('pencil');
              }}
              className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-transform ${
                color === c && tool === 'pencil' ? 'scale-125 border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl">
            <button
              onClick={() => setTool('pencil')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                tool === 'pencil' ? 'bg-purple-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Pencil className="w-6 h-6" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                tool === 'eraser' ? 'bg-purple-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eraser className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center gap-4 bg-white/5 p-1 rounded-2xl h-14">
            <button 
              onClick={() => setBrushSize(Math.max(1, brushSize - 2))}
              className="text-zinc-400 hover:text-white"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <div 
                className="bg-white rounded-full" 
                style={{ width: brushSize, height: brushSize }}
              />
              <span className="text-[10px] text-zinc-500 mt-1 font-mono">{brushSize}px</span>
            </div>
            <button 
              onClick={() => setBrushSize(Math.min(50, brushSize + 2))}
              className="text-zinc-400 hover:text-white"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30"
            >
              <Undo2 className="w-6 h-6" />
            </button>
            <button
              onClick={clearCanvas}
              className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20"
            >
              <Trash2 className="w-6 h-6" />
            </button>
            <button
              onClick={download}
              className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600"
            >
              <Download className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Imaginarium;
