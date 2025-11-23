import React, { useState, useEffect } from 'react';
import { Printer, Settings, Menu } from 'lucide-react';
import { styles, PAPER_SIZES } from './constants/styles';
import { callGemini } from './utils/geminiApi';
import Sidebar from './components/Sidebar';
import DesignWorkspace from './components/DesignWorkspace';
import DataWorkspace from './components/DataWorkspace';
import PrintWorkspace from './components/PrintWorkspace';
import PropertiesPanel from './components/PropertiesPanel';
import { jsPDF } from 'jspdf';

export default function App() {
  const [activeTab, setActiveTab] = useState('design');
  const [labelSize, setLabelSize] = useState({ width: 60, height: 40 });

  const [elements, setElements] = useState([
    { id: 'bg', type: 'rect', x: 0, y: 0, width: 60, height: 40, fill: '#ffffff', stroke: '#dddddd', strokeWidth: 0, isBackground: true },
    { id: 'qr1', type: 'qr', x: 5, y: 5, width: 20, height: 20, text: 'ELIoT-20010' },
    { id: 'txt1', type: 'text', x: 30, y: 15, text: 'ELIoT Device', fontSize: 10, fontFamily: 'Arial', fill: '#000000' },
    { id: 'var1', type: 'variable', x: 30, y: 25, text: '{code}', fontSize: 8, fontFamily: 'Courier New', fill: '#333333' }
  ]);

  const [selectedId, setSelectedId] = useState(null);

  const [batchSettings, setBatchSettings] = useState({
    mode: 'sequence', prefix: 'ELIoT-', start: 20010, end: 20025, customList: ''
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
      const newId = crypto.randomUUID();
      setElements(prev => [...prev, {
        id: newId, type: 'text', x: 10, y: 30,
        text: slogan.trim().replace(/"/g, ''),
        fontSize: 8, fontFamily: 'Arial', fill: '#000000'
      }]);
      setSelectedId(newId);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newId = crypto.randomUUID();
      setElements(prev => [...prev, {
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
    const newId = crypto.randomUUID();
    let base = { id: newId, type, x: 10, y: 10 };
    if (type === 'rect') base = { ...base, width: 20, height: 20, fill: 'transparent', stroke: '#000000', strokeWidth: 1 };
    if (type === 'text') base = { ...base, text: 'New Text', fontSize: 10, fontFamily: 'Arial', fill: '#000000' };
    if (type === 'variable') base = { ...base, text: '{code}', fontSize: 10, fontFamily: 'Courier New', fill: '#000000' };
    if (type === 'qr') base = { ...base, width: 20, height: 20, text: 'QR CODE' };
    setElements(prev => [...prev, base]);
    setSelectedId(newId);
    if (isMobile) setIsSidebarOpen(false);
  };

  const updateElement = (id, props) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...props } : el));
  };

  const deleteElement = (id) => {
    const el = elements.find(e => e.id === id);
    if (el && el.isBackground) return;
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedId(null);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [PAPER_SIZES[paperSize].width, PAPER_SIZES[paperSize].height]
    });
  
    // Example: render each text/variable element
    elements.forEach(el => {
      if (el.type === 'text' || el.type === 'variable') {
        doc.setFont(el.fontFamily || 'Arial');
        doc.setFontSize(el.fontSize || 10);
        doc.text(el.text || '', el.x, el.y);
      }
      // You can extend this to draw rects, QR codes, images, etc.
    });
  
    doc.save(`labels_${batchSettings.prefix || 'batch'}.pdf`);
  };
  

  return (
    <div id="app-root" style={{ ...styles.app, flexDirection: 'column' }}>
      <div
        id="mobile-header"
        className="no-print"
        style={{
          display: isMobile ? 'flex' : 'none', padding: '10px', background: 'white',
          borderBottom: '1px solid #ddd', alignItems: 'center', justifyContent: 'space-between'
        }}>
        <button aria-label="Toggle sidebar" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none' }}><Menu /></button>
        <strong>LabelStudio</strong>
        <button aria-label="Toggle properties" onClick={() => setIsPropsOpen(!isPropsOpen)} style={{ background: 'none', border: 'none' }}><Settings /></button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div id="sidebar" className="no-print" style={{ display: isSidebarOpen || !isMobile ? 'block' : 'none' }}>
          <Sidebar
            activeTab={activeTab} setActiveTab={setActiveTab}
            onAddElement={handleAddElement} onUploadImage={handleImageUpload}
            isAiLoading={isAiLoading}
            isMobile={isMobile} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          />
        </div>

        <div style={styles.main}>
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
              <button style={{ ...styles.toolBtn, background: '#4f46e5', color: 'white' }} onClick={handleExportPdf}>
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
            {activeTab === 'data' && (
              <DataWorkspace
                batchSettings={batchSettings} setBatchSettings={setBatchSettings}
                isAiLoading={isAiLoading}
              />
            )}
            {activeTab === 'print' && (
              <PrintWorkspace
                paperSize={PAPER_SIZES[paperSize]}
                labelSize={labelSize}
                elements={elements}
                batchSettings={batchSettings}
              />
            )}
          </div>
        </div>

        <div id="properties-panel" className="no-print" style={{ display: isPropsOpen || !isMobile ? 'block' : 'none' }}>
          <PropertiesPanel
            activeTab={activeTab} selectedId={selectedId} elements={elements}
            onUpdate={updateElement} onDelete={deleteElement}
            labelSize={labelSize} setLabelSize={setLabelSize}
            batchSettings={batchSettings} paperSize={paperSize} setPaperSize={setPaperSize}
            setElements={setElements} onSelect={setSelectedId}
            isMobile={isMobile} isOpen={isPropsOpen} setIsOpen={setIsPropsOpen}
          />
        </div>
      </div>

      {/* --- FIXED MULTI-PAGE PRINT CSS --- */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }

          /* Reset to natural flow */
          html, body, #app-root, #root {
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background: white !important;
          }

          /* Hide UI */
          .no-print, #sidebar, #toolbar, #properties-panel, #mobile-header {
            display: none !important;
          }

          /* Print container in normal flow */
          #print-scroll-container {
            position: static !important;
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            background: white !important;
          }

          /* Each sheet must be a block with page break */
          .print-sheet {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
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
