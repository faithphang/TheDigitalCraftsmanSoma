import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Layers, 
  Sliders, 
  Wand2, 
  Crop, 
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Move,
  Square,
  Circle,
  Lasso,
  Droplet,
  Eraser,
  Paintbrush,
  Blend,
  Sparkles,
  Sun,
  Moon,
  Contrast,
  Palette,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
  Undo,
  Redo,
  Download,
  X,
  ArrowLeft,
  FolderOpen,
  FolderClosed,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Scissors
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
  type: 'image' | 'adjustment' | 'group';
  imageData?: ImageData;
  adjustments?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
    temperature?: number;
    tint?: number;
    exposure?: number;
    highlights?: number;
    shadows?: number;
    whites?: number;
    blacks?: number;
    vibrance?: number;
    blur?: number;
    sharpen?: number;
    noise?: number;
  };
  overlayEffects?: {
    colorOverlay?: { enabled: boolean; color: string; opacity: number };
    gradientOverlay?: { enabled: boolean; type: 'linear' | 'radial'; colors: string[]; angle: number; opacity: number };
    patternOverlay?: { enabled: boolean; pattern: 'dots' | 'lines' | 'grid' | 'checkerboard'; scale: number; opacity: number };
    vignette?: { enabled: boolean; intensity: number; size: number };
    grain?: { enabled: boolean; intensity: number; size: number };
  };
  groupId?: string; // ID of parent group if this layer is in a group
  isExpanded?: boolean; // For group layers
  children?: string[]; // IDs of child layers (for groups)
}

interface HistoryState {
  layers: Layer[];
  timestamp: number;
}

type Tool = 'move' | 'marquee' | 'ellipse-select' | 'lasso' | 'magic-wand' | 'brush' | 'eraser' | 'clone' | 'dodge' | 'burn' | 'crop';
type AdjustmentPanel = 'basic' | 'color' | 'tone' | 'effects' | 'overlays' | null;

export interface PhotoEditorProps {
  onBack: () => void;
}

