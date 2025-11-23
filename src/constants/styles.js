export const PAPER_SIZES = {
  a4: { name: 'A4', width: 210, height: 297 },
  a3: { name: 'A3', width: 297, height: 420 },
  letter: { name: 'Letter', width: 216, height: 279 }
};

export const FONT_FAMILIES = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Courier', value: '"Courier New", monospace' },
  { name: 'Times', value: '"Times New Roman", serif' },
  { name: 'Inter', value: "'Inter', sans-serif" },
  { name: 'Cursive', value: 'cursive' }
];

// --- MAIN STYLES ---
export const styles = {
  app: { fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4f4f9', color: '#333', overflow: 'hidden' },
  sidebar: { width: '260px', backgroundColor: '#fff', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', zIndex: 20, height: '100%' },
  mobileHeader: { display: 'none', padding: '10px', background: 'white', borderBottom: '1px solid #ddd', alignItems: 'center', justifyContent: 'space-between' },
  sidebarHeader: { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '18px', color: '#2c3e50' },
  nav: { flex: 1, padding: '10px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', cursor: 'pointer', borderRadius: '8px', marginBottom: '5px', fontSize: '14px', fontWeight: 500 },
  navItemActive: { backgroundColor: '#eef2ff', color: '#4f46e5' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  toolbar: { height: '50px', backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between' },
  toolBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  iconBtn: { padding: '6px', borderRadius: '4px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  activeIconBtn: { padding: '6px', borderRadius: '4px', border: '1px solid #4f46e5', background: '#eef2ff', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  workspace: { flex: 1, backgroundColor: '#e5e5f7', backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px)', backgroundSize: '20px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '20px', touchAction: 'none' },
  canvasContainer: { boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: 'white' },
  propertiesPanel: { width: '280px', backgroundColor: '#fff', borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', zIndex: 15 },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 600, color: '#666' },
  input: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' },
  select: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' },
  printPreview: { padding: '40px', overflow: 'auto', height: '100%', backgroundColor: '#525659' },
  sheet: { backgroundColor: 'white', margin: '0 auto', boxShadow: '0 0 10px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' },
  aiBtn: { width: '100%', padding: '10px', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '10px' }



};

// --- GLOBAL PRINT CSS ---
export const printStyles = `
@media print {
  @page { margin: 0; size: auto; }
  
  body * { visibility: hidden; }
  
  /* Unlock layout for printing */
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

  /* Show Print Content */
  #print-scroll-container, #print-scroll-container * {
    visibility: visible !important;
  }

  #print-scroll-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    display: block !important;
    overflow: visible !important;
    height: auto !important;
    z-index: 9999;
  }

  /* Sheets */
  .print-sheet {
    display: block !important;
    position: relative !important;
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
`;