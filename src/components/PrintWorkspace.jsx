import React, { useState } from 'react';
import { styles } from '../constants/styles';
import { generateBatchData } from '../utils/dataHelpers';
import { QRCodeUtil } from '../utils/qrCode';
import RenderElement from './RenderElement';
import { Scissors, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function PrintWorkspace({ paperSize, labelSize, elements, batchSettings }) {
  const [showCutLines, setShowCutLines] = useState(false);

  const data = generateBatchData(batchSettings);

  // Unified spacing constants to keep preview and export identical
  const MARGIN = 10; // mm inner margin for sheet
  const GAP = 2;     // mm gap between labels

  const cols = Math.floor(paperSize.width / (labelSize.width + GAP));
  const rows = Math.floor(paperSize.height / (labelSize.height + GAP));
  const itemsPerPage = cols * rows;
  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;

  // --- EXPORT ALL PAGES TO SVG ---
  const handleDownloadSVG = () => {
    const pageGap = 10; // mm between stacked pages in single SVG
    const totalSvgHeight = (paperSize.height * totalPages) + (pageGap * (totalPages - 1));

    let svgBody = `<?xml version="1.0" standalone="no"?>
      <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
      <svg width="${paperSize.width}mm" height="${totalSvgHeight}mm" viewBox="0 0 ${paperSize.width} ${totalSvgHeight}" xmlns="http://www.w3.org/2000/svg" version="1.1">
      <defs>
        <style>
          .cut-line { fill: none; stroke: #FF0000; stroke-width: 0.1; }
          .engrave { fill: #000000; stroke: none; }
          .text { font-family: Arial, sans-serif; }
        </style>
      </defs>`;

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const pageOffsetY = pageIndex * (paperSize.height + pageGap);
      svgBody += `<g transform="translate(0, ${pageOffsetY})">`;

      const pageData = data.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);

      pageData.forEach((code, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const posX = MARGIN + col * (labelSize.width + GAP);
        const posY = MARGIN + row * (labelSize.height + GAP);

        svgBody += `<g transform="translate(${posX}, ${posY})">`;

        elements.forEach(el => {
          if (el.type === 'rect') {
            if (el.isBackground) {
              svgBody += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" class="cut-line" />`;
            } else {
              svgBody += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" />`;
            }
          } else if (el.type === 'text' || el.type === 'variable') {
            const txt = el.type === 'variable' ? code : el.text;
            const fontWeight = el.fontWeight === 'bold' ? 'bold' : 'normal';
            const fontStyle = el.fontStyle === 'italic' ? 'italic' : 'normal';
            const textDec = el.textDecoration === 'underline' ? 'underline' : 'none';
            svgBody += `<text x="${el.x}" y="${el.y}" dy="1em" font-family="${el.fontFamily || 'Arial'}" font-size="${el.fontSize}pt" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDec}" fill="${el.fill}" class="text">${txt}</text>`;
          } else if (el.type === 'image') {
            svgBody += `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" preserveAspectRatio="none" />`;
          } else if (el.type === 'qr') {
            const qrText = el.text || code;
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

        svgBody += `</g>`; // End Label
      });

      svgBody += `</g>`; // End Page
    }

    svgBody += `</svg>`;

    const blob = new Blob([svgBody], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laser_layout_${batchSettings.prefix}_all.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add this async function inside your component
  const handleDownloadPDF = async () => {
    const pageGap = 10; // not used in PDF pages, only for stacked SVG layout if needed
    const dpi = 300;
    const mmToPx = (mm) => Math.round((mm / 25.4) * dpi); // convert mm -> px at desired DPI

    // helper: build a single-page SVG identical to your sheet rendering
    const buildPageSvg = (pageIndex) => {
      const pageData = data.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);
      const svgWidth = paperSize.width;
      const svgHeight = paperSize.height;

      let svg = `<?xml version="1.0" standalone="no"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
        <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}" version="1.1">
        <defs>
          <style>
            .cut-line { fill: none; stroke: #FF0000; stroke-width: 0.1; }
            .engrave { fill: #000000; stroke: none; }
            .text { font-family: Arial, sans-serif; }
          </style>
        </defs>`;

      // optional page border
      // svg += `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="white" />`;

      pageData.forEach((code, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const posX = MARGIN + col * (labelSize.width + GAP);
        const posY = MARGIN + row * (labelSize.height + GAP);

        svg += `<g transform="translate(${posX}, ${posY})">`;

        elements.forEach(el => {
          if (el.type === 'rect') {
            if (el.isBackground) {
              svg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" class="cut-line" />`;
            } else {
              svg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill || 'none'}" stroke="${el.stroke || 'none'}" stroke-width="${el.strokeWidth || 0}" />`;
            }
          } else if (el.type === 'text' || el.type === 'variable') {
            const txt = el.type === 'variable' ? code : el.text;
            svg += `<text x="${el.x}" y="${el.y}" dy="1em" font-family="${el.fontFamily || 'Arial'}" font-size="${el.fontSize}pt" fill="${el.fill || '#000'}" class="text">${escapeXml(txt)}</text>`;
          } else if (el.type === 'image') {
            svg += `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" preserveAspectRatio="none" />`;
          } else if (el.type === 'qr') {
            const qrText = el.text || code;
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

    // escape helper for text content
    const escapeXml = (unsafe) => {
      return (unsafe || '').toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // convert SVG string to PNG blob at the requested px size
    const svgStringToPngBlob = async (svgString, pxWidth, pxHeight) => {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const imgLoadPromise = new Promise((res, rej) => {
        img.onload = () => res();
        img.onerror = (e) => rej(e);
      });
      img.src = url;
      await imgLoadPromise;

      const canvas = document.createElement('canvas');
      canvas.width = pxWidth;
      canvas.height = pxHeight;
      const ctx = canvas.getContext('2d');
      // Fill white background to avoid transparency
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // cleanup
      URL.revokeObjectURL(url);

      return new Promise((res) => {
        canvas.toBlob((b) => res(b), 'image/png', 1.0);
      });
    };

    try {
      const pdf = new jsPDF({
        unit: 'mm',
        format: [paperSize.width, paperSize.height],
        compress: true
      });

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const svgStr = buildPageSvg(pageIndex);

        const pxW = mmToPx(paperSize.width);
        const pxH = mmToPx(paperSize.height);

        const pngBlob = await svgStringToPngBlob(svgStr, pxW, pxH);

        // convert blob -> dataURL
        const dataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(pngBlob);
        });

        if (pageIndex > 0) pdf.addPage([paperSize.width, paperSize.height], 'portrait');
        pdf.addImage(dataUrl, 'PNG', 0, 0, paperSize.width, paperSize.height);
      }

      // Save the PDF
      pdf.save(`labels_${batchSettings.prefix || 'batch'}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('PDF export failed. Check console for details.');
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Action Bar */}
      <div
        className="no-print"
        style={{
          flexShrink: 0, padding: '15px', background: 'white', borderBottom: '1px solid #ddd',
          display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
        }}>
        <button aria-label="Print PDF" onClick={handleDownloadPDF} style={{ ...styles.toolBtn, background: '#4f46e5', color: 'white', border: 'none' }}>
          <Printer size={16} /> Print PDF (All Pages)
        </button>
        <button aria-label="Export SVG" onClick={handleDownloadSVG} style={{ ...styles.toolBtn, background: '#be185d', color: 'white', border: 'none' }}>
          <Scissors size={16} /> Export SVG (Laser Cut)
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', fontSize: '12px', alignItems: 'center' }}>
          <input type="checkbox" checked={showCutLines} onChange={e => setShowCutLines(e.target.checked)} id="cutToggle" />
          <label htmlFor="cutToggle" style={{ cursor: 'pointer' }}>Show Cut Lines</label>
        </div>
      </div>

      {/* Scrollable Preview Area wrapped with print container ID */}
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
              padding: `${MARGIN}mm`,
              transformOrigin: 'top left',
              background: 'white'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${labelSize.width}mm)`,
                gridAutoRows: `${labelSize.height}mm`,
                gap: `${GAP}mm`
              }}
            >
              {data.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((code, idx) => (
                <div key={idx} style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox={`0 0 ${labelSize.width} ${labelSize.height}`}>
                    {elements.map(el => {
                      let finalEl = { ...el };
                      if (el.type === 'qr') finalEl.text = code;
                      if (el.type === 'variable') finalEl.text = code;

                      if (el.isBackground && showCutLines) {
                        finalEl.stroke = '#FF0000';
                        finalEl.strokeWidth = 0.5;
                        finalEl.fill = 'none';
                      }

                      return (
                        <g key={el.id} transform={`translate(${finalEl.x}, ${finalEl.y})`}>
                          <RenderElement element={finalEl} selected={false} />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ))}
            </div>
            <div className="no-print" style={{ position: 'absolute', bottom: 5, right: 10, fontSize: 10, color: '#ccc' }}>
              Page {pageIndex + 1} of {totalPages}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
