import React, { useState } from 'react';
import { styles } from '../constants/styles';
import { generateBatchData } from '../utils/dataHelpers';
import { QRCodeUtil } from '../utils/qrCode';
import RenderElement from './RenderElement';
import { Scissors, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function PrintWorkspace({ paperSize, labelSize, elements, batchSettings }) {
  const [showCutLines, setShowCutLines] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const data = generateBatchData(batchSettings);
  
  // --- CONSTANTS ---
  const GAP = 2;          // Gap between labels (mm)
  const SAFE_MARGIN = 6;  // Printer safety margin (mm)
  
  // --- GRID CALCULATIONS ---
  const availableWidth = paperSize.width - (SAFE_MARGIN * 2);
  const availableHeight = paperSize.height - (SAFE_MARGIN * 2);
  
  const cols = Math.floor(availableWidth / (labelSize.width + GAP));
  const rows = Math.floor(availableHeight / (labelSize.height + GAP));
  
  const contentWidth = (cols * labelSize.width) + ((cols - 1) * GAP);
  const contentHeight = (rows * labelSize.height) + ((rows - 1) * GAP);
  
  const xOffset = (paperSize.width - contentWidth) / 2;
  const yOffset = (paperSize.height - contentHeight) / 2;

  const itemsPerPage = cols * rows;
  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;

  // --- EXPORT ALL PAGES TO SVG (LASER) ---
  const handleDownloadSVG = () => {
    const pageGap = 10; 
    const totalSvgHeight = (paperSize.height * totalPages) + (pageGap * (totalPages - 1));
    
    // Added Inter font import here so it works in SVG viewers
    let svgBody = `<?xml version="1.0" standalone="no"?>
      <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
      <svg width="${paperSize.width}mm" height="${totalSvgHeight}mm" viewBox="0 0 ${paperSize.width} ${totalSvgHeight}" xmlns="http://www.w3.org/2000/svg" version="1.1">
      <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap');
            .cut-line{fill:none;stroke:#FF0000;stroke-width:0.1;}
            .engrave{fill:#000000;stroke:none;}
            .text{font-family:Arial,sans-serif;}
        </style>
      </defs>`;

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const pageOffsetY = pageIndex * (paperSize.height + pageGap);
      const pageData = data.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);
      
      svgBody += `<g transform="translate(0, ${pageOffsetY})">`;

      pageData.forEach((code, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const posX = xOffset + col * (labelSize.width + GAP);
        const posY = yOffset + row * (labelSize.height + GAP);
        
        svgBody += `<g transform="translate(${posX}, ${posY})">`;

        elements.forEach(el => {
          if (el.type === 'rect') {
            if (el.isBackground) {
                if(showCutLines) svgBody += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" class="cut-line" />`;
            } else {
                svgBody += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" />`;
            }
          }
          else if (el.type === 'text' || el.type === 'variable') {
            const txt = el.type === 'variable' ? code : el.text;
            
            // --- FIX START: Font Styling & Sanitization ---
            const fontFam = (el.fontFamily || 'Arial').replace(/"/g, "'"); // Remove double quotes
            const weight = el.fontWeight || 'normal';
            const style = el.fontStyle || 'normal';
            const decoration = el.textDecoration || 'none';
            // --- FIX END ---

            svgBody += `<text 
                x="${el.x}" y="${el.y}" 
                dy="1em" 
                font-family="${fontFam}" 
                font-size="${el.fontSize}pt" 
                font-weight="${weight}" 
                font-style="${style}" 
                text-decoration="${decoration}"
                fill="${el.fill}" 
                class="text">${escapeXml(txt)}</text>`;
          }
          else if (el.type === 'image') {
             svgBody += `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" preserveAspectRatio="none" />`;
          } else if (el.type === 'qr') {
            const qrText = el.text.includes('{code}') ? el.text.replace('{code}', code) : code;
            const matrix = QRCodeUtil.generate(qrText);
            const size = matrix.length;
            const cellSize = el.width / size;
            const hasLogo = !!el.logo;
            const logoSize = hasLogo ? el.width * 0.22 : 0;
            const logoStart = (el.width - logoSize) / 2;
            const centerIdx = Math.floor(size / 2);
            const safeZoneRad = Math.floor(size * 0.13);
            const safeStart = centerIdx - safeZoneRad;
            const safeEnd = centerIdx + safeZoneRad;
          
            svgBody += `<g transform="translate(${el.x}, ${el.y})">`;
            svgBody += `<rect width="${el.width}" height="${el.height}" fill="white" rx="2" />`;
          
            matrix.forEach((rArr, r) => {
              rArr.forEach((cell, c) => {
                if (!cell) return;
                if (hasLogo && r >= safeStart && r <= safeEnd && c >= safeStart && c <= safeEnd) return;
          
                const cx = c * cellSize;
                const cy = r * cellSize;
                const isFinder = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
          
                if (isFinder) {
                  svgBody += `<rect x="${cx}" y="${cy}" width="${cellSize + 0.1}" height="${cellSize + 0.1}" class="engrave" />`;
                } else {
                  svgBody += `<circle cx="${cx + cellSize / 2}" cy="${cy + cellSize / 2}" r="${cellSize / 2.2}" class="engrave" />`;
                }
              });
            });
          
            if (hasLogo) {
              svgBody += `<rect x="${logoStart}" y="${logoStart}" width="${logoSize}" height="${logoSize}" fill="white" />`;
              svgBody += `<image href="${el.logo}" x="${logoStart}" y="${logoStart}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`;
            }
            svgBody += `</g>`;
          }
        });
        svgBody += `</g>`;
      });
      svgBody += `</g>`;
    }
    svgBody += `</svg>`;
    const blob = new Blob([svgBody], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; 
    link.download = `laser_layout_${batchSettings.prefix}.svg`; 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
  };

  // --- OPTIMIZED PDF EXPORT ---
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const dpi = 150;
      const mmToPx = (mm) => Math.round((mm / 25.4) * dpi);

      const svgStringToPngBlob = async (svgString, pxWidth, pxHeight) => {
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((res, rej) => { 
          img.onload = res; 
          img.onerror = rej; 
          img.src = url; 
        });

        const canvas = document.createElement('canvas');
        canvas.width = pxWidth;
        canvas.height = pxHeight;
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, pxWidth, pxHeight);

        URL.revokeObjectURL(url);

        return await new Promise((res) => {
          canvas.toBlob((b) => res(b), 'image/jpeg', 0.85);
        });
      };

      const pdf = new jsPDF({
        unit: 'mm',
        format: [paperSize.width, paperSize.height],
        compress: true
      });

      const pxW = mmToPx(paperSize.width);
      const pxH = mmToPx(paperSize.height);

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        setExportProgress(Math.round(((pageIndex + 1) / totalPages) * 100));

        const svgStr = buildPageSvg(pageIndex);
        const pngBlob = await svgStringToPngBlob(svgStr, pxW, pxH);

        const dataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(pngBlob);
        });

        if (pageIndex > 0) pdf.addPage([paperSize.width, paperSize.height], 'portrait');
        pdf.addImage(dataUrl, 'JPEG', 0, 0, paperSize.width, paperSize.height, undefined, 'FAST');

        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
    } catch (err) {
      console.error('PDF export failed', err);
      alert('PDF export failed. Check console for details.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // --- SVG BUILDER FOR PDF (With Font Fixes) ---
  const buildPageSvg = (pageIndex) => {
    const pageData = data.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);
    const svgWidth = paperSize.width;
    const svgHeight = paperSize.height;

    // We include the Google Font import here so the Canvas can try to load it
    let svg = `<?xml version="1.0" standalone="no"?>
      <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}" version="1.1">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap');
          .cut-line { fill: none; stroke: #FF0000; stroke-width: 0.1; }
          .engrave { fill: #000000; stroke: none; }
          .text { font-family: Arial, sans-serif; }
        </style>
      </defs>
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="white" />`;

    pageData.forEach((code, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const posX = xOffset + col * (labelSize.width + GAP);
      const posY = yOffset + row * (labelSize.height + GAP);

      svg += `<g transform="translate(${posX}, ${posY})">`;

      elements.forEach(el => {
        if (el.type === 'rect') {
          if (el.isBackground) {
            if (showCutLines) {
              svg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" class="cut-line" />`;
            }
          } else {
            svg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill || 'none'}" stroke="${el.stroke || 'none'}" stroke-width="${el.strokeWidth || 0}" />`;
          }
        } 
        else if (el.type === 'text' || el.type === 'variable') {
          const txt = el.type === 'variable' ? code : el.text;
          
          // --- FIX START: Font Styling & Sanitization ---
          const fontFam = (el.fontFamily || 'Arial').replace(/"/g, "'"); // Remove double quotes
          const weight = el.fontWeight || 'normal';
          const style = el.fontStyle || 'normal';
          const decoration = el.textDecoration || 'none';
          // --- FIX END ---
          
          svg += `<text 
            x="${el.x}" y="${el.y}" 
            dy="1em" 
            font-family="${fontFam}" 
            font-size="${el.fontSize}pt" 
            font-weight="${weight}" 
            font-style="${style}" 
            text-decoration="${decoration}"
            fill="${el.fill || '#000'}" 
            class="text">${escapeXml(txt)}</text>`;
        } 
        else if (el.type === 'image') {
          svg += `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" preserveAspectRatio="none" />`;
        } 
        else if (el.type === 'qr') {
          const qrText = el.text.includes('{code}') ? el.text.replace('{code}', code) : code;
          const matrix = QRCodeUtil.generate(qrText);
          const size = matrix.length;
          const cellSize = el.width / size;
          const hasLogo = !!el.logo;
          const logoSize = hasLogo ? el.width * 0.22 : 0;
          const logoStart = (el.width - logoSize) / 2;
          const centerIdx = Math.floor(size / 2);
          const safeZoneRad = Math.floor(size * 0.13);
          const safeStart = centerIdx - safeZoneRad;
          const safeEnd = centerIdx + safeZoneRad;
          
          svg += `<g transform="translate(${el.x}, ${el.y})">`;
          svg += `<rect width="${el.width}" height="${el.height}" fill="white" rx="2" />`;
          
          matrix.forEach((rArr, r) => {
            rArr.forEach((cell, c) => {
              if (!cell) return;
              if (hasLogo && r >= safeStart && r <= safeEnd && c >= safeStart && c <= safeEnd) return;
              
              const cx = c * cellSize;
              const cy = r * cellSize;
              const isFinder = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
              
              if (isFinder) {
                svg += `<rect x="${cx}" y="${cy}" width="${cellSize + 0.1}" height="${cellSize + 0.1}" class="engrave" />`;
              } else {
                svg += `<circle cx="${cx + cellSize / 2}" cy="${cy + cellSize / 2}" r="${cellSize / 2.2}" class="engrave" />`;
              }
            });
          });
          
          if (hasLogo) {
            svg += `<rect x="${logoStart}" y="${logoStart}" width="${logoSize}" height="${logoSize}" fill="white" />`;
            svg += `<image href="${el.logo}" x="${logoStart}" y="${logoStart}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`;
          }
          svg += `</g>`;
        }
      });

      svg += `</g>`;
    });

    svg += `</svg>`;
    return svg;
  };

  const escapeXml = (unsafe) => {
    return (unsafe || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Loading Progress Bar Popup */}
      {isExporting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            minWidth: '400px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              Exporting PDF...
            </div>
            
            <div style={{ width: '100%' }}>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${exportProgress}%`,
                  height: '100%',
                  backgroundColor: '#4f46e5',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div style={{
                marginTop: '10px',
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {exportProgress}% Complete
              </div>
            </div>

            <div style={{ 
              fontSize: '14px', 
              color: '#9ca3af', 
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Processing page {Math.ceil((exportProgress / 100) * totalPages)} of {totalPages}
              <br />
              <span style={{ fontSize: '12px' }}>Please wait, this may take a moment...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Bar */}
      <div className="no-print" style={{ flexShrink: 0, padding: '15px', background: 'white', borderBottom: '1px solid #ddd', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={handleDownloadPDF} 
          disabled={isExporting}
          style={{
            ...styles.toolBtn, 
            background: isExporting ? '#9ca3af' : '#4f46e5', 
            color: 'white', 
            border: 'none',
            cursor: isExporting ? 'not-allowed' : 'pointer'
          }}
        >
          <Printer size={16} /> {isExporting ? `Exporting ${exportProgress}%` : 'Export PDF'}
        </button>
        <button onClick={handleDownloadSVG} style={{...styles.toolBtn, background: '#be185d', color: 'white', border:'none'}}>
          <Scissors size={16} /> Export SVG (Laser)
        </button>
        <div style={{marginLeft: 'auto', display:'flex', gap:'5px', fontSize:'12px', alignItems:'center'}}>
          <input type="checkbox" checked={showCutLines} onChange={e => setShowCutLines(e.target.checked)} id="cutToggle" />
          <label htmlFor="cutToggle" style={{cursor:'pointer'}}>Show Cut Lines</label>
        </div>
      </div>

      {/* Scrollable Preview Area */}
      <div id="print-scroll-container" style={{ ...styles.printPreview, flex: 1, overflow: 'auto' }}>
        {Array.from({ length: totalPages }).map((_, pageIndex) => (
          <div 
            key={pageIndex} 
            className="print-sheet" 
            style={{ 
              ...styles.sheet, 
              width: `${paperSize.width}mm`, 
              height: `${paperSize.height}mm`, 
              marginBottom: '40px', 
              paddingTop: `${yOffset}mm`,
              paddingLeft: `${xOffset}mm`,
              transformOrigin: 'top left',
              backgroundColor: 'white'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${labelSize.width}mm)`, gridAutoRows: `${labelSize.height}mm`, gap: `${GAP}mm` }}>
              {data.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((code, idx) => (
                 <div key={idx} style={{ width: '100%', height: '100%', position: 'relative' }}>
                   <svg width="100%" height="100%" viewBox={`0 0 ${labelSize.width} ${labelSize.height}`}>
                      {elements.map(el => {
                        let finalEl = { ...el };
                        if (el.type === 'qr') finalEl.text = code;
                        if (el.type === 'variable') finalEl.text = code;
                        
                        if (el.isBackground && showCutLines) {
                          finalEl.stroke = "#FF0000"; 
                          finalEl.strokeWidth = 0.5;
                          finalEl.fill = "none";
                        }

                        return <g key={el.id} transform={`translate(${el.x}, ${el.y})`}><RenderElement element={finalEl} selected={false} /></g>;
                      })}
                   </svg>
                 </div>
              ))}
            </div>
            <div className="no-print" style={{position:'absolute', bottom:5, right:10, fontSize:10, color:'#ccc'}}>Page {pageIndex+1} of {totalPages}</div>
          </div>
        ))}
      </div>
    </div>
  );
}