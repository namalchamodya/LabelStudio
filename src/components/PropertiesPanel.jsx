import React, { useState, useRef } from 'react';
import { styles } from '../constants/styles';
import { X, ArrowDownToLine, ArrowUpToLine, Trash2, Bold, Italic, Underline, Image as ImageIcon, ArrowUp, ArrowDown, Layers, GripVertical } from 'lucide-react';
import { generateBatchData } from '../utils/dataHelpers';

const FONT_FAMILIES = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Courier', value: '"Courier New", monospace' },
  { name: 'Times', value: '"Times New Roman", serif' },
  { name: 'Inter', value: "'Inter', sans-serif" },
  { name: 'Cursive', value: 'cursive' }
];

export default function PropertiesPanel({ 
  activeTab, selectedId, elements, onUpdate, onDelete, 
  labelSize, setLabelSize, batchSettings, paperSize, setPaperSize, 
  setElements, isMobile, isOpen, setIsOpen, onSelect 
}) {
  
  const [rightTab, setRightTab] = useState('props'); // 'props' or 'layers'
  const [draggedLayerIndex, setDraggedLayerIndex] = useState(null);
  const qrLogoInputRef = useRef(null);

  const handleQrLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedId) return;
    const reader = new FileReader();
    reader.onload = (evt) => onUpdate(selectedId, { logo: evt.target.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- DRAG & DROP LOGIC ---
  const handleDragStart = (e, index) => {
    setDraggedLayerIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedLayerIndex === null || draggedLayerIndex === targetIndex) return;

    // Because the list is displayed in REVERSE (Top layer first), we calculate real indices
    const realSourceIndex = elements.length - 1 - draggedLayerIndex;
    const realTargetIndex = elements.length - 1 - targetIndex;

    const newElements = [...elements];
    const [movedItem] = newElements.splice(realSourceIndex, 1);
    newElements.splice(realTargetIndex, 0, movedItem);
    
    setElements(newElements);
    setDraggedLayerIndex(null);
  };

  const moveLayerBtn = (id, dir) => {
    const idx = elements.findIndex(e => e.id === id);
    if (idx < 0) return;
    const newElements = [...elements];
    const [item] = newElements.splice(idx, 1);
    
    if (dir === 'back') newElements.splice(1, 0, item); // Keep BG at 0
    else if (dir === 'front') newElements.push(item);
    
    setElements(newElements);
  };

  const panelStyle = isMobile 
    ? { ...styles.propertiesPanel, position: 'absolute', right: isOpen ? 0 : '-290px', height: '100%', transition: 'right 0.3s ease', boxShadow: isOpen ? '-5px 0 15px rgba(0,0,0,0.1)' : 'none' }
    : styles.propertiesPanel;

  const el = elements.find(e => e.id === selectedId);

  // --- RENDER: DATA TAB ---
  if (activeTab === 'data') {
    return (
      <div style={panelStyle}>
        <div style={{padding:'20px'}}>
          <div style={styles.label}>Preview Data</div>
          <div style={{ marginTop: '10px', maxHeight: '500px', overflowY: 'auto', fontSize:'12px' }}>
            {generateBatchData(batchSettings).slice(0, 50).map((val, i) => (<div key={i} style={{ padding: '4px', borderBottom: '1px solid #eee' }}>{i+1}. {val}</div>))}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: PRINT TAB ---
  if (activeTab === 'print') {
    return (
      <div style={panelStyle}>
        <div style={{padding:'20px'}}>
          <div style={styles.inputGroup}><label style={styles.label}>Paper Size</label><select style={styles.select} value={paperSize} onChange={(e) => setPaperSize(e.target.value)}><option value="a4">A4</option><option value="a3">A3</option><option value="letter">Letter</option></select></div>
        </div>
      </div>
    );
  }

  // --- RENDER: DESIGN TAB ---
  return (
    <div style={{...panelStyle, display: 'flex', flexDirection: 'column'}}>
      {isMobile && (<div style={{display:'flex', justifyContent:'flex-end', padding:'10px'}}><button onClick={() => setIsOpen(false)} style={{background:'none', border:'none'}}><X size={20}/></button></div>)}
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        <button onClick={() => setRightTab('props')} style={{ flex: 1, padding: '10px', background: rightTab === 'props' ? 'white' : '#f9fafb', border: 'none', borderBottom: rightTab === 'props' ? '2px solid #4f46e5' : 'none', fontWeight: 600, cursor: 'pointer' }}>Settings</button>
        <button onClick={() => setRightTab('layers')} style={{ flex: 1, padding: '10px', background: rightTab === 'layers' ? 'white' : '#f9fafb', border: 'none', borderBottom: rightTab === 'layers' ? '2px solid #4f46e5' : 'none', fontWeight: 600, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}><Layers size={14}/> Layers</button>
      </div>

      <div style={{padding:'20px', overflowY:'auto', flex:1}}>
        
        {/* --- LAYERS LIST --- */}
        {rightTab === 'layers' && (
          <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
            {[...elements].reverse().map((layer, visualIndex) => (
              <div 
                key={layer.id}
                draggable={!layer.isBackground}
                onDragStart={(e) => handleDragStart(e, visualIndex)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, visualIndex)}
                onClick={() => onSelect(layer.id)}
                style={{ 
                  padding:'8px', borderRadius:'6px', border: layer.id === selectedId ? '1px solid #4f46e5' : '1px solid #eee', 
                  background: layer.id === selectedId ? '#eef2ff' : 'white', cursor: layer.isBackground ? 'default' : 'grab', 
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  opacity: draggedLayerIndex === visualIndex ? 0.5 : 1
                }}
              >
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <GripVertical size={12} color="#ccc" />
                  <span style={{fontSize:'12px', fontWeight:500}}>{layer.type.toUpperCase()}</span>
                </div>
                {!layer.isBackground && (
                  <button onClick={(e)=>{e.stopPropagation(); onDelete(layer.id)}} style={{border:'none', background:'transparent', cursor:'pointer'}}><Trash2 size={14} color="#ef4444"/></button>
                )}
              </div>
            ))}
            <div style={{marginTop:'10px', fontSize:'11px', color:'#999', textAlign:'center'}}>Drag to reorder</div>
          </div>
        )}

        {/* --- PROPERTIES --- */}
        {rightTab === 'props' && (
          <>
            {!el ? (
              <div>
                <div style={styles.label}>Canvas Settings</div>
                <div style={styles.inputGroup}><label style={styles.label}>W (mm)</label><input type="number" style={styles.input} value={labelSize.width} onChange={(e) => setLabelSize({...labelSize, width: Number(e.target.value)})} /></div>
                <div style={styles.inputGroup}><label style={styles.label}>H (mm)</label><input type="number" style={styles.input} value={labelSize.height} onChange={(e) => setLabelSize({...labelSize, height: Number(e.target.value)})} /></div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                  <div style={styles.label}>{el.type.toUpperCase()} PROPERTIES</div>
                  <button onClick={() => onDelete(el.id)} style={{ color: 'white', background: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}><Trash2 size={14} /> Delete</button>
                </div>

                {/* Basic Layering Buttons */}
                <div style={{display:'flex', gap:'5px', marginBottom:'15px'}}>
                  <button onClick={()=>moveLayerBtn(el.id, 'back')} style={{ flex:1, padding:'6px', cursor:'pointer', background:'white', border:'1px solid #ddd', borderRadius:'4px', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}><ArrowDownToLine size={14} /> Back</button>
                  <button onClick={()=>moveLayerBtn(el.id, 'front')} style={{ flex:1, padding:'6px', cursor:'pointer', background:'white', border:'1px solid #ddd', borderRadius:'4px', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}><ArrowUpToLine size={14} /> Front</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={styles.inputGroup}><label style={styles.label}>X</label><input type="number" style={styles.input} value={Math.round(el.x)} onChange={(e) => onUpdate(el.id, { x: Number(e.target.value) })} /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Y</label><input type="number" style={styles.input} value={Math.round(el.y)} onChange={(e) => onUpdate(el.id, { y: Number(e.target.value) })} /></div>
                </div>

                {(el.type === 'rect' || el.type === 'qr' || el.type === 'image') && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={styles.inputGroup}><label style={styles.label}>W</label><input type="number" style={styles.input} value={Math.round(el.width)} onChange={(e) => onUpdate(el.id, { width: Number(e.target.value) })} /></div>
                      <div style={styles.inputGroup}><label style={styles.label}>H</label><input type="number" style={styles.input} value={Math.round(el.height)} onChange={(e) => onUpdate(el.id, { height: Number(e.target.value) })} /></div>
                    </div>
                    
                    {/* Add Corner Radius Control for Rectangles */}
                    {el.type === 'rect' && (
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Corner Radius</label>
                        <input 
                          type="range" 
                          min="0" 
                          max={Math.min(el.width, el.height) / 2} 
                          step="0.5"
                          value={el.rx || 0} 
                          onChange={(e) => onUpdate(el.id, { rx: Number(e.target.value) })} 
                          style={{ width: '100%' }}
                        />
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>{(el.rx || 0).toFixed(1)}mm</div>
                      </div>
                    )}
                  </>
                )}

                {/* QR Logo Upload */}
                {el.type === 'qr' && (
                  <div style={{ marginBottom:'15px', padding:'10px', background:'#f8f9fa', borderRadius:'6px', border:'1px solid #e0e0e0' }}>
                    <label style={styles.label}>QR Branding</label>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                      <button style={{...styles.toolBtn, width:'100%', justifyContent:'center', background:'white'}} onClick={() => qrLogoInputRef.current.click()}><ImageIcon size={14}/> {el.logo ? "Change Logo" : "Upload Logo"}</button>
                      {el.logo && <button onClick={() => onUpdate(el.id, { logo: null })} style={{color:'red', border:'none', background:'none'}}><X size={16}/></button>}
                    </div>
                    <input type="file" ref={qrLogoInputRef} style={{display:'none'}} accept="image/*" onChange={handleQrLogoUpload} />
                  </div>
                )}

                {/* Text Styling */}
                {(el.type === 'text' || el.type === 'variable') && (
                  <>
                    <div style={styles.inputGroup}><label style={styles.label}>Text</label><input type="text" style={styles.input} value={el.text} onChange={(e) => onUpdate(el.id, { text: e.target.value })} disabled={el.type === 'variable'} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Font Family</label><select style={styles.select} value={el.fontFamily || 'Arial'} onChange={(e) => onUpdate(el.id, { fontFamily: e.target.value })}>{FONT_FAMILIES.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}</select></div>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                      <button onClick={() => onUpdate(el.id, { fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' })} style={el.fontWeight === 'bold' ? styles.activeIconBtn : styles.iconBtn} title="Bold"><Bold size={16} /></button>
                      <button onClick={() => onUpdate(el.id, { fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' })} style={el.fontStyle === 'italic' ? styles.activeIconBtn : styles.iconBtn} title="Italic"><Italic size={16} /></button>
                      <button onClick={() => onUpdate(el.id, { textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' })} style={el.textDecoration === 'underline' ? styles.activeIconBtn : styles.iconBtn} title="Underline"><Underline size={16} /></button>
                    </div>
                    <div style={styles.inputGroup}><label style={styles.label}>Size (pt)</label><input type="number" step="0.1" style={styles.input} value={Number(el.fontSize).toFixed(1)} onChange={(e) => onUpdate(el.id, { fontSize: Number(e.target.value) })} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Color</label><input type="color" style={{...styles.input, height:'30px'}} value={el.fill} onChange={(e) => onUpdate(el.id, { fill: e.target.value })} /></div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}