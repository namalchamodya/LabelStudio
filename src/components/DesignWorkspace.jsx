import React, { useState, useRef } from 'react';
import { styles } from '../constants/styles';
import RenderElement from './RenderElement';
import { Trash2 } from 'lucide-react';

export default function DesignWorkspace({ labelSize, elements, selectedId, onSelect, onUpdate, onDelete }) {
  const [dragInfo, setDragInfo] = useState(null);
  const svgRef = useRef(null);
  const ZOOM = 4; 
  const widthPx = labelSize.width * ZOOM;
  const heightPx = labelSize.height * ZOOM;

  // Unified Handler for Mouse and Touch
  const handlePointerDown = (e, id, mode, handleType = null) => {
    e.stopPropagation(); 
    e.preventDefault(); 
    e.target.setPointerCapture(e.pointerId); 
    
    const el = elements.find(x => x.id === id);
    if (!el) return;

    onSelect(id); // Select immediately
    
    setDragInfo({
      mode, 
      handleType,
      id,
      startX: e.clientX,
      startY: e.clientY,
      initial: { ...el }
    });
  };

  const handlePointerMove = (e) => {
    if (!dragInfo) return;
    
    const dx = (e.clientX - dragInfo.startX) / ZOOM;
    const dy = (e.clientY - dragInfo.startY) / ZOOM;
    const { initial } = dragInfo;

    if (dragInfo.mode === 'move') {
      onUpdate(dragInfo.id, { x: initial.x + dx, y: initial.y + dy });
    } 
    else if (dragInfo.mode === 'resize') {
      let updates = {};
      if (initial.type === 'text' || initial.type === 'variable') {
         const scaleFactor = 1 + (dx + dy) / 100;
         updates.fontSize = Math.max(4, initial.fontSize * scaleFactor);
      } 
      else {
        if (dragInfo.handleType === 'se') {
          updates.width = Math.max(5, initial.width + dx);
          updates.height = Math.max(5, initial.height + dy);
        }
        if (initial.type === 'qr') updates.height = updates.width; 
      }
      onUpdate(dragInfo.id, updates);
    }
  };

  const handlePointerUp = (e) => {
    if (dragInfo) {
      e.target.releasePointerCapture(e.pointerId);
      setDragInfo(null);
    }
  };

  const selectedEl = elements.find(e => e.id === selectedId);

  return (
    <div 
      style={{...styles.workspace, touchAction: 'none'}} 
      onPointerMove={handlePointerMove} 
      onPointerUp={handlePointerUp}
      onPointerDown={(e) => {
        if(e.target === e.currentTarget) onSelect(null);
      }}
    >
      <div style={{ position: 'relative' }}>
        
        {/* Floating Delete Button */}
        {selectedEl && !selectedEl.isBackground && (
          <div style={{ position: 'absolute', top: -45, right: 0, zIndex: 100 }}>
            <button 
              onClick={() => onDelete(selectedEl.id)}
              style={{ 
                background: '#ef4444', color: 'white', border: 'none', 
                borderRadius: '4px', padding: '8px 12px', display: 'flex', 
                alignItems: 'center', gap: '5px', cursor: 'pointer', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontWeight: 'bold'
              }}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}

        <div style={{ width: widthPx, height: heightPx, ...styles.canvasContainer, outline: '1px dashed #ccc' }}>
          <svg 
            ref={svgRef}
            width={widthPx} 
            height={heightPx} 
            viewBox={`0 0 ${labelSize.width} ${labelSize.height}`}
            style={{ display: 'block' }}
            onPointerDown={(e) => { if(e.target.tagName === 'svg') onSelect(null); }}
          >
            {elements.map(el => (
              <g 
                key={el.id} 
                transform={`translate(${el.x}, ${el.y})`}
                onPointerDown={(e) => handlePointerDown(e, el.id, 'move')}
                style={{ cursor: 'move' }}
              >
                <RenderElement element={el} selected={selectedId === el.id} />
              </g>
            ))}

            {selectedEl && !selectedEl.isBackground && (
              <g transform={`translate(${selectedEl.x}, ${selectedEl.y})`}>
                { (selectedEl.type !== 'text' && selectedEl.type !== 'variable') ? (
                   <rect 
                     x={selectedEl.width - 5} y={selectedEl.height - 5} 
                     width={10} height={10} 
                     fill="#4f46e5" stroke="white" strokeWidth={2}
                     style={{ cursor: 'nwse-resize' }}
                     onPointerDown={(e) => handlePointerDown(e, selectedEl.id, 'resize', 'se')}
                   />
                ) : (
                   <circle 
                     cx={selectedEl.width ? selectedEl.width + 5 : 20} cy={0} r={5} 
                     fill="#4f46e5" stroke="white" strokeWidth={2}
                     style={{ cursor: 'ew-resize' }}
                     onPointerDown={(e) => handlePointerDown(e, selectedEl.id, 'resize', 'se')} 
                   />
                )}
              </g>
            )}
          </svg>
        </div>
        <div style={{ position: 'absolute', top: -25, left: 0, fontSize: '12px', color: '#888' }}>{labelSize.width}mm</div>
        <div style={{ position: 'absolute', top: heightPx/2, left: -35, fontSize: '12px', color: '#888', transform: 'rotate(-90deg)' }}>{labelSize.height}mm</div>
      </div>
    </div>
  );
}