import React, { useState, useEffect } from 'react';
import { Printer, Settings, Menu } from 'lucide-react';
import { styles, PAPER_SIZES } from './constants/styles';
import { callGemini } from './utils/geminiApi';
import Sidebar from './components/Sidebar';
import DesignWorkspace from './components/DesignWorkspace';
import DataWorkspace from './components/DataWorkspace';
import PrintWorkspace from './components/PrintWorkspace';
import PropertiesPanel from './components/PropertiesPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState('design'); 
  const [labelSize, setLabelSize] = useState({ width: 60, height: 40 }); 
  
  const [elements, setElements] = useState([
    { id: 'bg', type: 'rect', x: 0, y: 0, width: 60, height: 40, fill: '#ffffff', stroke: '#dddddd', strokeWidth: 0, rx: 0, isBackground: true },
    { id: 'qr1', type: 'qr', x: 5, y: 5, width: 20, height: 20, text: 'ABC-20010' },
    { id: 'txt1', type: 'text', x: 30, y: 15, text: 'TEXT', fontSize: 10, fontFamily: 'Arial, sans-serif', fill: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none' },
    { id: 'var1', type: 'variable', x: 30, y: 25, text: '{code}', fontSize: 8, fontFamily: '"Courier New", monospace', fill: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none' }
  ]);
  
  const [selectedId, setSelectedId] = useState(null);
  
  const [batchSettings, setBatchSettings] = useState({
    mode: 'sequence', prefix: 'ABC-', start: 20010, end: 20025, customList: ''
  });

  const [paperSize, setPaperSize] = useState('a4');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isPropsOpen, setIsPropsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) { setIsSidebarOpen(true); setIsPropsOpen(true); } 
      else { setIsSidebarOpen(false); setIsPropsOpen(false); }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleAiSlogan = async () => {
    const topic = prompt("What is this label for?");
    if (!topic) return;
    setIsAiLoading(true);
    const slogan = await callGemini(`Write a 3-word slogan about "${topic}". Return ONLY text.`);
    setIsAiLoading(false);
    if (slogan) {
      const newId = Math.random().toString(36).substr(2, 9);
      setElements([...elements, { id: newId, type: 'text', x: 10, y: 30, text: slogan.trim().replace(/"/g, ''), fontSize: 8, fontFamily: 'Arial', fill: '#000000' }]);
      setSelectedId(newId);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newId = Math.random().toString(36).substr(2, 9);
      setElements([...elements, {
        id: newId, type: 'image', x: 0, y: 0, 
        width: labelSize.width, height: labelSize.height, 
        src: e.target.result, isBackground: false 
      }]);
      setSelectedId(newId);
    };
    reader.readAsDataURL(file);
  };

  const handleAddElement = (type) => {
    if (type === 'ai-slogan') { handleAiSlogan(); return; }
    const newId = Math.random().toString(36).substr(2, 9);
    let base = { id: newId, type, x: 10, y: 10 };
    if (type === 'rect') base = { ...base, width: 20, height: 20, fill: 'transparent', stroke: '#000000', strokeWidth: 1, rx: 0 };
    if (type === 'text') base = { ...base, text: 'New Text', fontSize: 10, fontFamily: 'Arial', fill: '#000000' };
    if (type === 'variable') base = { ...base, text: '{code}', fontSize: 10, fontFamily: 'Courier New', fill: '#000000' };
    if (type === 'qr') base = { ...base, width: 20, height: 20, text: 'QR CODE' };
    setElements([...elements, base]);
    setSelectedId(newId);
    if(isMobile) setIsSidebarOpen(false);
  };

  const updateElement = (id, props) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...props } : el));
  };

  const deleteElement = (id) => {
    const el = elements.find(e => e.id === id);
    if (el && el.isBackground) return; 
    setElements(elements.filter(el => el.id !== id));
    setSelectedId(null);
  };

  return (
    <div id="app-root" style={{...styles.app, flexDirection: 'column'}}>
      
      <div id="mobile-header" className="no-print" style={{ display: isMobile ? 'flex' : 'none', padding: '10px', background: 'white', borderBottom: '1px solid #ddd', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{background:'none', border:'none'}}><Menu /></button>
        <span style={{fontWeight: 'bold'}}>LabelStudio</span>
        <button onClick={() => setIsPropsOpen(!isPropsOpen)} style={{background:'none', border:'none'}}><Settings /></button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        <div id="sidebar" className="no-print" style={{display: isSidebarOpen || !isMobile ? 'block' : 'none'}}>
          <Sidebar 
            activeTab={activeTab} setActiveTab={setActiveTab} 
            onAddElement={handleAddElement} onUploadImage={handleImageUpload} 
            isAiLoading={isAiLoading} 
            isMobile={isMobile} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          />
        </div>

        <div style={{...styles.main, overflow: 'hidden'}}>
          <div id="toolbar" className="no-print" style={styles.toolbar}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>
                {activeTab === 'design' ? 'Editor' : activeTab === 'layers' ? 'Layers' : activeTab === 'data' ? 'Data' : 'Print'}
              </span>
              {activeTab === 'design' && (
                 <div style={{ fontSize: '12px', color: '#666', background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>
                   {labelSize.width}mm x {labelSize.height}mm
                 </div>
              )}
            </div>
            {activeTab === 'print' && (
              <button style={{...styles.toolBtn, background: '#4f46e5', color: 'white'}} onClick={() => window.print()}>
                <Printer size={16} /> Print PDF
              </button>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {(activeTab === 'design' || activeTab === 'layers') && (
              <DesignWorkspace 
                labelSize={labelSize} elements={elements} selectedId={selectedId} 
                onSelect={(id) => setSelectedId(id)} 
                onUpdate={updateElement} onDelete={deleteElement} 
              />
            )}
            {activeTab === 'data' && <DataWorkspace batchSettings={batchSettings} setBatchSettings={setBatchSettings} isAiLoading={isAiLoading} />}
            {activeTab === 'print' && <PrintWorkspace paperSize={PAPER_SIZES[paperSize]} labelSize={labelSize} elements={elements} batchSettings={batchSettings} />}
          </div>
        </div>

        <div id="properties-panel" className="no-print" style={{display: isPropsOpen || !isMobile ? 'block' : 'none'}}>
          <PropertiesPanel 
            activeTab={activeTab} selectedId={selectedId} elements={elements} 
            onUpdate={updateElement} onDelete={deleteElement} 
            labelSize={labelSize} setLabelSize={setLabelSize} 
            batchSettings={batchSettings} paperSize={paperSize} setPaperSize={setPaperSize}
            setElements={setElements} 
            onSelect={setSelectedId} 
            isMobile={isMobile} isOpen={isPropsOpen} setIsOpen={setIsPropsOpen} 
          />
        </div>
      </div>

      <style>{`
        @media print {
          @page { 
            margin: 0; 
            size: auto; 
          }
          
          html, body, #app-root {
            height: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
            display: block !important;
          }

          .no-print, #sidebar, #toolbar, #properties-panel, #mobile-header {
            display: none !important;
          }

          #print-scroll-container {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            visibility: visible !important;
            overflow: visible !important;
          }
          
          #print-scroll-container * {
            visibility: visible !important;
          }

          .print-sheet {
            position: relative !important;
            display: block !important;
            width: 100% !important;
            height: auto !important; 
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          .print-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
