import React, { useRef } from 'react';
import { styles } from '../constants/styles';
import { 
  Layout, List, Printer, Square, Type, Hash, Sparkles, 
  Image as ImageIcon, X, QrCode, Layers, ExternalLink 
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, setActiveTab, onAddElement, onUploadImage, 
  isAiLoading, isMobile, isOpen, setIsOpen 
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUploadImage(file);
    e.target.value = ''; 
  };

  const sidebarStyle = isMobile 
    ? { 
        ...styles.sidebar, 
        position: 'absolute', 
        left: isOpen ? 0 : '-270px', 
        height: '100%', 
        transition: 'left 0.3s ease',
        boxShadow: isOpen ? '5px 0 15px rgba(0,0,0,0.1)' : 'none'
      }
    : styles.sidebar;

  return (
    <div id="sidebar" className="no-print" style={sidebarStyle}>
      <div style={styles.sidebarHeader}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
        <img src="/favicon.png" alt="LabelStudio" style={{ height: '28px', marginRight: '5px', objectFit: 'contain' }} />
          <span>LabelStudio</span>
        </div>
        {isMobile && <button onClick={() => setIsOpen(false)} style={{background:'none', border:'none'}}><X size={20}/></button>}
      </div>
      
      <div style={styles.nav}>
        <NavItem active={activeTab === 'design'} onClick={() => setActiveTab('design')} icon={<Layout size={18} />} label="Design" />
        <NavItem active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<List size={18} />} label="Data" />
        <NavItem active={activeTab === 'print'} onClick={() => setActiveTab('print')} icon={<Printer size={18} />} label="Print" />
      </div>

      {activeTab === 'design' && (
        <div style={{ padding: '20px', borderTop: '1px solid #eee', flex: 1, overflowY: 'auto' }}>
          <div style={styles.label}>Tools</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <ToolBtn icon={<Square size={16} />} label="Rect" onClick={() => onAddElement('rect')} />
            <ToolBtn icon={<Type size={16} />} label="Text" onClick={() => onAddElement('text')} />
            <ToolBtn icon={<Hash size={16} />} label="Var" onClick={() => onAddElement('variable')} />
            <ToolBtn icon={<QrCode size={16} />} label="QR" onClick={() => onAddElement('qr')} />
            <ToolBtn icon={<ImageIcon size={16} />} label="Image" onClick={() => fileInputRef.current.click()} />
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <div style={styles.label}>AI Tools</div>
            <button style={styles.aiBtn} onClick={() => onAddElement('ai-slogan')} disabled={isAiLoading}>
              <Sparkles size={16} /> {isAiLoading ? '...' : 'Slogan'}
            </button>
          </div>
        </div>
      )}

      {/* --- COPYRIGHT FOOTER --- */}
      <div style={{ marginTop: 'auto', padding: '15px', borderTop: '1px solid #eee', fontSize: '11px', color: '#888', textAlign: 'center', background: '#fafafa' }}>
        <div style={{ marginBottom: '5px' }}>© {new Date().getFullYear()} <strong>Namal Chamodya</strong></div>
        <a href="" target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
           Visit my Website <ExternalLink size={10}/>
        </a>
      </div>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return <div style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }} onClick={onClick}>{icon}<span>{label}</span></div>;
}

function ToolBtn({ icon, label, onClick }) {
  return <button style={styles.toolBtn} onClick={onClick}>{icon}<span>{label}</span></button>;
}