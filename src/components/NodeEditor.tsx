import { useState, useRef, useCallback } from 'react';
import { X, Plus, Save, Palette, Grid, Image, Triangle, Box, Brush, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { SomaLogo } from './SomaLogo';

interface Node {
  id: string;
  type: 'pattern' | 'colour' | 'texture' | 'vector' | 'polygon' | 'brush';
  position: { x: number; y: number };
  data: any;
}

interface Connection {
  from: string;
  to: string;
}

interface NodeEditorProps {
  onClose: () => void;
  onSaveBrush: (brush: any) => void;
}

export function NodeEditor({ onClose, onSaveBrush }: NodeEditorProps) {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'brush-1',
      type: 'brush',
      position: { x: 600, y: 300 },
      data: { size: 50, opacity: 100, name: 'Custom Brush' }
    }
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const nodeTypes = [
    { type: 'pattern', icon: Grid, label: 'Pattern', color: 'bg-white/10' },
    { type: 'colour', icon: Palette, label: 'Colour', color: 'bg-white/10' },
    { type: 'texture', icon: Image, label: 'Texture', color: 'bg-white/10' },
    { type: 'vector', icon: Triangle, label: 'Vector', color: 'bg-white/10' },
    { type: 'polygon', icon: Box, label: 'Polygon', color: 'bg-white/10' },
  ];

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      position: { x: 100, y: 100 + nodes.length * 50 },
      data: getDefaultNodeData(type)
    };
    setNodes([...nodes, newNode]);
  };

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case 'pattern':
        return { pattern: 'dots', spacing: 10 };
      case 'colour':
        return { color: '#00ff99', blend: 'normal' };
      case 'texture':
        return { texture: 'rough', intensity: 50 };
      case 'vector':
        return { shape: 'line', smoothness: 80 };
      case 'polygon':
        return { sides: 6, roundness: 0 };
      default:
        return {};
    }
  };

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDraggingNode(nodeId);
      setSelectedNode(nodeId);
      setDragOffset({
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y
      });
    }
  };

  const handleConnectorMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    
    // Only allow dragging from non-brush nodes (output connectors)
    if (node && node.type !== 'brush') {
      setConnecting(nodeId);
      setTempConnection({ x: e.clientX, y: e.clientY });
    }
  };

  const handleConnectorMouseUp = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (connecting && nodeId !== connecting) {
      const fromNode = nodes.find(n => n.id === connecting);
      const toNode = nodes.find(n => n.id === nodeId);
      
      // Only allow connections TO the brush node
      if (fromNode && toNode && fromNode.type !== 'brush' && toNode.type === 'brush') {
        // Check if connection already exists
        const exists = connections.some(c => c.from === connecting && c.to === nodeId);
        if (!exists) {
          setConnections([...connections, { from: connecting, to: nodeId }]);
        }
      }
    }
    
    setConnecting(null);
    setTempConnection(null);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode && !connecting) {
      setNodes(prev => prev.map(node => 
        node.id === draggingNode
          ? { ...node, position: { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y } }
          : node
      ));
    } else if (connecting) {
      setTempConnection({ x: e.clientX, y: e.clientY });
    }
  }, [draggingNode, connecting, dragOffset]);

  const handleMouseUp = () => {
    setDraggingNode(null);
    setConnecting(null);
    setTempConnection(null);
  };

  const deleteNode = (nodeId: string) => {
    if (nodes.find(n => n.id === nodeId)?.type === 'brush') return;
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  const deleteConnection = (from: string, to: string) => {
    setConnections(connections.filter(c => !(c.from === from && c.to === to)));
  };

  const updateNodeData = (nodeId: string, data: any) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
  };

  const saveBrush = () => {
    const brushNode = nodes.find(n => n.type === 'brush');
    if (!brushNode) return;

    const connectedNodes = connections
      .filter(c => c.to === brushNode.id)
      .map(c => nodes.find(n => n.id === c.from))
      .filter(Boolean);

    const brushData = {
      name: brushNode.data.name,
      size: brushNode.data.size,
      opacity: brushNode.data.opacity,
      nodes: connectedNodes
    };

    onSaveBrush(brushData);
    onClose();
  };

  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.type === type);
    return nodeType?.color || 'from-gray-500/40 to-gray-600/40';
  };

  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.type === type);
    return nodeType?.icon || Box;
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-50" 
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Bar */}
      <div className="h-16 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-lg size-10 flex items-center justify-center p-2 border border-white/10">
            <SomaLogo className="w-full h-full" />
          </div>
          <div>
            <h2 className="text-white tracking-[-1.44px]" style={{ fontWeight: 500 }}>node brush editor</h2>
            <p className="text-white/40 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>create custom brushes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveBrush}
            className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 transition-all border border-white/20 tracking-[-0.96px]"
            style={{ fontWeight: 300 }}
          >
            <Save className="w-4 h-4" />
            save brush
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 transition-all border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100%-4rem)]">
        {/* Left Sidebar - Node Palette */}
        <div className="w-64 bg-white/5 border-r border-white/10 p-4 overflow-y-auto relative z-10">
          <h3 className="text-white mb-4 text-sm tracking-[-0.84px]" style={{ fontWeight: 500 }}>add nodes</h3>
          <div className="space-y-2">
            {nodeTypes.map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${color} hover:bg-white/15 transition-all text-white border border-white/10 tracking-[-0.96px]`}
                style={{ fontWeight: 300 }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm lowercase">{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-white mb-4 text-sm tracking-[-0.84px]" style={{ fontWeight: 500 }}>instructions</h3>
            <div className="text-white/40 text-xs space-y-2 tracking-[-0.72px]" style={{ fontWeight: 300 }}>
              <p>• drag nodes to move them</p>
              <p>• drag from output dot to brush</p>
              <p>• release on brush input to connect</p>
              <p>• configure in node properties</p>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-white/5"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((conn, idx) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.position.x + 200;
              const y1 = fromNode.position.y + 60;
              const x2 = toNode.position.x;
              const y2 = toNode.position.y + 60;

              const midX = (x1 + x2) / 2;

              return (
                <g key={idx}>
                  <path
                    d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                    stroke="#00ff99"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.6"
                  />
                  <circle
                    cx={(x1 + x2) / 2}
                    cy={(y1 + y2) / 2}
                    r="8"
                    fill="#00ff99"
                    className="cursor-pointer pointer-events-auto"
                    onClick={() => deleteConnection(conn.from, conn.to)}
                  >
                    <title>Click to delete connection</title>
                  </circle>
                </g>
              );
            })}
            {tempConnection && connecting && (
              <g>
                <path
                  d={`M ${nodes.find(n => n.id === connecting)?.position.x + 200} ${nodes.find(n => n.id === connecting)?.position.y + 60} L ${tempConnection.x} ${tempConnection.y}`}
                  stroke="#00ff99"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.6"
                />
              </g>
            )}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const Icon = node.type === 'brush' ? Brush : getNodeIcon(node.type);
            const isConnected = connections.some(c => c.from === node.id);
            
            return (
              <div
                key={node.id}
                className={`absolute w-[200px] bg-white/10 border-2 ${
                  selectedNode === node.id ? 'border-white/40' : 'border-white/20'
                } cursor-move`}
                style={{
                  left: node.position.x,
                  top: node.position.y
                }}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
              >
                {/* Node Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/20 bg-white/5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white" />
                    <span className="text-white text-xs lowercase tracking-[-0.72px]" style={{ fontWeight: 300 }}>{node.type}</span>
                  </div>
                  {node.type !== 'brush' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      className="p-1 hover:bg-white/10"
                    >
                      <Trash2 className="w-3 h-3 text-white/40 hover:text-white" />
                    </button>
                  )}
                </div>

                {/* Node Body */}
                <div className="p-3 text-white/80 text-xs">
                  {node.type === 'brush' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>brush name</label>
                        <input
                          type="text"
                          value={node.data.name}
                          onChange={(e) => updateNodeData(node.id, { name: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 px-2 py-1 text-white text-xs tracking-[-0.72px]"
                          style={{ fontWeight: 300 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>size: {node.data.size}px</label>
                        <input
                          type="range"
                          min="1"
                          max="200"
                          value={node.data.size}
                          onChange={(e) => updateNodeData(node.id, { size: parseInt(e.target.value) })}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>opacity: {node.data.opacity}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={node.data.opacity}
                          onChange={(e) => updateNodeData(node.id, { opacity: parseInt(e.target.value) })}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ) : node.type === 'pattern' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>pattern type</label>
                        <select
                          value={node.data.pattern}
                          onChange={(e) => updateNodeData(node.id, { pattern: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 px-2 py-1 text-white text-xs tracking-[-0.72px]"
                          style={{ fontWeight: 300 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="dots">dots</option>
                          <option value="lines">lines</option>
                          <option value="grid">grid</option>
                          <option value="waves">waves</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>spacing: {node.data.spacing}</label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={node.data.spacing}
                          onChange={(e) => updateNodeData(node.id, { spacing: parseInt(e.target.value) })}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ) : node.type === 'colour' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>color</label>
                        <input
                          type="color"
                          value={node.data.color}
                          onChange={(e) => updateNodeData(node.id, { color: e.target.value })}
                          className="w-full h-8 bg-white/10 border border-white/20"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>blend mode</label>
                        <select
                          value={node.data.blend}
                          onChange={(e) => updateNodeData(node.id, { blend: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 px-2 py-1 text-white text-xs tracking-[-0.72px]"
                          style={{ fontWeight: 300 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="normal">normal</option>
                          <option value="multiply">multiply</option>
                          <option value="screen">screen</option>
                          <option value="overlay">overlay</option>
                        </select>
                      </div>
                    </div>
                  ) : node.type === 'texture' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>texture type</label>
                        <select
                          value={node.data.texture}
                          onChange={(e) => updateNodeData(node.id, { texture: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 px-2 py-1 text-white text-xs tracking-[-0.72px]"
                          style={{ fontWeight: 300 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="rough">rough</option>
                          <option value="smooth">smooth</option>
                          <option value="grain">grain</option>
                          <option value="noise">noise</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>intensity: {node.data.intensity}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={node.data.intensity}
                          onChange={(e) => updateNodeData(node.id, { intensity: parseInt(e.target.value) })}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ) : node.type === 'vector' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>shape</label>
                        <select
                          value={node.data.shape}
                          onChange={(e) => updateNodeData(node.id, { shape: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 px-2 py-1 text-white text-xs tracking-[-0.72px]"
                          style={{ fontWeight: 300 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="line">line</option>
                          <option value="curve">curve</option>
                          <option value="arrow">arrow</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>smoothness: {node.data.smoothness}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={node.data.smoothness}
                          onChange={(e) => updateNodeData(node.id, { smoothness: parseInt(e.target.value) })}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ) : node.type === 'polygon' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>sides: {node.data.sides}</label>
                        <input
                          type="range"
                          min="3"
                          max="12"
                          value={node.data.sides}
                          onChange={(e) => updateNodeData(node.id, { sides: parseInt(e.target.value) })}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <label className="block text-white/40 mb-1 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>roundness: {node.data.roundness}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={node.data.roundness}
                          onChange={(e) => updateNodeData(node.id, { roundness: parseInt(e.target.value) })}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Connectors */}
                {node.type === 'brush' && (
                  <div
                    className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white cursor-pointer node-connector"
                    onMouseUp={(e) => handleConnectorMouseUp(node.id, e)}
                    style={{ boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}
                  >
                    <title>Input</title>
                  </div>
                )}
                {node.type !== 'brush' && (
                  <div
                    className={`absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-white/40'
                    } border-2 border-white cursor-pointer node-connector`}
                    onMouseDown={(e) => handleConnectorMouseDown(node.id, e)}
                    style={{ boxShadow: isConnected ? '0 0 10px rgba(16,185,129,0.5)' : 'none' }}
                  >
                    <title>Output</title>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-white/5 border-l border-white/10 p-4 overflow-y-auto relative z-10">
          <h3 className="text-white mb-4 text-sm tracking-[-0.84px]" style={{ fontWeight: 500 }}>properties</h3>
          {selectedNode ? (
            <div className="space-y-4">
              {(() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (!node) return null;

                return (
                  <div className="bg-white/10 p-4 border border-white/20">
                    <h4 className="text-white mb-3 lowercase tracking-[-0.72px]" style={{ fontWeight: 500 }}>{node.type} node</h4>
                    <div className="text-white/40 text-xs space-y-2 tracking-[-0.72px]" style={{ fontWeight: 300 }}>
                      <p>id: {node.id}</p>
                      <p>position: ({Math.round(node.position.x)}, {Math.round(node.position.y)})</p>
                      <p>connected: {connections.filter(c => c.from === node.id || c.to === node.id).length}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-white/40 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>
              select a node to view properties
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-white mb-4 text-sm tracking-[-0.84px]" style={{ fontWeight: 500 }}>connected nodes</h3>
            <div className="space-y-2">
              {connections.map((conn, idx) => {
                const fromNode = nodes.find(n => n.id === conn.from);
                return (
                  <div
                    key={idx}
                    className="bg-white/10 p-2 border border-white/20 text-xs text-white/80 tracking-[-0.72px]"
                    style={{ fontWeight: 300 }}
                  >
                    {fromNode?.type} → brush
                  </div>
                );
              })}
              {connections.length === 0 && (
                <p className="text-white/40 text-xs tracking-[-0.72px]" style={{ fontWeight: 300 }}>no connections yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}