import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  MousePointer2,
  Square,
  Circle,
  Pencil,
  Layers,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Download,
  Star,
  Hexagon,
  Triangle,
  Search,
  ChevronRight,
  ChevronDown,
  Share2,
  Copy,
  Lock,
  Unlock,
  RotateCw,
  Pipette,
  Pen,
  CircleDot,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Maximize2,
  Minimize2,
  Grid3x3,
  Ruler,
  Magnet,
  Sparkles,
  Palette,
  Combine,
  Minus,
  X as XIcon,
  Blend,
  FlipHorizontal,
  FlipVertical,
  ArrowUpToLine,
  ArrowDownToLine,
  Send,
  History,
  Undo2,
  Redo2,
  Group,
  Ungroup,
  Droplets,
  Type,
  Save,
  PaintBucket,
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { SomaLogo } from './SomaLogo';
import { SavedProject } from '../App';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import craftsmanLogo from 'figma:asset/a0cacb234445eda312b3e3f327be59e0750bd6f2.png';

interface GraphicDesignerProps {
  onBack: () => void;
  customBrushes?: any[];
  onSaveProject?: (projectData: any, thumbnail: string, name: string) => void;
  initialProject?: SavedProject | null;
}

type Tool = 'select' | 'direct-select' | 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'star' | 'triangle' | 'pen' | 'brush' | 'custom-brush' | 'eyedropper' | 'text' | 'vector-pen' | 'polygon-pen' | 'fill';
type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn';
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

interface GradientStop {
  color: string;
  position: number;
}

interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle: number;
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  shapes: Shape[];
}

interface BezierPoint {
  x: number;
  y: number;
  cp1?: { x: number; y: number }; // control point 1
  cp2?: { x: number; y: number }; // control point 2
}

interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'star' | 'triangle' | 'pen' | 'brush' | 'custom-brush' | 'text' | 'vector-pen' | 'polygon-pen';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  rotation: number;
  points?: { x: number; y: number }[];
  bezierPoints?: BezierPoint[];
  sides?: number;
  starPoints?: number;
  innerRadius?: number;
  gradient?: Gradient;
  effect?: string;
  effectIntensity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  closed?: boolean; // for polygon-pen
}

interface Page {
  id: string;
  name: string;
  layers: Layer[];
}

interface HistoryState {
  pages: Page[];
  timestamp: number;
}