export function PhotoEditor({ onBack }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]); // Multi-select
  const [clipboard, setClipboard] = useState<Layer[]>([]); // For copy/paste
  const [tool, setTool] = useState<Tool>('move');
  const [activePanel, setActivePanel] = useState<AdjustmentPanel>('basic');
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showLayers, setShowLayers] = useState(true);
  
  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Brush properties
  const [brushSize, setBrushSize] = useState(20);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushColor, setBrushColor] = useState('#000000');
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    layerId: string | null;
    type: 'layer' | 'canvas';
  } | null>(null);
  
  // Blend modes
  const blendModes = [
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
    'exclusion', 'hue', 'saturation', 'color', 'luminosity'
  ];

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  useEffect(() => {
    drawCanvas();
  }, [layers, selectedLayerId, zoom, selection]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    // Clear canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw checkerboard background
    drawCheckerboard(ctx, canvas.width, canvas.height);

    // Draw all visible layers
    layers.forEach(layer => {
      if (!layer.visible) return;
      
      if (layer.type === 'image' && layer.imageData) {
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        
        // Apply adjustments if present
        let imageData = layer.imageData;
        if (layer.adjustments) {
          imageData = applyAdjustments(layer.imageData, layer.adjustments);
        }
        
        ctx.putImageData(imageData, 0, 0);
        ctx.restore();
      }
    });

    // Draw selection overlay
    if (selection) {
      overlayCtx.strokeStyle = '#ffffff';
      overlayCtx.lineWidth = 1;
      overlayCtx.setLineDash([5, 5]);
      overlayCtx.strokeRect(selection.x, selection.y, selection.width, selection.height);
      
      // Draw marching ants effect
      const dashOffset = (Date.now() / 50) % 10;
      overlayCtx.lineDashOffset = -dashOffset;
      overlayCtx.strokeRect(selection.x, selection.y, selection.width, selection.height);
    }
  };

  const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const size = 10;
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#1a1a1a' : '#0a0a0a';
        ctx.fillRect(x, y, size, size);
      }
    }
  };

  const applyAdjustments = (imageData: ImageData, adjustments: Layer['adjustments']): ImageData => {
    // Guard against invalid imageData
    if (!imageData || imageData.width === 0 || imageData.height === 0) {
      console.error('Invalid imageData in applyAdjustments');
      return imageData;
    }
    
    const data = new Uint8ClampedArray(imageData.data);
    const adjusted = new ImageData(data, imageData.width, imageData.height);
    
    for (let i = 0; i < adjusted.data.length; i += 4) {
      let r = adjusted.data[i];
      let g = adjusted.data[i + 1];
      let b = adjusted.data[i + 2];
      
      // Brightness
      if (adjustments?.brightness !== undefined) {
        const brightnessFactor = adjustments.brightness / 100;
        r += brightnessFactor * 255;
        g += brightnessFactor * 255;
        b += brightnessFactor * 255;
      }
      
      // Contrast
      if (adjustments?.contrast !== undefined) {
        const contrastFactor = (adjustments.contrast + 100) / 100;
        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;
      }
      
      // Exposure
      if (adjustments?.exposure !== undefined) {
        const exposureFactor = Math.pow(2, adjustments.exposure / 100);
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;
      }
      
      // Temperature & Tint
      if (adjustments?.temperature !== undefined) {
        r += adjustments.temperature * 2.55;
        b -= adjustments.temperature * 2.55;
      }
      if (adjustments?.tint !== undefined) {
        g += adjustments.tint * 2.55;
      }
      
      // Convert to HSL for saturation and hue adjustments
      const hsl = rgbToHsl(r, g, b);
      
      if (adjustments?.saturation !== undefined) {
        hsl.s *= (1 + adjustments.saturation / 100);
      }
      
      if (adjustments?.vibrance !== undefined) {
        const avg = hsl.s;
        const change = adjustments.vibrance / 100;
        hsl.s += (1 - avg) * change;
      }
      
      if (adjustments?.hue !== undefined) {
        hsl.h = (hsl.h + adjustments.hue / 360) % 1;
      }
      
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
      
      // Highlights/Shadows
      const luminance = (r + g + b) / 3;
      if (adjustments?.highlights !== undefined && luminance > 128) {
        const factor = 1 + (adjustments.highlights / 100) * ((luminance - 128) / 127);
        r *= factor;
        g *= factor;
        b *= factor;
      }
      if (adjustments?.shadows !== undefined && luminance < 128) {
        const factor = 1 + (adjustments.shadows / 100) * ((128 - luminance) / 128);
        r *= factor;
        g *= factor;
        b *= factor;
      }
      
      // Whites/Blacks
      if (adjustments?.whites !== undefined) {
        const whiteFactor = adjustments.whites / 100;
        if (luminance > 200) {
          r += whiteFactor * (255 - r);
          g += whiteFactor * (255 - g);
          b += whiteFactor * (255 - b);
        }
      }
      if (adjustments?.blacks !== undefined) {
        const blackFactor = adjustments.blacks / 100;
        if (luminance < 55) {
          r += blackFactor * r;
          g += blackFactor * g;
          b += blackFactor * b;
        }
      }
      
      adjusted.data[i] = Math.max(0, Math.min(255, r));
      adjusted.data[i + 1] = Math.max(0, Math.min(255, g));
      adjusted.data[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    // Apply filters
    if (adjustments?.blur && adjustments.blur > 0) {
      return applyGaussianBlur(adjusted, adjustments.blur);
    }
    
    if (adjustments?.sharpen && adjustments.sharpen > 0) {
      return applySharpen(adjusted, adjustments.sharpen);
    }
    
    if (adjustments?.noise && adjustments.noise > 0) {
      return applyNoise(adjusted, adjustments.noise);
    }
    
    return adjusted;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h, s, l };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return { r: r * 255, g: g * 255, b: b * 255 };
  };

  const applyGaussianBlur = (imageData: ImageData, radius: number): ImageData => {
    // Simple box blur approximation
    const data = new Uint8ClampedArray(imageData.data);
    const result = new ImageData(data, imageData.width, imageData.height);
    const width = imageData.width;
    const height = imageData.height;
    const r = Math.floor(radius / 10);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4;
              totalR += imageData.data[idx];
              totalG += imageData.data[idx + 1];
              totalB += imageData.data[idx + 2];
              count++;
            }
          }
        }
        
        const idx = (y * width + x) * 4;
        result.data[idx] = totalR / count;
        result.data[idx + 1] = totalG / count;
        result.data[idx + 2] = totalB / count;
      }
    }
    
    return result;
  };

  const applySharpen = (imageData: ImageData, amount: number): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const result = new ImageData(data, imageData.width, imageData.height);
    const width = imageData.width;
    const height = imageData.height;
    const factor = amount / 50;
    
    const kernel = [
      0, -1 * factor, 0,
      -1 * factor, 1 + 4 * factor, -1 * factor,
      0, -1 * factor, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const k = kernel[(ky + 1) * 3 + (kx + 1)];
            r += imageData.data[idx] * k;
            g += imageData.data[idx + 1] * k;
            b += imageData.data[idx + 2] * k;
          }
        }
        
        const idx = (y * width + x) * 4;
        result.data[idx] = Math.max(0, Math.min(255, r));
        result.data[idx + 1] = Math.max(0, Math.min(255, g));
        result.data[idx + 2] = Math.max(0, Math.min(255, b));
      }
    }
    
    return result;
  };

  const applyNoise = (imageData: ImageData, amount: number): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const result = new ImageData(data, imageData.width, imageData.height);
    const intensity = amount * 2.55;
    
    for (let i = 0; i < result.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity;
      result.data[i] += noise;
      result.data[i + 1] += noise;
      result.data[i + 2] += noise;
    }
    
    return result;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type);

    const reader = new FileReader();
    reader.onerror = () => {
      console.error('FileReader error');
    };
    
    reader.onload = (event) => {
      console.log('File loaded, creating image...');
      const img = new Image();
      
      img.onerror = () => {
        console.error('Image loading error');
      };
      
      img.onload = () => {
        console.log('Image loaded successfully:', img.width, 'x', img.height);
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('Canvas not found!');
          return;
        }

        console.log('Canvas found, setting dimensions...');
        // Resize canvas to fit image
        canvas.width = img.width;
        canvas.height = img.height;
        
        const overlayCanvas = overlayCanvasRef.current;
        if (overlayCanvas) {
          overlayCanvas.width = img.width;
          overlayCanvas.height = img.height;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          console.error('Could not get canvas context!');
          return;
        }

        console.log('Drawing image to canvas...');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log('Image data captured:', imageData.width, 'x', imageData.height);

        const newLayer: Layer = {
          id: Date.now().toString(),
          name: `Layer ${layers.length + 1}`,
          visible: true,
          opacity: 100,
          blendMode: 'normal',
          type: 'image',
          imageData,
          adjustments: {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            temperature: 0,
            tint: 0,
            exposure: 0,
            highlights: 0,
            shadows: 0,
            whites: 0,
            blacks: 0,
            vibrance: 0,
            blur: 0,
            sharpen: 0,
            noise: 0,
          },
          overlayEffects: {
            colorOverlay: { enabled: false, color: '#000000', opacity: 50 },
            gradientOverlay: { enabled: false, type: 'linear', colors: ['#000000', '#ffffff'], angle: 0, opacity: 50 },
            patternOverlay: { enabled: false, pattern: 'dots', scale: 10, opacity: 50 },
            vignette: { enabled: false, intensity: 50, size: 50 },
            grain: { enabled: false, intensity: 50, size: 1 },
          }
        };

        console.log('Creating new layer:', newLayer.id, newLayer.name);
        const newLayers = [...layers, newLayer];
        setLayers(newLayers);
        setSelectedLayerId(newLayer.id);
        saveToHistory(newLayers);
        console.log('Layer added successfully! Total layers:', newLayers.length);
      };
      
      console.log('Setting image source...');
      img.src = event.target?.result as string;
    };
    
    console.log('Starting to read file...');
    reader.readAsDataURL(file);
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const updateAdjustment = (key: keyof NonNullable<Layer['adjustments']>, value: number) => {
    if (!selectedLayer) return;

    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === selectedLayerId
          ? {
              ...layer,
              adjustments: {
                ...layer.adjustments,
                [key]: value
              }
            }
          : layer
      )
    );
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'marquee' || tool === 'ellipse-select') {
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelecting || !selectionStart) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionEnd({ x, y });

    const width = x - selectionStart.x;
    const height = y - selectionStart.y;

    setSelection({
      x: width > 0 ? selectionStart.x : x,
      y: height > 0 ? selectionStart.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleCanvasMouseUp = () => {
    setIsSelecting(false);
  };

  const saveToHistory = (newLayers: Layer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      layers: JSON.parse(JSON.stringify(newLayers)),
      timestamp: Date.now()
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex - 1].layers)));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex + 1].layers)));
    }
  };

  const duplicateLayer = () => {
    if (!selectedLayer) return;
    
    const newLayer: Layer = {
      ...JSON.parse(JSON.stringify(selectedLayer)),
      id: Date.now().toString(),
      name: `${selectedLayer.name} copy`
    };
    
    const newLayers = [...layers, newLayer];
    setLayers(newLayers);
    setSelectedLayerId(newLayer.id);
    saveToHistory(newLayers);
  };

  const deleteLayer = () => {
    if (!selectedLayerId) return;
    
    const newLayers = layers.filter(l => l.id !== selectedLayerId);
    setLayers(newLayers);
    setSelectedLayerId(newLayers.length > 0 ? newLayers[newLayers.length - 1].id : null);
    saveToHistory(newLayers);
  };

  // Copy/Paste functionality
  const copySelectedLayers = () => {
    const layersToCopy = selectedLayerIds.length > 0
      ? layers.filter(l => selectedLayerIds.includes(l.id))
      : selectedLayerId
      ? [selectedLayer!]
      : [];
    
    if (layersToCopy.length > 0) {
      setClipboard(JSON.parse(JSON.stringify(layersToCopy)));
    }
  };

  const pasteFromClipboard = () => {
    if (clipboard.length === 0) return;
    
    const newLayers = clipboard.map(layer => ({
      ...JSON.parse(JSON.stringify(layer)),
      id: Date.now().toString() + Math.random(),
      name: `${layer.name} (pasted)`,
      groupId: undefined // Reset group membership
    }));
    
    const updatedLayers = [...layers, ...newLayers];
    setLayers(updatedLayers);
    setSelectedLayerId(newLayers[0].id);
    setSelectedLayerIds([]);
    saveToHistory(updatedLayers);
  };

  // Grouping functionality
  const createGroup = () => {
    const layersToGroup = selectedLayerIds.length > 1
      ? selectedLayerIds
      : selectedLayerId
      ? [selectedLayerId]
      : [];
    
    if (layersToGroup.length === 0) return;
    
    const groupId = Date.now().toString();
    const groupLayer: Layer = {
      id: groupId,
      name: `Group ${layers.filter(l => l.type === 'group').length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      type: 'group',
      isExpanded: true,
      children: layersToGroup
    };
    
    // Update layers to be children of this group
    const updatedLayers = layers.map(layer => 
      layersToGroup.includes(layer.id)
        ? { ...layer, groupId }
        : layer
    );
    
    // Add the group layer
    const newLayers = [...updatedLayers, groupLayer];
    setLayers(newLayers);
    setSelectedLayerId(groupId);
    setSelectedLayerIds([]);
    saveToHistory(newLayers);
  };

  const ungroupLayers = (groupId: string) => {
    const group = layers.find(l => l.id === groupId && l.type === 'group');
    if (!group || !group.children) return;
    
    // Remove group membership from children
    const updatedLayers = layers
      .filter(l => l.id !== groupId) // Remove the group layer
      .map(layer => 
        group.children?.includes(layer.id)
          ? { ...layer, groupId: undefined }
          : layer
      );
    
    setLayers(updatedLayers);
    setSelectedLayerId(null);
    saveToHistory(updatedLayers);
  };

  const toggleGroupExpansion = (groupId: string) => {
    setLayers(layers.map(layer =>
      layer.id === groupId && layer.type === 'group'
        ? { ...layer, isExpanded: !layer.isExpanded }
        : layer
    ));
  };

  // Multi-select layer functionality
  const toggleLayerSelection = (layerId: string, ctrlKey: boolean) => {
    if (ctrlKey) {
      setSelectedLayerIds(prev =>
        prev.includes(layerId)
          ? prev.filter(id => id !== layerId)
          : [...prev, layerId]
      );
    } else {
      setSelectedLayerId(layerId);
      setSelectedLayerIds([]);
    }
  };

  // Context menu functions
  const cutLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    setClipboard([JSON.parse(JSON.stringify(layer))]);
    const newLayers = layers.filter(l => l.id !== layerId);
    setLayers(newLayers);
    setSelectedLayerId(newLayers.length > 0 ? newLayers[newLayers.length - 1].id : null);
    saveToHistory(newLayers);
    setContextMenu(null);
  };

  const renameLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const newName = prompt('Enter new layer name:', layer.name);
    if (newName && newName.trim()) {
      setLayers(layers.map(l =>
        l.id === layerId ? { ...l, name: newName.trim() } : l
      ));
    }
    setContextMenu(null);
  };

  const flipHorizontal = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.imageData) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = layer.imageData.width;
    canvas.height = layer.imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.putImageData(layer.imageData, 0, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, -canvas.width, 0);
    
    const flippedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, imageData: flippedData } : l
    ));
    saveToHistory(layers);
    setContextMenu(null);
  };

  const flipVertical = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.imageData) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = layer.imageData.width;
    canvas.height = layer.imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.putImageData(layer.imageData, 0, 0);
    ctx.scale(1, -1);
    ctx.drawImage(canvas, 0, -canvas.height);
    
    const flippedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, imageData: flippedData } : l
    ));
    saveToHistory(layers);
    setContextMenu(null);
  };

  const rotateLayer = (layerId: string, degrees: number) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.imageData) return;
    
    const canvas = document.createElement('canvas');
    const radians = (degrees * Math.PI) / 180;
    
    // Calculate new canvas size to fit rotated image
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    canvas.width = layer.imageData.width * cos + layer.imageData.height * sin;
    canvas.height = layer.imageData.width * sin + layer.imageData.height * cos;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.putImageData(layer.imageData, -layer.imageData.width / 2, -layer.imageData.height / 2);
    
    const rotatedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, imageData: rotatedData } : l
    ));
    saveToHistory(layers);
    setContextMenu(null);
  };

  const bringToFront = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const newLayers = layers.filter(l => l.id !== layerId);
    newLayers.push(layer);
    setLayers(newLayers);
    saveToHistory(newLayers);
    setContextMenu(null);
  };

  const sendToBack = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const newLayers = [layer, ...layers.filter(l => l.id !== layerId)];
    setLayers(newLayers);
    saveToHistory(newLayers);
    setContextMenu(null);
  };

  const bringForward = (layerId: string) => {
    const index = layers.findIndex(l => l.id === layerId);
    if (index === -1 || index === layers.length - 1) return;
    
    const newLayers = [...layers];
    [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    setLayers(newLayers);
    saveToHistory(newLayers);
    setContextMenu(null);
  };

  const sendBackward = (layerId: string) => {
    const index = layers.findIndex(l => l.id === layerId);
    if (index <= 0) return;
    
    const newLayers = [...layers];
    [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    setLayers(newLayers);
    saveToHistory(newLayers);
    setContextMenu(null);
  };

  const mergeLayers = () => {
    if (selectedLayerIds.length < 2 && !selectedLayerId) return;
    
    const layersToMerge = selectedLayerIds.length > 1
      ? layers.filter(l => selectedLayerIds.includes(l.id) && l.type === 'image')
      : [];
    
    if (layersToMerge.length < 2) return;
    
    // Create merged layer (simplified - just keeps the first layer's data)
    const mergedLayer: Layer = {
      ...layersToMerge[0],
      id: Date.now().toString(),
      name: 'Merged Layer'
    };
    
    const newLayers = [
      ...layers.filter(l => !selectedLayerIds.includes(l.id)),
      mergedLayer
    ];
    
    setLayers(newLayers);
    setSelectedLayerId(mergedLayer.id);
    setSelectedLayerIds([]);
    saveToHistory(newLayers);
    setContextMenu(null);
  };

  const lockLayer = (layerId: string) => {
    // For now, we'll just toggle the locked state (you can extend this)
    setContextMenu(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        copySelectedLayers();
      }
      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteFromClipboard();
      }
      // Cut: Ctrl/Cmd + X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        if (selectedLayerId) {
          cutLayer(selectedLayerId);
        }
      }
      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateLayer();
      }
      // Group: Ctrl/Cmd + G
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        createGroup();
      }
      // Ungroup: Ctrl/Cmd + Shift + G
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        if (selectedLayer && selectedLayer.type === 'group') {
          ungroupLayers(selectedLayerId!);
        }
      }
      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteLayer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, selectedLayerIds, clipboard, layers]);

  // Get visible layers for rendering (considering groups)
  const getVisibleLayers = () => {
    const visibleLayers: Layer[] = [];
    const groupedLayers = new Set<string>();
    
    // First, collect all grouped layers
    layers.forEach(layer => {
      if (layer.groupId) {
        groupedLayers.add(layer.id);
      }
    });
    
    // Then render layers in order
    layers.forEach(layer => {
      if (layer.type === 'group') {
        visibleLayers.push(layer);
      } else if (!layer.groupId) {
        visibleLayers.push(layer);
      }
    });
    
    return visibleLayers;
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
      {/* Top Toolbar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded transition-all"
            title="Back to Launcher"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10" />
          <ImageIcon className="w-5 h-5" />
          <span className="uppercase tracking-tight">PHOTO EDITOR</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2" />
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-white/5 rounded px-2">
            <button
              onClick={() => setZoom(Math.max(10, zoom - 10))}
              disabled={layers.length === 0}
              className="p-1.5 hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs w-12 text-center tracking-tight">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(400, zoom + 10))}
              disabled={layers.length === 0}
              className="p-1.5 hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-white/10 mx-2" />
          
          {/* Layers Toggle */}
          <button
            onClick={() => setShowLayers(!showLayers)}
            className={`p-2 rounded transition-all ${showLayers ? 'bg-white/10' : 'hover:bg-white/10'}`}
            title="Toggle Layers Panel"
          >
            <Layers className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2" />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm uppercase tracking-tight">Import</span>
          </button>
          
          <button
            onClick={exportImage}
            disabled={layers.length === 0}
            className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm uppercase tracking-tight">Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 border-r border-white/10 flex flex-col items-center py-4 gap-2">
          <button
            onClick={() => setTool('move')}
            className={`${
              tool === 'move' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Move Tool"
          >
            <Move className="w-4 h-4" />
          </button>
          
          <div className="w-8 h-px bg-white/10 my-1" />
          
          <button
            onClick={() => setTool('marquee')}
            className={`${
              tool === 'marquee' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Rectangular Marquee"
          >
            <Square className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setTool('ellipse-select')}
            className={`${
              tool === 'ellipse-select' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Elliptical Marquee"
          >
            <Circle className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setTool('lasso')}
            className={`${
              tool === 'lasso' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Lasso Tool"
          >
            <Lasso className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setTool('magic-wand')}
            className={`${
              tool === 'magic-wand' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Magic Wand"
          >
            <Wand2 className="w-4 h-4" />
          </button>
          
          <div className="w-8 h-px bg-white/10 my-1" />
          
          <button
            onClick={() => setTool('crop')}
            className={`${
              tool === 'crop' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Crop Tool"
          >
            <Crop className="w-4 h-4" />
          </button>
          
          <div className="w-8 h-px bg-white/10 my-1" />
          
          <button
            onClick={() => setTool('brush')}
            className={`${
              tool === 'brush' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Brush Tool"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setTool('eraser')}
            className={`${
              tool === 'eraser' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Eraser Tool"
          >
            <Eraser className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setTool('dodge')}
            className={`${
              tool === 'dodge' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Dodge Tool"
          >
            <Sun className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setTool('burn')}
            className={`${
              tool === 'burn' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all`}
            title="Burn Tool"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-black/50 relative overflow-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            {layers.length === 0 && (
              <div className="text-center relative z-10">
                <Upload className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <p className="text-white/40 uppercase tracking-tight mb-2">No Image Loaded</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-white text-black hover:bg-white/90 rounded transition-all uppercase tracking-tight text-sm"
                >
                  Import Image
                </button>
              </div>
            )}
            
            <div className={`relative ${layers.length === 0 ? 'opacity-0 pointer-events-none absolute' : ''}`} style={{ transform: `scale(${zoom / 100})` }}>
              <canvas
                ref={canvasRef}
                className="border border-white/20"
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 pointer-events-auto"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (selectedLayerId) {
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      layerId: selectedLayerId,
                      type: 'canvas'
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Adjustments */}
        <div className="w-80 border-l border-white/10 flex flex-col">
          {/* Panel Tabs */}
          <div className="h-12 border-b border-white/10 flex">
            <button
              onClick={() => setActivePanel('basic')}
              className={`flex-1 text-xs uppercase tracking-tight transition-all ${
                activePanel === 'basic' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setActivePanel('color')}
              className={`flex-1 text-xs uppercase tracking-tight transition-all ${
                activePanel === 'color' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              Color
            </button>
            <button
              onClick={() => setActivePanel('tone')}
              className={`flex-1 text-xs uppercase tracking-tight transition-all ${
                activePanel === 'tone' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              Tone
            </button>
            <button
              onClick={() => setActivePanel('effects')}
              className={`flex-1 text-xs uppercase tracking-tight transition-all ${
                activePanel === 'effects' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              Effects
            </button>
          </div>

          {/* Adjustments Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {!selectedLayer ? (
              <div className="text-white/40 text-sm text-center pt-8">
                Select a layer to adjust
              </div>
            ) : (
              <>
                {activePanel === 'basic' && (
                  <>
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Exposure</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.exposure || 0}
                        onChange={(e) => updateAdjustment('exposure', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.exposure || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Brightness</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.brightness || 0}
                        onChange={(e) => updateAdjustment('brightness', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.brightness || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Contrast</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.contrast || 0}
                        onChange={(e) => updateAdjustment('contrast', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.contrast || 0}</div>
                    </div>
                  </>
                )}

                {activePanel === 'color' && (
                  <>
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Temperature</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.temperature || 0}
                        onChange={(e) => updateAdjustment('temperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.temperature || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Tint</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.tint || 0}
                        onChange={(e) => updateAdjustment('tint', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.tint || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Saturation</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.saturation || 0}
                        onChange={(e) => updateAdjustment('saturation', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.saturation || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Vibrance</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.vibrance || 0}
                        onChange={(e) => updateAdjustment('vibrance', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.vibrance || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Hue</label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedLayer.adjustments?.hue || 0}
                        onChange={(e) => updateAdjustment('hue', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.hue || 0}°</div>
                    </div>
                  </>
                )}

                {activePanel === 'tone' && (
                  <>
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Highlights</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.highlights || 0}
                        onChange={(e) => updateAdjustment('highlights', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.highlights || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Shadows</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.shadows || 0}
                        onChange={(e) => updateAdjustment('shadows', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.shadows || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Whites</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.whites || 0}
                        onChange={(e) => updateAdjustment('whites', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.whites || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Blacks</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedLayer.adjustments?.blacks || 0}
                        onChange={(e) => updateAdjustment('blacks', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.blacks || 0}</div>
                    </div>
                  </>
                )}

                {activePanel === 'effects' && (
                  <>
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Blur</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedLayer.adjustments?.blur || 0}
                        onChange={(e) => updateAdjustment('blur', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.blur || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Sharpen</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedLayer.adjustments?.sharpen || 0}
                        onChange={(e) => updateAdjustment('sharpen', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.sharpen || 0}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-tight text-white/60 mb-2 block">Noise</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedLayer.adjustments?.noise || 0}
                        onChange={(e) => updateAdjustment('noise', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-white/40 text-right mt-1">{selectedLayer.adjustments?.noise || 0}</div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Panel - Layers */}
        {showLayers && (
          <div className="absolute bottom-0 right-80 w-96 h-80 border-t border-l border-white/10 bg-black flex flex-col transition-all">
            <div className="h-10 border-b border-white/10 flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span className="text-xs uppercase tracking-tight">Layers</span>
                {clipboard.length > 0 && (
                  <span className="text-xs text-white/40">({clipboard.length} copied)</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={copySelectedLayers}
                  disabled={!selectedLayerId && selectedLayerIds.length === 0}
                  className="p-1.5 hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Copy Layer(s) (Ctrl+C)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={pasteFromClipboard}
                  disabled={clipboard.length === 0}
                  className="p-1.5 hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Paste Layer(s) (Ctrl+V)"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  onClick={createGroup}
                  disabled={!selectedLayerId && selectedLayerIds.length < 2}
                  className="p-1.5 hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Group Layers (Ctrl+G)"
                >
                  <FolderClosed className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={deleteLayer}
                  disabled={!selectedLayerId}
                  className="p-1.5 hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Delete Layer (Del)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {selectedLayerIds.length > 1 && (
              <div className="px-3 py-2 bg-white/5 border-b border-white/10 text-xs text-white/60">
                {selectedLayerIds.length} layers selected • Hold Ctrl to select multiple
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {layers.length === 0 ? (
                <div className="text-white/40 text-xs text-center pt-8">No layers</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {[...layers].reverse().map((layer) => {
                    const isSelected = selectedLayerId === layer.id || selectedLayerIds.includes(layer.id);
                    const isGroup = layer.type === 'group';
                    const childLayers = isGroup && layer.children 
                      ? layers.filter(l => layer.children?.includes(l.id))
                      : [];
                    
                    return (
                      <div key={layer.id}>
                        <div
                          onClick={(e) => toggleLayerSelection(layer.id, e.ctrlKey || e.metaKey)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              layerId: layer.id,
                              type: 'layer'
                            });
                            setSelectedLayerId(layer.id);
                          }}
                          className={`p-3 cursor-pointer transition-all ${
                            isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isGroup && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleGroupExpansion(layer.id);
                                  }}
                                  className="p-0.5 hover:bg-white/10 rounded"
                                >
                                  {layer.isExpanded ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                              {isGroup ? (
                                layer.isExpanded ? (
                                  <FolderOpen className="w-3.5 h-3.5 text-white/60" />
                                ) : (
                                  <FolderClosed className="w-3.5 h-3.5 text-white/60" />
                                )
                              ) : null}
                              <span className="text-sm">{layer.name}</span>
                              {isGroup && (
                                <span className="text-xs text-white/40">({childLayers.length})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {isGroup && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    ungroupLayers(layer.id);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"
                                  title="Ungroup"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLayers(layers.map(l =>
                                    l.id === layer.id ? { ...l, visible: !l.visible } : l
                                  ));
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                {layer.visible ? (
                                  <Eye className="w-3.5 h-3.5" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-white/40" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {!isGroup && (
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-white/40 uppercase tracking-tight block mb-1">
                                  Opacity
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={layer.opacity}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    setLayers(layers.map(l =>
                                      l.id === layer.id ? { ...l, opacity: parseFloat(e.target.value) } : l
                                    ));
                                  }}
                                  className="w-full"
                                />
                                <div className="text-xs text-white/40 text-right mt-0.5">
                                  {layer.opacity}%
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-xs text-white/40 uppercase tracking-tight block mb-1">
                                  Blend Mode
                                </label>
                                <select
                                  value={layer.blendMode}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    setLayers(layers.map(l =>
                                      l.id === layer.id ? { ...l, blendMode: e.target.value } : l
                                    ));
                                  }}
                                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                                >
                                  {blendModes.map(mode => (
                                    <option key={mode} value={mode} className="bg-black">
                                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Show child layers when group is expanded */}
                        {isGroup && layer.isExpanded && childLayers.map((childLayer) => (
                          <div
                            key={childLayer.id}
                            onClick={(e) => toggleLayerSelection(childLayer.id, e.ctrlKey || e.metaKey)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                layerId: childLayer.id,
                                type: 'layer'
                              });
                              setSelectedLayerId(childLayer.id);
                            }}
                            className={`p-3 pl-10 cursor-pointer transition-all border-l-2 border-white/20 ml-6 ${
                              selectedLayerId === childLayer.id || selectedLayerIds.includes(childLayer.id)
                                ? 'bg-white/10'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">{childLayer.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLayers(layers.map(l =>
                                    l.id === childLayer.id ? { ...l, visible: !l.visible } : l
                                  ));
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                {childLayer.visible ? (
                                  <Eye className="w-3.5 h-3.5" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-white/40" />
                                )}
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-white/40 uppercase tracking-tight block mb-1">
                                  Opacity
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={childLayer.opacity}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    setLayers(layers.map(l =>
                                      l.id === childLayer.id
                                        ? { ...l, opacity: parseFloat(e.target.value) }
                                        : l
                                    ));
                                  }}
                                  className="w-full"
                                />
                                <div className="text-xs text-white/40 text-right mt-0.5">
                                  {childLayer.opacity}%
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-xs text-white/40 uppercase tracking-tight block mb-1">
                                  Blend Mode
                                </label>
                                <select
                                  value={childLayer.blendMode}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    setLayers(layers.map(l =>
                                      l.id === childLayer.id ? { ...l, blendMode: e.target.value } : l
                                    ));
                                  }}
                                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                                >
                                  {blendModes.map(mode => (
                                    <option key={mode} value={mode} className="bg-black">
                                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-black border border-white/20 rounded shadow-2xl z-50 py-1 min-w-[200px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.02em'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.layerId && (
            <>
              <button
                onClick={() => {
                  copySelectedLayers();
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all flex items-center justify-between"
              >
                <span>Copy</span>
                <span className="text-xs text-white/40">Ctrl+C</span>
              </button>
              
              {clipboard.length > 0 && (
                <button
                  onClick={() => {
                    pasteFromClipboard();
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all flex items-center justify-between"
                >
                  <span>Paste</span>
                  <span className="text-xs text-white/40">Ctrl+V</span>
                </button>
              )}
              
              <button
                onClick={() => cutLayer(contextMenu.layerId!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all flex items-center justify-between"
              >
                <span>Cut</span>
                <span className="text-xs text-white/40">Ctrl+X</span>
              </button>
              
              <button
                onClick={() => {
                  duplicateLayer();
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all flex items-center justify-between"
              >
                <span>Duplicate</span>
                <span className="text-xs text-white/40">Ctrl+D</span>
              </button>
              
              <button
                onClick={() => {
                  deleteLayer();
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all flex items-center justify-between text-red-400"
              >
                <span>Delete</span>
                <span className="text-xs text-white/40">Del</span>
              </button>
              
              <div className="h-px bg-white/10 my-1" />
              
              <button
                onClick={() => renameLayer(contextMenu.layerId!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all"
              >
                Rename
              </button>
              
              <div className="h-px bg-white/10 my-1" />
              
              <div className="px-2 py-1">
                <div className="text-xs uppercase tracking-tight text-white/40 px-2 py-1">Transform</div>
                <button
                  onClick={() => flipHorizontal(contextMenu.layerId!)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Flip Horizontal
                </button>
                <button
                  onClick={() => flipVertical(contextMenu.layerId!)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Flip Vertical
                </button>
                <button
                  onClick={() => rotateLayer(contextMenu.layerId!, 90)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Rotate 90° CW
                </button>
                <button
                  onClick={() => rotateLayer(contextMenu.layerId!, -90)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Rotate 90° CCW
                </button>
                <button
                  onClick={() => rotateLayer(contextMenu.layerId!, 180)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Rotate 180°
                </button>
              </div>
              
              <div className="h-px bg-white/10 my-1" />
              
              <div className="px-2 py-1">
                <div className="text-xs uppercase tracking-tight text-white/40 px-2 py-1">Arrange</div>
                <button
                  onClick={() => bringToFront(contextMenu.layerId!)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Bring to Front
                </button>
                <button
                  onClick={() => bringForward(contextMenu.layerId!)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Bring Forward
                </button>
                <button
                  onClick={() => sendBackward(contextMenu.layerId!)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Send Backward
                </button>
                <button
                  onClick={() => sendToBack(contextMenu.layerId!)}
                  className="w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-all rounded"
                >
                  Send to Back
                </button>
              </div>
              
              <div className="h-px bg-white/10 my-1" />
              
              {selectedLayerIds.length > 1 && (
                <>
                  <button
                    onClick={mergeLayers}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all"
                  >
                    Merge Selected Layers
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                </>
              )}
              
              <button
                onClick={() => {
                  createGroup();
                  setContextMenu(null);
                }}
                disabled={!selectedLayerId && selectedLayerIds.length < 2}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all disabled:opacity-30 flex items-center justify-between"
              >
                <span>Group</span>
                <span className="text-xs text-white/40">Ctrl+G</span>
              </button>
              
              {layers.find(l => l.id === contextMenu.layerId && l.type === 'group') && (
                <button
                  onClick={() => {
                    ungroupLayers(contextMenu.layerId!);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-all flex items-center justify-between"
                >
                  <span>Ungroup</span>
                  <span className="text-xs text-white/40">Ctrl+Shift+G</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}