export function GraphicDesigner({ onBack, customBrushes, onSaveProject, initialProject }: GraphicDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [projectName, setProjectName] = useState(initialProject?.name || 'Untitled Project');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pages, setPages] = useState<Page[]>(() => {
    if (initialProject?.data?.pages) {
      return initialProject.data.pages;
    }
    return [
      {
        id: '1',
        name: 'Artboard 1',
        layers: [
          {
            id: '1',
            name: 'Layer 1',
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
            shapes: [],
          },
        ],
      },
    ];
  });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [color, setColor] = useState('#6366f1');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [cornerRadius, setCornerRadius] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [blendMode, setBlendMode] = useState<BlendMode>('normal');
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set(['1']));
  const [showStroke, setShowStroke] = useState(true);
  const [showFill, setShowFill] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [useGradient, setUseGradient] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string>('none');
  const [effectIntensity, setEffectIntensity] = useState(50);
  
  // Text properties
  const [textContent, setTextContent] = useState('Text');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontWeight, setFontWeight] = useState('400');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Vector and polygon pen state
  const [vectorPoints, setVectorPoints] = useState<BezierPoint[]>([]);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawingVector, setIsDrawingVector] = useState(false);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [currentVectorPoint, setCurrentVectorPoint] = useState<{ x: number; y: number } | null>(null);
  
  // Color swatches
  const [colorSwatches, setColorSwatches] = useState<string[]>([
    '#000000', '#ffffff', '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  ]);
  
  // History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Transform properties
  const [transformX, setTransformX] = useState(0);
  const [transformY, setTransformY] = useState(0);
  const [transformW, setTransformW] = useState(0);
  const [transformH, setTransformH] = useState(0);

  const currentPage = pages[currentPageIndex];
  const currentLayer = currentPage.layers[currentLayerIndex];

  useEffect(() => {
    drawCanvas();
  }, [pages, currentPageIndex, selectedShapeId, showStroke, showFill, showGrid, vectorPoints, polygonPoints, currentVectorPoint, isDrawingVector, isDrawingPolygon]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel drawing
      if (e.key === 'Escape') {
        if (isDrawingVector) {
          setIsDrawingVector(false);
          setVectorPoints([]);
          setCurrentVectorPoint(null);
        }
        if (isDrawingPolygon) {
          setIsDrawingPolygon(false);
          setPolygonPoints([]);
          setCurrentVectorPoint(null);
        }
      }
      
      // Enter to complete path
      if (e.key === 'Enter') {
        if (isDrawingVector && vectorPoints.length >= 2) {
          const centerX = vectorPoints.reduce((sum, p) => sum + p.x, 0) / vectorPoints.length;
          const centerY = vectorPoints.reduce((sum, p) => sum + p.y, 0) / vectorPoints.length;
          
          const newShape: Shape = {
            id: Date.now().toString(),
            type: 'vector-pen',
            x: centerX,
            y: centerY,
            color,
            strokeColor,
            strokeWidth,
            rotation: 0,
            bezierPoints: vectorPoints,
            closed: false,
          };
          
          setPages((prev) => {
            const newPages = [...prev];
            const newLayers = [...newPages[currentPageIndex].layers];
            const newShapes = [...newLayers[currentLayerIndex].shapes];
            newShapes.push(newShape);
            newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], shapes: newShapes };
            newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
            return newPages;
          });
          
          setIsDrawingVector(false);
          setVectorPoints([]);
          setCurrentVectorPoint(null);
          saveToHistory();
        }
        
        if (isDrawingPolygon && polygonPoints.length >= 3) {
          const centerX = polygonPoints.reduce((sum, p) => sum + p.x, 0) / polygonPoints.length;
          const centerY = polygonPoints.reduce((sum, p) => sum + p.y, 0) / polygonPoints.length;
          
          const newShape: Shape = {
            id: Date.now().toString(),
            type: 'polygon-pen',
            x: centerX,
            y: centerY,
            color,
            strokeColor,
            strokeWidth,
            rotation: 0,
            points: polygonPoints,
            closed: true,
          };
          
          setPages((prev) => {
            const newPages = [...prev];
            const newLayers = [...newPages[currentPageIndex].layers];
            const newShapes = [...newLayers[currentLayerIndex].shapes];
            newShapes.push(newShape);
            newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], shapes: newShapes };
            newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
            return newPages;
          });
          
          setIsDrawingPolygon(false);
          setPolygonPoints([]);
          setCurrentVectorPoint(null);
          saveToHistory();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingVector, isDrawingPolygon, vectorPoints, polygonPoints, color, strokeColor, strokeWidth]);

  useEffect(() => {
    const selectedShape = getSelectedShape();
    if (selectedShape) {
      setTransformX(Math.round(selectedShape.x));
      setTransformY(Math.round(selectedShape.y));
      if (selectedShape.width) setTransformW(Math.round(selectedShape.width));
      if (selectedShape.height) setTransformH(Math.round(selectedShape.height));
    }
  }, [selectedShapeId, pages]);

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      pages: JSON.parse(JSON.stringify(pages)),
      timestamp: Date.now(),
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleSaveProject = () => {
    if (!onSaveProject) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Generate thumbnail
    const thumbnail = canvas.toDataURL('image/png');
    
    // Save project data
    const projectData = {
      pages,
      currentPageIndex,
    };
    
    onSaveProject(projectData, thumbnail, projectName);
    setShowSaveDialog(false);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPages(JSON.parse(JSON.stringify(history[historyIndex - 1].pages)));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPages(JSON.parse(JSON.stringify(history[historyIndex + 1].pages)));
    }
  };

  const getSelectedShape = (): Shape | null => {
    if (!selectedShapeId) return null;
    for (const layer of currentPage.layers) {
      const shape = layer.shapes.find((s) => s.id === selectedShapeId);
      if (shape) return shape;
    }
    return null;
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showGrid) return;
    
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const gridSize = 20;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    const handleSize = 8;
    const handleColor = '#00ff99';
    const handleStroke = '#ffffff';

    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate((shape.rotation * Math.PI) / 180);

    if ((shape.type === 'rectangle' || shape.type === 'ellipse') && shape.width && shape.height) {
      const hw = shape.width / 2;
      const hh = shape.height / 2;

      const handles = [
        { x: -hw, y: -hh, type: 'nw' },
        { x: hw, y: -hh, type: 'ne' },
        { x: -hw, y: hh, type: 'sw' },
        { x: hw, y: hh, type: 'se' },
        { x: 0, y: -hh, type: 'n' },
        { x: 0, y: hh, type: 's' },
        { x: -hw, y: 0, type: 'w' },
        { x: hw, y: 0, type: 'e' },
      ];

      handles.forEach((handle) => {
        ctx.fillStyle = handleColor;
        ctx.strokeStyle = handleStroke;
        ctx.lineWidth = 2;
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      });
    } else if (shape.type === 'circle' && shape.radius) {
      const handles = [
        { x: 0, y: -shape.radius, type: 'n' },
        { x: 0, y: shape.radius, type: 's' },
        { x: -shape.radius, y: 0, type: 'w' },
        { x: shape.radius, y: 0, type: 'e' },
        { x: -shape.radius * 0.707, y: -shape.radius * 0.707, type: 'nw' },
        { x: shape.radius * 0.707, y: -shape.radius * 0.707, type: 'ne' },
        { x: -shape.radius * 0.707, y: shape.radius * 0.707, type: 'sw' },
        { x: shape.radius * 0.707, y: shape.radius * 0.707, type: 'se' },
      ];

      handles.forEach((handle) => {
        ctx.fillStyle = handleColor;
        ctx.strokeStyle = handleStroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }

    ctx.restore();
  };

  const applyEffect = (ctx: CanvasRenderingContext2D, effect: string, intensity: number) => {
    if (effect === 'none') return;
    
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    if (effect === 'blur') {
      ctx.filter = `blur(${intensity / 10}px)`;
    } else if (effect === 'brightness') {
      ctx.filter = `brightness(${intensity * 2}%)`;
    } else if (effect === 'contrast') {
      ctx.filter = `contrast(${intensity * 2}%)`;
    } else if (effect === 'grayscale') {
      ctx.filter = `grayscale(${intensity}%)`;
    } else if (effect === 'invert') {
      ctx.filter = `invert(${intensity}%)`;
    } else if (effect === 'saturate') {
      ctx.filter = `saturate(${intensity * 2}%)`;
    }
  };

  const createGradient = (ctx: CanvasRenderingContext2D, gradient: Gradient, shape: Shape) => {
    let grad;
    
    if (gradient.type === 'linear') {
      const angle = (gradient.angle * Math.PI) / 180;
      const length = Math.max(shape.width || 0, shape.height || 0, shape.radius ? shape.radius * 2 : 0);
      const x1 = -Math.cos(angle) * length / 2;
      const y1 = -Math.sin(angle) * length / 2;
      const x2 = Math.cos(angle) * length / 2;
      const y2 = Math.sin(angle) * length / 2;
      grad = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      const radius = Math.max(shape.width || 0, shape.height || 0, shape.radius || 0) / 2;
      grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    }

    gradient.stops.forEach(stop => {
      grad.addColorStop(stop.position, stop.color);
    });

    return grad;
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape, isSelected: boolean = false) => {
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate((shape.rotation * Math.PI) / 180);

    // Apply effects
    if (shape.effect && shape.effect !== 'none') {
      applyEffect(ctx, shape.effect, shape.effectIntensity || 50);
    }

    // Set fill style
    if (showFill) {
      if (shape.gradient && useGradient) {
        ctx.fillStyle = createGradient(ctx, shape.gradient, shape);
      } else {
        ctx.fillStyle = shape.color;
      }
    }
    
    // Set stroke style
    if (showStroke && shape.strokeWidth && shape.strokeColor) {
      ctx.strokeStyle = shape.strokeColor;
      ctx.lineWidth = shape.strokeWidth;
    }

    if (shape.type === 'rectangle') {
      if (shape.cornerRadius && shape.cornerRadius > 0) {
        drawRoundedRect(
          ctx,
          -shape.width! / 2,
          -shape.height! / 2,
          shape.width!,
          shape.height!,
          shape.cornerRadius
        );
      } else {
        if (showFill) {
          ctx.fillRect(-shape.width! / 2, -shape.height! / 2, shape.width!, shape.height!);
        }
        if (showStroke && shape.strokeWidth) {
          ctx.strokeRect(-shape.width! / 2, -shape.height! / 2, shape.width!, shape.height!);
        }
      }
    } else if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, shape.radius!, 0, Math.PI * 2);
      if (showFill) ctx.fill();
      if (showStroke && shape.strokeWidth) ctx.stroke();
    } else if (shape.type === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(0, 0, shape.width! / 2, shape.height! / 2, 0, 0, Math.PI * 2);
      if (showFill) ctx.fill();
      if (showStroke && shape.strokeWidth) ctx.stroke();
    } else if (shape.type === 'triangle') {
      const h = shape.height! / 2;
      const w = shape.width! / 2;
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(w, h);
      ctx.lineTo(-w, h);
      ctx.closePath();
      if (showFill) ctx.fill();
      if (showStroke && shape.strokeWidth) ctx.stroke();
    } else if (shape.type === 'polygon') {
      const sides = shape.sides || 6;
      const radius = shape.radius || 50;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      if (showFill) ctx.fill();
      if (showStroke && shape.strokeWidth) ctx.stroke();
    } else if (shape.type === 'star') {
      const points = shape.starPoints || 5;
      const outerRadius = shape.radius || 50;
      const innerRadius = shape.innerRadius || 25;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      if (showFill) ctx.fill();
      if (showStroke && shape.strokeWidth) ctx.stroke();
    } else if ((shape.type === 'brush' || shape.type === 'custom-brush' || shape.type === 'pen') && shape.points) {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = shape.strokeWidth || 4;
      ctx.strokeStyle = shape.color;
      
      if (shape.points.length > 0) {
        ctx.moveTo(shape.points[0].x - shape.x, shape.points[0].y - shape.y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x - shape.x, shape.points[i].y - shape.y);
        }
        ctx.stroke();
      }
    } else if (shape.type === 'text' && shape.text) {
      ctx.font = `${shape.fontStyle || 'normal'} ${shape.fontWeight || '400'} ${shape.fontSize || 24}px ${shape.fontFamily || 'Inter'}`;
      ctx.fillStyle = shape.color;
      ctx.textAlign = shape.textAlign || 'left';
      ctx.textBaseline = 'middle';
      
      if (showFill) {
        ctx.fillText(shape.text, 0, 0);
      }
      
      if (showStroke && shape.strokeWidth && shape.strokeColor) {
        ctx.strokeStyle = shape.strokeColor;
        ctx.lineWidth = shape.strokeWidth;
        ctx.strokeText(shape.text, 0, 0);
      }
    } else if (shape.type === 'vector-pen' && shape.bezierPoints && shape.bezierPoints.length > 0) {
      ctx.beginPath();
      const firstPoint = shape.bezierPoints[0];
      ctx.moveTo(firstPoint.x - shape.x, firstPoint.y - shape.y);
      
      for (let i = 1; i < shape.bezierPoints.length; i++) {
        const point = shape.bezierPoints[i];
        const prevPoint = shape.bezierPoints[i - 1];
        
        if (prevPoint.cp2 && point.cp1) {
          // Bezier curve with control points
          ctx.bezierCurveTo(
            prevPoint.cp2.x - shape.x,
            prevPoint.cp2.y - shape.y,
            point.cp1.x - shape.x,
            point.cp1.y - shape.y,
            point.x - shape.x,
            point.y - shape.y
          );
        } else {
          // Straight line
          ctx.lineTo(point.x - shape.x, point.y - shape.y);
        }
      }
      
      if (shape.closed) {
        ctx.closePath();
      }
      
      if (showFill && shape.closed) {
        ctx.fillStyle = shape.color;
        ctx.fill();
      }
      if (showStroke && shape.strokeWidth) {
        ctx.strokeStyle = shape.strokeColor || shape.color;
        ctx.lineWidth = shape.strokeWidth;
        ctx.stroke();
      }
    } else if (shape.type === 'polygon-pen' && shape.points && shape.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x - shape.x, shape.points[0].y - shape.y);
      
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x - shape.x, shape.points[i].y - shape.y);
      }
      
      if (shape.closed) {
        ctx.closePath();
      }
      
      if (showFill && shape.closed) {
        ctx.fillStyle = shape.color;
        ctx.fill();
      }
      if (showStroke && shape.strokeWidth) {
        ctx.strokeStyle = shape.strokeColor || shape.color;
        ctx.lineWidth = shape.strokeWidth;
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    currentPage.layers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;

      layer.shapes.forEach((shape) => {
        drawShape(ctx, shape);
      });

      ctx.restore();
    });

    const selectedShape = getSelectedShape();
    if (selectedShape) {
      ctx.save();
      ctx.translate(selectedShape.x, selectedShape.y);
      ctx.rotate((selectedShape.rotation * Math.PI) / 180);

      ctx.strokeStyle = '#00ff99';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (selectedShape.type === 'rectangle' || selectedShape.type === 'ellipse' || selectedShape.type === 'triangle') {
        ctx.strokeRect(-selectedShape.width! / 2 - 4, -selectedShape.height! / 2 - 4, selectedShape.width! + 8, selectedShape.height! + 8);
      } else if (selectedShape.type === 'circle' || selectedShape.type === 'polygon' || selectedShape.type === 'star') {
        ctx.beginPath();
        ctx.arc(0, 0, (selectedShape.radius || 50) + 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (selectedShape.type === 'text' && selectedShape.text) {
        ctx.font = `${selectedShape.fontStyle || 'normal'} ${selectedShape.fontWeight || '400'} ${selectedShape.fontSize || 24}px ${selectedShape.fontFamily || 'Inter'}`;
        const metrics = ctx.measureText(selectedShape.text);
        const textWidth = metrics.width;
        const textHeight = selectedShape.fontSize || 24;
        ctx.strokeRect(-textWidth / 2 - 4, -textHeight / 2 - 4, textWidth + 8, textHeight + 8);
      }
      
      ctx.setLineDash([]);
      ctx.restore();

      if (selectedShape.type !== 'brush' && selectedShape.type !== 'custom-brush' && selectedShape.type !== 'pen' && selectedShape.type !== 'text' && selectedShape.type !== 'vector-pen' && selectedShape.type !== 'polygon-pen') {
        drawResizeHandles(ctx, selectedShape);
      }
    }

    // Draw vector pen preview
    if (isDrawingVector && vectorPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#00ff99';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(vectorPoints[0].x, vectorPoints[0].y);
      
      for (let i = 1; i < vectorPoints.length; i++) {
        const point = vectorPoints[i];
        const prevPoint = vectorPoints[i - 1];
        
        if (prevPoint.cp2 && point.cp1) {
          ctx.bezierCurveTo(
            prevPoint.cp2.x,
            prevPoint.cp2.y,
            point.cp1.x,
            point.cp1.y,
            point.x,
            point.y
          );
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      
      if (currentVectorPoint) {
        ctx.lineTo(currentVectorPoint.x, currentVectorPoint.y);
      }
      
      ctx.stroke();
      
      // Draw points
      vectorPoints.forEach((point) => {
        ctx.fillStyle = '#00ff99';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw control points
        if (point.cp1) {
          ctx.strokeStyle = '#ff0099';
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(point.cp1.x, point.cp1.y);
          ctx.stroke();
          ctx.fillStyle = '#ff0099';
          ctx.beginPath();
          ctx.arc(point.cp1.x, point.cp1.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (point.cp2) {
          ctx.strokeStyle = '#ff0099';
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(point.cp2.x, point.cp2.y);
          ctx.stroke();
          ctx.fillStyle = '#ff0099';
          ctx.beginPath();
          ctx.arc(point.cp2.x, point.cp2.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      ctx.restore();
    }

    // Draw polygon pen preview
    if (isDrawingPolygon && polygonPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#00ff99';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      
      if (currentVectorPoint) {
        ctx.lineTo(currentVectorPoint.x, currentVectorPoint.y);
      }
      
      ctx.stroke();
      
      // Draw points
      polygonPoints.forEach((point, idx) => {
        ctx.fillStyle = idx === 0 ? '#ff0099' : '#00ff99';
        ctx.beginPath();
        ctx.arc(point.x, point.y, idx === 0 ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.restore();
    }
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (showFill) ctx.fill();
    if (showStroke && ctx.lineWidth) ctx.stroke();
  };

  const getResizeHandle = (x: number, y: number, shape: Shape): ResizeHandle => {
    const handleSize = 8;
    const cos = Math.cos((-shape.rotation * Math.PI) / 180);
    const sin = Math.sin((-shape.rotation * Math.PI) / 180);
    
    const dx = x - shape.x;
    const dy = y - shape.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    if ((shape.type === 'rectangle' || shape.type === 'ellipse' || shape.type === 'triangle') && shape.width && shape.height) {
      const hw = shape.width / 2;
      const hh = shape.height / 2;

      const handles: { x: number; y: number; type: ResizeHandle }[] = [
        { x: -hw, y: -hh, type: 'nw' },
        { x: hw, y: -hh, type: 'ne' },
        { x: -hw, y: hh, type: 'sw' },
        { x: hw, y: hh, type: 'se' },
        { x: 0, y: -hh, type: 'n' },
        { x: 0, y: hh, type: 's' },
        { x: -hw, y: 0, type: 'w' },
        { x: hw, y: 0, type: 'e' },
      ];

      for (const handle of handles) {
        if (Math.abs(localX - handle.x) < handleSize && Math.abs(localY - handle.y) < handleSize) {
          return handle.type;
        }
      }
    } else if ((shape.type === 'circle' || shape.type === 'polygon' || shape.type === 'star') && shape.radius) {
      const handles = [
        { x: 0, y: -shape.radius, type: 'n' as ResizeHandle },
        { x: 0, y: shape.radius, type: 's' as ResizeHandle },
        { x: -shape.radius, y: 0, type: 'w' as ResizeHandle },
        { x: shape.radius, y: 0, type: 'e' as ResizeHandle },
        { x: -shape.radius * 0.707, y: -shape.radius * 0.707, type: 'nw' as ResizeHandle },
        { x: shape.radius * 0.707, y: -shape.radius * 0.707, type: 'ne' as ResizeHandle },
        { x: -shape.radius * 0.707, y: shape.radius * 0.707, type: 'sw' as ResizeHandle },
        { x: shape.radius * 0.707, y: shape.radius * 0.707, type: 'se' as ResizeHandle },
      ];

      for (const handle of handles) {
        if (Math.abs(localX - handle.x) < handleSize && Math.abs(localY - handle.y) < handleSize) {
          return handle.type;
        }
      }
    }

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentLayer.locked) return;

    if (tool === 'vector-pen') {
      if (!isDrawingVector) {
        // Start new vector path
        setIsDrawingVector(true);
        setVectorPoints([{ x, y }]);
      } else {
        // Add point to vector path
        setVectorPoints([...vectorPoints, { x, y }]);
      }
      return;
    }

    if (tool === 'polygon-pen') {
      if (!isDrawingPolygon) {
        // Start new polygon
        setIsDrawingPolygon(true);
        setPolygonPoints([{ x, y }]);
      } else {
        // Check if clicking near first point to close
        const firstPoint = polygonPoints[0];
        const distance = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
        
        if (distance < 10 && polygonPoints.length >= 3) {
          // Close polygon
          const centerX = polygonPoints.reduce((sum, p) => sum + p.x, 0) / polygonPoints.length;
          const centerY = polygonPoints.reduce((sum, p) => sum + p.y, 0) / polygonPoints.length;
          
          const newShape: Shape = {
            id: Date.now().toString(),
            type: 'polygon-pen',
            x: centerX,
            y: centerY,
            color,
            strokeColor,
            strokeWidth,
            rotation: 0,
            points: polygonPoints,
            closed: true,
          };
          
          setPages((prev) => {
            const newPages = [...prev];
            const newLayers = [...newPages[currentPageIndex].layers];
            const newShapes = [...newLayers[currentLayerIndex].shapes];
            newShapes.push(newShape);
            newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], shapes: newShapes };
            newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
            return newPages;
          });
          
          setIsDrawingPolygon(false);
          setPolygonPoints([]);
          setCurrentVectorPoint(null);
          saveToHistory();
        } else {
          // Add point to polygon
          setPolygonPoints([...polygonPoints, { x, y }]);
        }
      }
      return;
    }

    if (tool === 'text') {
      // Check if clicking on existing text to edit
      const clickedText = currentLayer.shapes.find((shape) => {
        if (shape.type !== 'text') return false;
        const dx = x - shape.x;
        const dy = y - shape.y;
        // Simple hit detection for text
        return Math.abs(dx) < 100 && Math.abs(dy) < 20;
      });
      
      if (clickedText) {
        setSelectedShapeId(clickedText.id);
        setIsEditingText(true);
        setEditingTextId(clickedText.id);
        setTextContent(clickedText.text || 'Text');
        setFontSize(clickedText.fontSize || 24);
        setFontFamily(clickedText.fontFamily || 'Inter');
        setFontWeight(clickedText.fontWeight || '400');
        setFontStyle(clickedText.fontStyle || 'normal');
        setTextAlign(clickedText.textAlign || 'left');
      } else {
        // Create new text
        const newText: Shape = {
          id: Date.now().toString(),
          type: 'text',
          x,
          y,
          color,
          strokeColor,
          strokeWidth,
          rotation: 0,
          text: textContent,
          fontSize,
          fontFamily,
          fontWeight,
          fontStyle,
          textAlign,
        };
        
        setPages((prev) => {
          const newPages = [...prev];
          const newLayers = [...newPages[currentPageIndex].layers];
          const newShapes = [...newLayers[currentLayerIndex].shapes];
          newShapes.push(newText);
          newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], shapes: newShapes };
          newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
          return newPages;
        });
        
        setSelectedShapeId(newText.id);
        setIsEditingText(true);
        setEditingTextId(newText.id);
        saveToHistory();
      }
      return;
    }

    if (tool === 'fill') {
      // Find clicked shape and fill it with current color
      const clickedShapeIndex = currentLayer.shapes.findIndex((shape) => {
        const dx = x - shape.x;
        const dy = y - shape.y;
        
        if (shape.type === 'rectangle' || shape.type === 'ellipse' || shape.type === 'triangle') {
          return Math.abs(dx) < shape.width! / 2 && Math.abs(dy) < shape.height! / 2;
        } else if (shape.type === 'circle' || shape.type === 'polygon' || shape.type === 'star') {
          return Math.sqrt(dx * dx + dy * dy) < (shape.radius || 50);
        } else if (shape.type === 'polygon-pen') {
          // Check bounds for polygon-pen shapes
          if (shape.points && shape.points.length > 0) {
            const minX = Math.min(...shape.points.map(p => p.x));
            const maxX = Math.max(...shape.points.map(p => p.x));
            const minY = Math.min(...shape.points.map(p => p.y));
            const maxY = Math.max(...shape.points.map(p => p.y));
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
          }
        } else if (shape.type === 'vector-pen') {
          // Check bounds for vector-pen shapes
          if (shape.bezierPoints && shape.bezierPoints.length > 0) {
            const minX = Math.min(...shape.bezierPoints.map(p => p.x));
            const maxX = Math.max(...shape.bezierPoints.map(p => p.x));
            const minY = Math.min(...shape.bezierPoints.map(p => p.y));
            const maxY = Math.max(...shape.bezierPoints.map(p => p.y));
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
          }
        } else if (shape.type === 'path' || shape.type === 'brush' || shape.type === 'pen') {
          // Simple bounds check for other paths
          if (shape.points && shape.points.length > 0) {
            const minX = Math.min(...shape.points.map(p => p.x));
            const maxX = Math.max(...shape.points.map(p => p.x));
            const minY = Math.min(...shape.points.map(p => p.y));
            const maxY = Math.max(...shape.points.map(p => p.y));
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
          }
        }
        return false;
      });
      
      if (clickedShapeIndex !== -1) {
        setPages((prev) => {
          const newPages = [...prev];
          const newLayers = [...newPages[currentPageIndex].layers];
          const newShapes = [...newLayers[currentLayerIndex].shapes];
          newShapes[clickedShapeIndex] = {
            ...newShapes[clickedShapeIndex],
            color: color,
          };
          newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], shapes: newShapes };
          newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
          return newPages;
        });
        saveToHistory();
      }
      return;
    }

    if (tool === 'eyedropper') {
      const clickedShape = currentLayer.shapes.find((shape) => {
        const dx = x - shape.x;
        const dy = y - shape.y;
        
        if (shape.type === 'rectangle' || shape.type === 'ellipse' || shape.type === 'triangle') {
          return Math.abs(dx) < shape.width! / 2 && Math.abs(dy) < shape.height! / 2;
        } else if (shape.type === 'circle' || shape.type === 'polygon' || shape.type === 'star') {
          return Math.sqrt(dx * dx + dy * dy) < (shape.radius || 50);
        }
        return false;
      });
      
      if (clickedShape) {
        setColor(clickedShape.color);
        if (clickedShape.strokeColor) setStrokeColor(clickedShape.strokeColor);
        if (clickedShape.strokeWidth) setStrokeWidth(clickedShape.strokeWidth);
        setTool('select');
      }
      return;
    }

    if (tool === 'select' || tool === 'direct-select') {
      const selectedShape = getSelectedShape();
      
      if (selectedShape && selectedShape.type !== 'brush' && selectedShape.type !== 'custom-brush' && selectedShape.type !== 'pen') {
        const handle = getResizeHandle(x, y, selectedShape);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStartPos({ x, y });
          return;
        }
      }

      const clickedShape = currentLayer.shapes.find((shape) => {
        const dx = x - shape.x;
        const dy = y - shape.y;
        
        if (shape.type === 'rectangle' || shape.type === 'ellipse' || shape.type === 'triangle') {
          const cos = Math.cos((-shape.rotation * Math.PI) / 180);
          const sin = Math.sin((-shape.rotation * Math.PI) / 180);
          const localX = dx * cos - dy * sin;
          const localY = dx * sin + dy * cos;
          return Math.abs(localX) < shape.width! / 2 && Math.abs(localY) < shape.height! / 2;
        } else if (shape.type === 'circle' || shape.type === 'polygon' || shape.type === 'star') {
          return Math.sqrt(dx * dx + dy * dy) < (shape.radius || 50);
        } else if (shape.type === 'text') {
          return Math.abs(dx) < 100 && Math.abs(dy) < 20;
        }
        return false;
      });
      
      if (clickedShape) {
        setSelectedShapeId(clickedShape.id);
        setIsDragging(true);
        setDragStartPos({ x, y });
        setColor(clickedShape.color);
        setRotation(clickedShape.rotation);
        setCornerRadius(clickedShape.cornerRadius || 0);
        setStrokeColor(clickedShape.strokeColor || '#000000');
        setStrokeWidth(clickedShape.strokeWidth || 2);
        if (clickedShape.effect) setSelectedEffect(clickedShape.effect);
        if (clickedShape.effectIntensity) setEffectIntensity(clickedShape.effectIntensity);
        if (clickedShape.type === 'text') {
          setTextContent(clickedShape.text || 'Text');
          setFontSize(clickedShape.fontSize || 24);
          setFontFamily(clickedShape.fontFamily || 'Inter');
          setFontWeight(clickedShape.fontWeight || '400');
          setFontStyle(clickedShape.fontStyle || 'normal');
          setTextAlign(clickedShape.textAlign || 'left');
        }
      } else {
        setSelectedShapeId(null);
      }
    } else {
      setIsDrawing(true);
      const newShape: Shape = {
        id: Date.now().toString(),
        type: tool as any,
        x,
        y,
        color,
        strokeColor,
        strokeWidth,
        rotation,
        cornerRadius: tool === 'rectangle' ? cornerRadius : undefined,
        points: tool === 'brush' || tool === 'custom-brush' || tool === 'pen' ? [{ x, y }] : undefined,
        effect: selectedEffect,
        effectIntensity,
      };

      if (tool === 'rectangle' || tool === 'ellipse' || tool === 'triangle') {
        newShape.width = 0;
        newShape.height = 0;
      } else if (tool === 'circle') {
        newShape.radius = 0;
      } else if (tool === 'polygon') {
        newShape.radius = 0;
        newShape.sides = 6;
      } else if (tool === 'star') {
        newShape.radius = 0;
        newShape.starPoints = 5;
        newShape.innerRadius = 0;
      }

      setCurrentShape(newShape);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Snap to grid
    if (snapToGrid && tool !== 'vector-pen' && tool !== 'polygon-pen') {
      const gridSize = 20;
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    // Update preview point for vector and polygon pens
    if ((tool === 'vector-pen' && isDrawingVector) || (tool === 'polygon-pen' && isDrawingPolygon)) {
      setCurrentVectorPoint({ x, y });
      drawCanvas();
      return;
    }

    if ((tool === 'select' || tool === 'direct-select') && !isDragging && !isResizing) {
      const selectedShape = getSelectedShape();
      if (selectedShape && selectedShape.type !== 'brush' && selectedShape.type !== 'custom-brush' && selectedShape.type !== 'pen') {
        const handle = getResizeHandle(x, y, selectedShape);
        if (handle) {
          const cursors: Record<string, string> = {
            'nw': 'nwse-resize',
            'ne': 'nesw-resize',
            'sw': 'nesw-resize',
            'se': 'nwse-resize',
            'n': 'ns-resize',
            's': 'ns-resize',
            'e': 'ew-resize',
            'w': 'ew-resize',
          };
          canvas.style.cursor = cursors[handle] || 'default';
          return;
        }
      }
      canvas.style.cursor = 'default';
    }

    if (isResizing && selectedShapeId && resizeHandle) {
      const selectedShape = getSelectedShape();
      if (!selectedShape) return;

      const dx = x - dragStartPos.x;
      const dy = y - dragStartPos.y;

      setPages((prev) => {
        const newPages = [...prev];
        const newLayers = [...newPages[currentPageIndex].layers];
        
        newLayers.forEach((layer) => {
          const shapeIndex = layer.shapes.findIndex((s) => s.id === selectedShapeId);
          if (shapeIndex >= 0) {
            const shape = { ...layer.shapes[shapeIndex] };
            
            if ((shape.type === 'rectangle' || shape.type === 'ellipse' || shape.type === 'triangle') && shape.width && shape.height) {
              const cos = Math.cos((-shape.rotation * Math.PI) / 180);
              const sin = Math.sin((-shape.rotation * Math.PI) / 180);
              const localDx = dx * cos - dy * sin;
              const localDy = dx * sin + dy * cos;

              switch (resizeHandle) {
                case 'se':
                  shape.width = Math.max(10, shape.width + localDx);
                  shape.height = Math.max(10, shape.height + localDy);
                  shape.x += (dx * cos + dy * sin) / 2;
                  shape.y += (-dx * sin + dy * cos) / 2;
                  break;
                case 'sw':
                  shape.width = Math.max(10, shape.width - localDx);
                  shape.height = Math.max(10, shape.height + localDy);
                  shape.x += (dx * cos + dy * sin) / 2;
                  shape.y += (-dx * sin + dy * cos) / 2;
                  break;
                case 'ne':
                  shape.width = Math.max(10, shape.width + localDx);
                  shape.height = Math.max(10, shape.height - localDy);
                  shape.x += (dx * cos + dy * sin) / 2;
                  shape.y += (-dx * sin + dy * cos) / 2;
                  break;
                case 'nw':
                  shape.width = Math.max(10, shape.width - localDx);
                  shape.height = Math.max(10, shape.height - localDy);
                  shape.x += (dx * cos + dy * sin) / 2;
                  shape.y += (-dx * sin + dy * cos) / 2;
                  break;
                case 'e':
                  shape.width = Math.max(10, shape.width + localDx);
                  shape.x += (dx * cos) / 2;
                  shape.y += (-dx * sin) / 2;
                  break;
                case 'w':
                  shape.width = Math.max(10, shape.width - localDx);
                  shape.x += (dx * cos) / 2;
                  shape.y += (-dx * sin) / 2;
                  break;
                case 's':
                  shape.height = Math.max(10, shape.height + localDy);
                  shape.x += (dy * sin) / 2;
                  shape.y += (dy * cos) / 2;
                  break;
                case 'n':
                  shape.height = Math.max(10, shape.height - localDy);
                  shape.x += (dy * sin) / 2;
                  shape.y += (dy * cos) / 2;
                  break;
              }
            } else if ((shape.type === 'circle' || shape.type === 'polygon' || shape.type === 'star') && shape.radius) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              shape.radius = Math.max(5, shape.radius + distance * (resizeHandle.includes('n') || resizeHandle.includes('w') ? -0.5 : 0.5));
              if (shape.type === 'star') {
                shape.innerRadius = shape.radius / 2;
              }
            }

            const newShapes = [...layer.shapes];
            newShapes[shapeIndex] = shape;
            layer.shapes = newShapes;
          }
        });
        
        newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
        return newPages;
      });

      setDragStartPos({ x, y });
      return;
    }

    if (isDragging && selectedShapeId) {
      const dx = x - dragStartPos.x;
      const dy = y - dragStartPos.y;

      setPages((prev) => {
        const newPages = [...prev];
        const newLayers = [...newPages[currentPageIndex].layers];
        
        newLayers.forEach((layer) => {
          const shapeIndex = layer.shapes.findIndex((s) => s.id === selectedShapeId);
          if (shapeIndex >= 0) {
            const newShapes = [...layer.shapes];
            newShapes[shapeIndex] = {
              ...newShapes[shapeIndex],
              x: newShapes[shapeIndex].x + dx,
              y: newShapes[shapeIndex].y + dy,
            };
            layer.shapes = newShapes;
          }
        });
        
        newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
        return newPages;
      });

      setDragStartPos({ x, y });
      return;
    }

    if (!isDrawing || !currentShape) return;

    if ((currentShape.type === 'brush' || currentShape.type === 'custom-brush' || currentShape.type === 'pen') && currentShape.points) {
      setCurrentShape({
        ...currentShape,
        points: [...currentShape.points, { x, y }],
      });
      
      setPages((prev) => {
        const newPages = [...prev];
        const newLayers = [...newPages[currentPageIndex].layers];
        const newShapes = [...newLayers[currentLayerIndex].shapes];
        const shapeIndex = newShapes.findIndex((s) => s.id === currentShape.id);
        
        if (shapeIndex >= 0) {
          newShapes[shapeIndex] = {
            ...currentShape,
            points: [...currentShape.points, { x, y }],
          };
        } else {
          newShapes.push({
            ...currentShape,
            points: [...currentShape.points, { x, y }],
          });
        }
        
        newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], shapes: newShapes };
        newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
        return newPages;
      });
    } else if (currentShape.type === 'rectangle' || currentShape.type === 'ellipse' || currentShape.type === 'triangle') {
      const width = Math.abs(x - currentShape.x);
      const height = Math.abs(y - currentShape.y);
      setCurrentShape({
        ...currentShape,
        x: currentShape.x + (x > currentShape.x ? width / 2 : -width / 2),
        y: currentShape.y + (y > currentShape.y ? height / 2 : -height / 2),
        width,
        height,
      });
    } else if (currentShape.type === 'circle' || currentShape.type === 'polygon' || currentShape.type === 'star') {
      const dx = x - currentShape.x;
      const dy = y - currentShape.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      setCurrentShape({ 
        ...currentShape, 
        radius,
        innerRadius: currentShape.type === 'star' ? radius / 2 : undefined,
      });
    }

    drawCanvas();
    
    if (currentShape.type !== 'brush' && currentShape.type !== 'custom-brush' && currentShape.type !== 'pen') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawShape(ctx, currentShape, false);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentShape) {
      if (
        ((currentShape.type === 'rectangle' || currentShape.type === 'ellipse' || currentShape.type === 'triangle') && currentShape.width && currentShape.height) ||
        ((currentShape.type === 'circle' || currentShape.type === 'polygon' || currentShape.type === 'star') && currentShape.radius && currentShape.radius > 5) ||
        ((currentShape.type === 'brush' || currentShape.type === 'pen') && currentShape.points && currentShape.points.length > 1) ||
        (currentShape.type === 'custom-brush' && currentShape.points && currentShape.points.length > 1)
      ) {
        setPages((prev) => {
          const newPages = [...prev];
          const newLayers = [...newPages[currentPageIndex].layers];
          const newShapes = [...newLayers[currentLayerIndex].shapes];
          
          const existingIndex = newShapes.findIndex((s) => s.id === currentShape.id);
          if (existingIndex >= 0) {
            newShapes[existingIndex] = currentShape;
          } else {
            newShapes.push(currentShape);
          }
          
          newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], shapes: newShapes };
          newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
          return newPages;
        });
        saveToHistory();
      }
    }
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setCurrentShape(null);
  };

  const addLayer = () => {
    setPages((prev) => {
      const newPages = [...prev];
      const newLayers = [
        ...newPages[currentPageIndex].layers,
        {
          id: Date.now().toString(),
          name: `Layer ${newPages[currentPageIndex].layers.length + 1}`,
          visible: true,
          locked: false,
          opacity: 100,
          blendMode: 'normal' as BlendMode,
          shapes: [],
        },
      ];
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
      return newPages;
    });
    saveToHistory();
  };

  const addPage = () => {
    setPages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: `Artboard ${prev.length + 1}`,
        layers: [
          {
            id: Date.now().toString(),
            name: 'Layer 1',
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
            shapes: [],
          },
        ],
      },
    ]);
    saveToHistory();
  };

  const toggleLayerVisibility = (layerIndex: number) => {
    setPages((prev) => {
      const newPages = [...prev];
      const newLayers = [...newPages[currentPageIndex].layers];
      newLayers[layerIndex] = {
        ...newLayers[layerIndex],
        visible: !newLayers[layerIndex].visible,
      };
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
      return newPages;
    });
  };

  const toggleLayerLock = (layerIndex: number) => {
    setPages((prev) => {
      const newPages = [...prev];
      const newLayers = [...newPages[currentPageIndex].layers];
      newLayers[layerIndex] = {
        ...newLayers[layerIndex],
        locked: !newLayers[layerIndex].locked,
      };
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
      return newPages;
    });
  };

  const updateSelectedShapeProperty = (property: string, value: any) => {
    if (!selectedShapeId) return;

    setPages((prev) => {
      const newPages = [...prev];
      const newLayers = [...newPages[currentPageIndex].layers];
      
      newLayers.forEach((layer) => {
        const shapeIndex = layer.shapes.findIndex((s) => s.id === selectedShapeId);
        if (shapeIndex >= 0) {
          const newShapes = [...layer.shapes];
          newShapes[shapeIndex] = { ...newShapes[shapeIndex], [property]: value };
          layer.shapes = newShapes;
        }
      });
      
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
      return newPages;
    });
  };

  const deleteSelectedShape = () => {
    if (!selectedShapeId) return;
    
    setPages((prev) => {
      const newPages = [...prev];
      const newLayers = [...newPages[currentPageIndex].layers];
      
      newLayers.forEach((layer) => {
        layer.shapes = layer.shapes.filter((s) => s.id !== selectedShapeId);
      });
      
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
      return newPages;
    });
    
    setSelectedShapeId(null);
    saveToHistory();
  };

  const duplicateSelectedShape = () => {
    const selectedShape = getSelectedShape();
    if (!selectedShape) return;

    const newShape = {
      ...selectedShape,
      id: Date.now().toString(),
      x: selectedShape.x + 20,
      y: selectedShape.y + 20,
    };

    setPages((prev) => {
      const newPages = [...prev];
      const newLayers = [...newPages[currentPageIndex].layers];
      const newShapes = [...newLayers[currentLayerIndex].shapes];
      newShapes.push(newShape);
      newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], shapes: newShapes };
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
      return newPages;
    });

    setSelectedShapeId(newShape.id);
    saveToHistory();
  };

  const alignShapes = (direction: string) => {
    if (!selectedShapeId) return;
    const selectedShape = getSelectedShape();
    if (!selectedShape) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let newX = selectedShape.x;
    let newY = selectedShape.y;

    switch (direction) {
      case 'left':
        newX = (selectedShape.width || 0) / 2;
        break;
      case 'center-h':
        newX = canvas.width / 2;
        break;
      case 'right':
        newX = canvas.width - (selectedShape.width || 0) / 2;
        break;
      case 'top':
        newY = (selectedShape.height || 0) / 2;
        break;
      case 'center-v':
        newY = canvas.height / 2;
        break;
      case 'bottom':
        newY = canvas.height - (selectedShape.height || 0) / 2;
        break;
    }

    updateSelectedShapeProperty('x', newX);
    updateSelectedShapeProperty('y', newY);
    saveToHistory();
  };

  const flipShape = (direction: 'horizontal' | 'vertical') => {
    if (!selectedShapeId) return;
    const selectedShape = getSelectedShape();
    if (!selectedShape) return;

    if (direction === 'horizontal') {
      updateSelectedShapeProperty('rotation', (360 - selectedShape.rotation) % 360);
    } else {
      updateSelectedShapeProperty('rotation', (180 - selectedShape.rotation) % 360);
    }
    saveToHistory();
  };

  const bringToFront = () => {
    if (!selectedShapeId) return;
    
    setPages((prev) => {
      const newPages = [...prev];
      const newLayers = [...newPages[currentPageIndex].layers];
      
      newLayers.forEach((layer) => {
        const shapeIndex = layer.shapes.findIndex((s) => s.id === selectedShapeId);
        if (shapeIndex >= 0) {
          const shape = layer.shapes[shapeIndex];
          layer.shapes.splice(shapeIndex, 1);
          layer.shapes.push(shape);
        }
      });
      
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
      return newPages;
    });
    saveToHistory();
  };

  const sendToBack = () => {
    if (!selectedShapeId) return;
    
    setPages((prev) => {
      const newPages = [...prev];
      const newLayers = [...newPages[currentPageIndex].layers];
      
      newLayers.forEach((layer) => {
        const shapeIndex = layer.shapes.findIndex((s) => s.id === selectedShapeId);
        if (shapeIndex >= 0) {
          const shape = layer.shapes[shapeIndex];
          layer.shapes.splice(shapeIndex, 1);
          layer.shapes.unshift(shape);
        }
      });
      
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], layers: newLayers };
      return newPages;
    });
    saveToHistory();
  };

  const addColorToSwatches = () => {
    if (!colorSwatches.includes(color)) {
      setColorSwatches([...colorSwatches, color]);
    }
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentPage.name}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const togglePageExpanded = (pageId: string) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  return (
    <div 
      className="w-full h-full bg-black flex flex-col" 
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Toolbar */}
      <div className="bg-black border-b border-white/10 h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-white/5 hover:bg-white/10 rounded size-8 flex items-center justify-center transition-all text-white border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <SomaLogo className="w-5 h-5" />
            <span className="text-white/90 text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>graphic designer</span>
            <span className="text-white/40 text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>/ {projectName}</span>
          </div>

          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo2 className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 h-8 flex items-center gap-2 rounded transition-all text-sm border tracking-[-0.84px] ${
              showGrid ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-white/60 border-white/10'
            }`}
            style={{ fontWeight: 300 }}
            title="Toggle Grid"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
            grid
          </button>
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-3 h-8 flex items-center gap-2 rounded transition-all text-sm border tracking-[-0.84px] ${
              snapToGrid ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-white/60 border-white/10'
            }`}
            style={{ fontWeight: 300 }}
            title="Snap to Grid"
          >
            <Magnet className="w-3.5 h-3.5" />
            snap
          </button>

          {/* The Digital Craftsman Logo */}
          <div className="mx-2 px-2 border-l border-white/5">
            <img 
              src={craftsmanLogo} 
              alt="The Digital Craftsman" 
              className="h-3.5 opacity-20 hover:opacity-40 transition-opacity"
            />
          </div>

          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-white/10 hover:bg-white/20 rounded px-3 h-8 flex items-center gap-2 transition-all text-white text-sm tracking-[-0.84px] border border-white/20"
            style={{ fontWeight: 500 }}
          >
            <Save className="w-3.5 h-3.5" />
            save project
          </button>

          <button
            onClick={exportCanvas}
            className="bg-white hover:bg-white/90 rounded px-3 h-8 flex items-center gap-2 transition-all text-black text-sm tracking-[-0.84px]"
            style={{ fontWeight: 500 }}
          >
            <Download className="w-3.5 h-3.5" />
            export
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Layers Panel */}
        <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="search layers"
                className="w-full bg-black/40 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 tracking-[-0.84px]"
                style={{ fontWeight: 300 }}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              <div className="text-white/40 text-xs px-2 py-1.5 flex items-center justify-between tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                <span>artboards</span>
                <button
                  onClick={addPage}
                  className="hover:text-white/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {pages.map((page, pageIndex) => (
                <div key={page.id} className="mb-1">
                  <div
                    className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5 transition-colors ${
                      pageIndex === currentPageIndex ? 'bg-white/10' : ''
                    }`}
                    onClick={() => setCurrentPageIndex(pageIndex)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePageExpanded(page.id);
                      }}
                      className="text-white/60 hover:text-white/90"
                    >
                      {expandedPages.has(page.id) ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <FileText className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-white/90 text-sm flex-1 tracking-[-0.84px]" style={{ fontWeight: 300 }}>{page.name}</span>
                  </div>

                  {expandedPages.has(page.id) && pageIndex === currentPageIndex && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-white/40 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>layers</span>
                        <button
                          onClick={addLayer}
                          className="text-white/40 hover:text-white/80 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {page.layers.map((layer, layerIndex) => (
                        <div
                          key={layer.id}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5 transition-colors ${
                            layerIndex === currentLayerIndex && pageIndex === currentPageIndex
                              ? 'bg-white/20 border border-white/30'
                              : ''
                          }`}
                          onClick={() => setCurrentLayerIndex(layerIndex)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerVisibility(layerIndex);
                            }}
                            className="text-white/60 hover:text-white/90"
                          >
                            {layer.visible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerLock(layerIndex);
                            }}
                            className="text-white/60 hover:text-white/90"
                          >
                            {layer.locked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <Layers className="w-3.5 h-3.5 text-white/60" />
                          <span className="text-white/90 text-sm flex-1 tracking-[-0.84px]" style={{ fontWeight: 300 }}>{layer.name}</span>
                          <span className="text-white/40 text-xs">{layer.shapes.length}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-black flex items-center justify-center p-8 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="bg-white shadow-2xl cursor-crosshair"
          />
          
          {/* Tool Instructions */}
          {(isDrawingVector || isDrawingPolygon) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3">
              <div className="text-white text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>
                {isDrawingVector && (
                  <div className="flex items-center gap-6">
                    <span>click to add points</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">enter to finish</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">esc to cancel</span>
                  </div>
                )}
                {isDrawingPolygon && (
                  <div className="flex items-center gap-6">
                    <span>click to add points</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">click first point to close</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">enter to finish</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">esc to cancel</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="w-80 bg-white/5 border-l border-white/10 flex flex-col">
          <Tabs defaultValue="appearance" className="flex-1 flex flex-col">
            <div className="p-3 border-b border-white/10">
              <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-white/10">
                <TabsTrigger value="appearance" className="text-xs tracking-[-0.72px] data-[state=active]:bg-white/10" style={{ fontWeight: 300 }}>design</TabsTrigger>
                <TabsTrigger value="transform" className="text-xs tracking-[-0.72px] data-[state=active]:bg-white/10" style={{ fontWeight: 300 }}>transform</TabsTrigger>
                <TabsTrigger value="effects" className="text-xs tracking-[-0.72px] data-[state=active]:bg-white/10" style={{ fontWeight: 300 }}>effects</TabsTrigger>
                <TabsTrigger value="swatches" className="text-xs tracking-[-0.72px] data-[state=active]:bg-white/10" style={{ fontWeight: 300 }}>colors</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              {/* Appearance Tab */}
              <TabsContent value="appearance" className="p-3 space-y-4 mt-0">
                {selectedShapeId ? (
                  <>
                    {/* Fill */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-white/60 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>fill</label>
                        <button
                          onClick={() => setShowFill(!showFill)}
                          className={`px-2 py-0.5 rounded text-xs border transition-colors tracking-[-0.72px] ${
                            showFill ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/40 border-white/10'
                          }`}
                          style={{ fontWeight: 300 }}
                        >
                          {showFill ? 'on' : 'off'}
                        </button>
                      </div>
                      {showFill && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                setColor(e.target.value);
                                if (selectedShapeId) {
                                  updateSelectedShapeProperty('color', e.target.value);
                                }
                              }}
                              className="w-10 h-10 rounded border border-white/10 bg-black/20 cursor-pointer"
                            />
                            <Input
                              value={color}
                              onChange={(e) => {
                                setColor(e.target.value);
                                if (selectedShapeId) {
                                  updateSelectedShapeProperty('color', e.target.value);
                                }
                              }}
                              className="flex-1 bg-black/40 border-white/10 text-white text-sm h-10 tracking-[-0.84px]"
                              style={{ fontWeight: 300 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stroke */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-white/60 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>stroke</label>
                        <button
                          onClick={() => setShowStroke(!showStroke)}
                          className={`px-2 py-0.5 rounded text-xs border transition-colors tracking-[-0.72px] ${
                            showStroke ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/40 border-white/10'
                          }`}
                          style={{ fontWeight: 300 }}
                        >
                          {showStroke ? 'on' : 'off'}
                        </button>
                      </div>
                      {showStroke && (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="color"
                              value={strokeColor}
                              onChange={(e) => {
                                setStrokeColor(e.target.value);
                                if (selectedShapeId) {
                                  updateSelectedShapeProperty('strokeColor', e.target.value);
                                }
                              }}
                              className="w-10 h-10 rounded border border-white/10 bg-black/20 cursor-pointer"
                            />
                            <Input
                              value={strokeColor}
                              onChange={(e) => {
                                setStrokeColor(e.target.value);
                                if (selectedShapeId) {
                                  updateSelectedShapeProperty('strokeColor', e.target.value);
                                }
                              }}
                              className="flex-1 bg-black/40 border-white/10 text-white text-sm h-10 tracking-[-0.84px]"
                              style={{ fontWeight: 300 }}
                            />
                          </div>
                          <div>
                            <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>width: {strokeWidth}px</label>
                            <Slider
                              value={[strokeWidth]}
                              onValueChange={(val) => {
                                setStrokeWidth(val[0]);
                                updateSelectedShapeProperty('strokeWidth', val[0]);
                              }}
                              min={1}
                              max={50}
                              step={1}
                              className="mb-2"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Opacity */}
                    <div>
                      <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>opacity: {opacity}%</label>
                      <Slider
                        value={[opacity]}
                        onValueChange={(val) => setOpacity(val[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="mb-2"
                      />
                    </div>

                    {/* Corner Radius */}
                    {currentLayer.shapes.find((s) => s.id === selectedShapeId)?.type === 'rectangle' && (
                      <div>
                        <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>corner radius: {cornerRadius}px</label>
                        <Slider
                          value={[cornerRadius]}
                          onValueChange={(val) => {
                            setCornerRadius(val[0]);
                            updateSelectedShapeProperty('cornerRadius', val[0]);
                          }}
                          min={0}
                          max={100}
                          step={1}
                          className="mb-2"
                        />
                      </div>
                    )}

                    {/* Text Controls */}
                    {currentLayer.shapes.find((s) => s.id === selectedShapeId)?.type === 'text' && (
                      <>
                        <div>
                          <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>text content</label>
                          <Input
                            value={textContent}
                            onChange={(e) => {
                              setTextContent(e.target.value);
                              updateSelectedShapeProperty('text', e.target.value);
                            }}
                            className="bg-black/40 border-white/10 text-white text-sm h-10 tracking-[-0.84px]"
                            style={{ fontWeight: 300 }}
                            placeholder="Enter text"
                          />
                        </div>

                        <div>
                          <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>font family</label>
                          <Select value={fontFamily} onValueChange={(val) => {
                            setFontFamily(val);
                            updateSelectedShapeProperty('fontFamily', val);
                          }}>
                            <SelectTrigger className="border-white/10 bg-black/40 text-white tracking-[-0.84px]" style={{ fontWeight: 300 }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-white/10">
                              <SelectItem value="Inter" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>Inter</SelectItem>
                              <SelectItem value="Arial" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>Arial</SelectItem>
                              <SelectItem value="Helvetica" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>Helvetica</SelectItem>
                              <SelectItem value="Times New Roman" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>Times New Roman</SelectItem>
                              <SelectItem value="Georgia" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>Georgia</SelectItem>
                              <SelectItem value="Courier New" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>Courier New</SelectItem>
                              <SelectItem value="monospace" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>Monospace</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>font size: {fontSize}px</label>
                          <Slider
                            value={[fontSize]}
                            onValueChange={(val) => {
                              setFontSize(val[0]);
                              updateSelectedShapeProperty('fontSize', val[0]);
                            }}
                            min={8}
                            max={200}
                            step={1}
                            className="mb-2"
                          />
                        </div>

                        <div>
                          <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>font weight</label>
                          <Select value={fontWeight} onValueChange={(val) => {
                            setFontWeight(val);
                            updateSelectedShapeProperty('fontWeight', val);
                          }}>
                            <SelectTrigger className="border-white/10 bg-black/40 text-white tracking-[-0.84px]" style={{ fontWeight: 300 }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-white/10">
                              <SelectItem value="300" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>light (300)</SelectItem>
                              <SelectItem value="400" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>regular (400)</SelectItem>
                              <SelectItem value="500" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>medium (500)</SelectItem>
                              <SelectItem value="600" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>semibold (600)</SelectItem>
                              <SelectItem value="700" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>bold (700)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>text align</label>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={() => {
                                setTextAlign('left');
                                updateSelectedShapeProperty('textAlign', 'left');
                              }}
                              className={`p-2 rounded border transition-colors ${
                                textAlign === 'left' ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <AlignLeft className="w-4 h-4 text-white/60 mx-auto" />
                            </button>
                            <button
                              onClick={() => {
                                setTextAlign('center');
                                updateSelectedShapeProperty('textAlign', 'center');
                              }}
                              className={`p-2 rounded border transition-colors ${
                                textAlign === 'center' ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <AlignHorizontalJustifyCenter className="w-4 h-4 text-white/60 mx-auto" />
                            </button>
                            <button
                              onClick={() => {
                                setTextAlign('right');
                                updateSelectedShapeProperty('textAlign', 'right');
                              }}
                              className={`p-2 rounded border transition-colors ${
                                textAlign === 'right' ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <AlignRight className="w-4 h-4 text-white/60 mx-auto" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>font style</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
                                setFontStyle(newStyle);
                                updateSelectedShapeProperty('fontStyle', newStyle);
                              }}
                              className={`px-3 py-2 rounded border transition-colors text-xs tracking-[-0.72px] ${
                                fontStyle === 'italic' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/60'
                              }`}
                              style={{ fontWeight: 300, fontStyle: 'italic' }}
                            >
                              italic
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Blend Mode */}
                    <div>
                      <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>blend mode</label>
                      <Select value={blendMode} onValueChange={(val) => setBlendMode(val as BlendMode)}>
                        <SelectTrigger className="border-white/10 bg-black/40 text-white tracking-[-0.84px]" style={{ fontWeight: 300 }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10">
                          <SelectItem value="normal" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>normal</SelectItem>
                          <SelectItem value="multiply" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>multiply</SelectItem>
                          <SelectItem value="screen" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>screen</SelectItem>
                          <SelectItem value="overlay" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>overlay</SelectItem>
                          <SelectItem value="darken" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>darken</SelectItem>
                          <SelectItem value="lighten" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>lighten</SelectItem>
                          <SelectItem value="color-dodge" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>color dodge</SelectItem>
                          <SelectItem value="color-burn" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>color burn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/40 text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>select a shape to view properties</p>
                  </div>
                )}
              </TabsContent>

              {/* Transform Tab */}
              <TabsContent value="transform" className="p-3 space-y-4 mt-0">
                {selectedShapeId ? (
                  <>
                    {/* Align Tools */}
                    <div>
                      <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>align</label>
                      <div className="grid grid-cols-3 gap-1 mb-3">
                        <button onClick={() => alignShapes('left')} className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors" title="Align Left">
                          <AlignLeft className="w-4 h-4 text-white/60 mx-auto" />
                        </button>
                        <button onClick={() => alignShapes('center-h')} className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors" title="Center Horizontally">
                          <AlignHorizontalJustifyCenter className="w-4 h-4 text-white/60 mx-auto" />
                        </button>
                        <button onClick={() => alignShapes('right')} className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors" title="Align Right">
                          <AlignRight className="w-4 h-4 text-white/60 mx-auto" />
                        </button>
                        <button onClick={() => alignShapes('top')} className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors" title="Align Top">
                          <AlignVerticalJustifyStart className="w-4 h-4 text-white/60 mx-auto" />
                        </button>
                        <button onClick={() => alignShapes('center-v')} className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors" title="Center Vertically">
                          <AlignVerticalJustifyCenter className="w-4 h-4 text-white/60 mx-auto" />
                        </button>
                        <button onClick={() => alignShapes('bottom')} className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors" title="Align Bottom">
                          <AlignVerticalJustifyEnd className="w-4 h-4 text-white/60 mx-auto" />
                        </button>
                      </div>
                    </div>

                    {/* Arrange */}
                    <div>
                      <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>arrange</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={bringToFront} className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                          <ArrowUpToLine className="w-3.5 h-3.5 text-white/60" />
                          front
                        </button>
                        <button onClick={sendToBack} className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                          <ArrowDownToLine className="w-3.5 h-3.5 text-white/60" />
                          back
                        </button>
                      </div>
                    </div>

                    {/* Flip */}
                    <div>
                      <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>flip</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => flipShape('horizontal')} className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                          <FlipHorizontal className="w-3.5 h-3.5 text-white/60" />
                          horizontal
                        </button>
                        <button onClick={() => flipShape('vertical')} className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                          <FlipVertical className="w-3.5 h-3.5 text-white/60" />
                          vertical
                        </button>
                      </div>
                    </div>

                    {/* Position */}
                    <div>
                      <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>position</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-white/40 text-xs mb-1 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>x</label>
                          <Input
                            type="number"
                            value={transformX}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setTransformX(val);
                              updateSelectedShapeProperty('x', val);
                            }}
                            className="bg-black/40 border-white/10 text-white text-sm h-9 tracking-[-0.84px]"
                            style={{ fontWeight: 300 }}
                          />
                        </div>
                        <div>
                          <label className="text-white/40 text-xs mb-1 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>y</label>
                          <Input
                            type="number"
                            value={transformY}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setTransformY(val);
                              updateSelectedShapeProperty('y', val);
                            }}
                            className="bg-black/40 border-white/10 text-white text-sm h-9 tracking-[-0.84px]"
                            style={{ fontWeight: 300 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Size */}
                    {(getSelectedShape()?.width !== undefined || getSelectedShape()?.radius !== undefined) && (
                      <div>
                        <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>size</label>
                        <div className="grid grid-cols-2 gap-2">
                          {getSelectedShape()?.width !== undefined && (
                            <div>
                              <label className="text-white/40 text-xs mb-1 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>w</label>
                              <Input
                                type="number"
                                value={transformW}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setTransformW(val);
                                  updateSelectedShapeProperty('width', val);
                                }}
                                className="bg-black/40 border-white/10 text-white text-sm h-9 tracking-[-0.84px]"
                                style={{ fontWeight: 300 }}
                              />
                            </div>
                          )}
                          {getSelectedShape()?.height !== undefined && (
                            <div>
                              <label className="text-white/40 text-xs mb-1 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>h</label>
                              <Input
                                type="number"
                                value={transformH}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setTransformH(val);
                                  updateSelectedShapeProperty('height', val);
                                }}
                                className="bg-black/40 border-white/10 text-white text-sm h-9 tracking-[-0.84px]"
                                style={{ fontWeight: 300 }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rotation */}
                    <div>
                      <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>rotation: {rotation}°</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[rotation]}
                          onValueChange={(val) => {
                            setRotation(val[0]);
                            updateSelectedShapeProperty('rotation', val[0]);
                          }}
                          min={0}
                          max={360}
                          step={1}
                          className="flex-1"
                        />
                        <button
                          onClick={() => {
                            setRotation(0);
                            updateSelectedShapeProperty('rotation', 0);
                          }}
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-white/60" />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <button
                        onClick={duplicateSelectedShape}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-all border border-white/10 rounded text-sm tracking-[-0.84px]"
                        style={{ fontWeight: 300 }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        duplicate
                      </button>
                      <button
                        onClick={deleteSelectedShape}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-red-500/20 rounded text-sm tracking-[-0.84px]"
                        style={{ fontWeight: 300 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/40 text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>select a shape to transform</p>
                  </div>
                )}
              </TabsContent>

              {/* Effects Tab */}
              <TabsContent value="effects" className="p-3 space-y-4 mt-0">
                {selectedShapeId ? (
                  <>
                    <div>
                      <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>effect type</label>
                      <Select value={selectedEffect} onValueChange={(val) => {
                        setSelectedEffect(val);
                        updateSelectedShapeProperty('effect', val);
                      }}>
                        <SelectTrigger className="border-white/10 bg-black/40 text-white tracking-[-0.84px]" style={{ fontWeight: 300 }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10">
                          <SelectItem value="none" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>none</SelectItem>
                          <SelectItem value="blur" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>blur</SelectItem>
                          <SelectItem value="brightness" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>brightness</SelectItem>
                          <SelectItem value="contrast" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>contrast</SelectItem>
                          <SelectItem value="grayscale" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>grayscale</SelectItem>
                          <SelectItem value="invert" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>invert</SelectItem>
                          <SelectItem value="saturate" className="text-white hover:bg-white/10 tracking-[-0.84px]" style={{ fontWeight: 300 }}>saturate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedEffect !== 'none' && (
                      <div>
                        <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>intensity: {effectIntensity}%</label>
                        <Slider
                          value={[effectIntensity]}
                          onValueChange={(val) => {
                            setEffectIntensity(val[0]);
                            updateSelectedShapeProperty('effectIntensity', val[0]);
                          }}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/40 text-sm tracking-[-0.84px]" style={{ fontWeight: 300 }}>select a shape to add effects</p>
                  </div>
                )}
              </TabsContent>

              {/* Swatches Tab */}
              <TabsContent value="swatches" className="p-3 space-y-4 mt-0">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white/60 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>color swatches</label>
                    <button
                      onClick={addColorToSwatches}
                      className="text-white/40 hover:text-white text-xs tracking-[-0.72px]"
                      style={{ fontWeight: 300 }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {colorSwatches.map((swatch, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setColor(swatch);
                          if (selectedShapeId) {
                            updateSelectedShapeProperty('color', swatch);
                          }
                        }}
                        className="aspect-square rounded border-2 border-white/10 hover:border-white/30 transition-colors"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="text-white/60 text-xs mb-2 block tracking-[-0.72px]" style={{ fontWeight: 300 }}>current color</label>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded border border-white/10" style={{ backgroundColor: color }} />
                    <div className="flex-1">
                      <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="bg-black/40 border-white/10 text-white text-sm h-10 tracking-[-0.84px] mb-2"
                        style={{ fontWeight: 300 }}
                      />
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full h-10 rounded border border-white/10 bg-black/20 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {/* Bottom Toolbar - Tools */}
      <div className="bg-black border-t border-white/10 h-14 flex items-center justify-center px-6">
        <div className="flex items-center gap-2">
          {/* Selection Tools */}
          <button
            onClick={() => setTool('select')}
            className={`${
              tool === 'select'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="move"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTool('direct-select')}
            className={`${
              tool === 'direct-select'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="direct select"
          >
            <CircleDot className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Shape Tools */}
          <button
            onClick={() => setTool('rectangle')}
            className={`${
              tool === 'rectangle'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="rectangle"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTool('circle')}
            className={`${
              tool === 'circle'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="circle"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTool('ellipse')}
            className={`${
              tool === 'ellipse'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="ellipse"
          >
            <Circle className="w-4 h-4" style={{ transform: 'scaleY(0.7)' }} />
          </button>

          <button
            onClick={() => setTool('triangle')}
            className={`${
              tool === 'triangle'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="triangle"
          >
            <Triangle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTool('polygon')}
            className={`${
              tool === 'polygon'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="polygon"
          >
            <Hexagon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTool('star')}
            className={`${
              tool === 'star'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="star"
          >
            <Star className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Drawing Tools */}
          <button
            onClick={() => setTool('pen')}
            className={`${
              tool === 'pen'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="pen"
          >
            <Pen className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setTool('vector-pen');
              setIsDrawingVector(false);
              setVectorPoints([]);
              setCurrentVectorPoint(null);
            }}
            className={`${
              tool === 'vector-pen'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="vector pen (bezier)"
          >
            <Pen className="w-4 h-4" style={{ transform: 'rotate(-15deg)' }} />
          </button>

          <button
            onClick={() => {
              setTool('polygon-pen');
              setIsDrawingPolygon(false);
              setPolygonPoints([]);
              setCurrentVectorPoint(null);
            }}
            className={`${
              tool === 'polygon-pen'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="polygon pen (click points)"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTool('brush')}
            className={`${
              tool === 'brush'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="brush"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTool('eyedropper')}
            className={`${
              tool === 'eyedropper'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="eyedropper"
          >
            <Pipette className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTool('fill')}
            className={`${
              tool === 'fill'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="fill"
          >
            <PaintBucket className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Text Tool */}
          <button
            onClick={() => setTool('text')}
            className={`${
              tool === 'text'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } rounded size-10 flex items-center justify-center transition-all border border-white/10`}
            title="text"
          >
            <Type className="w-4 h-4" />
          </button>

          {customBrushes && customBrushes.length > 0 && (
            <>
              <div className="w-px h-8 bg-white/10 mx-1" />
              {customBrushes.map((brush, idx) => (
                <button
                  key={idx}
                  onClick={() => setTool('custom-brush')}
                  className={`${
                    tool === 'custom-brush'
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  } rounded px-3 h-10 flex items-center gap-2 transition-all border border-white/10 text-xs tracking-[-0.72px]`}
                  style={{ fontWeight: 300 }}
                  title={brush.name}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {brush.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Save Project Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white tracking-[-1.44px]" style={{ fontWeight: 500 }}>
              Save Project
            </DialogTitle>
            <DialogDescription className="text-white/60 tracking-[-0.84px]" style={{ fontWeight: 300 }}>
              Save your work to continue editing later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block tracking-[-0.84px]" style={{ fontWeight: 300 }}>
                project name
              </label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-white/5 border-white/10 text-white tracking-[-0.84px]"
                style={{ fontWeight: 300 }}
                placeholder="Enter project name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSaveDialog(false)}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 tracking-[-0.84px]"
              style={{ fontWeight: 300 }}
            >
              cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              className="bg-white text-black hover:bg-white/90 tracking-[-0.84px]"
              style={{ fontWeight: 500 }}
            >
              save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
