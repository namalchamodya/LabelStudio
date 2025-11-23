import React, { useMemo } from 'react';
import { QRCodeUtil } from '../utils/qrCode';

export default function RenderElement({ element, selected }) {
  const selectionStyle = selected ? { outline: '2px solid #4f46e5', outlineOffset: '2px' } : {};
  
  // --- RECTANGLE ---
  if (element.type === 'rect') {
    return (
      <rect 
        width={element.width} 
        height={element.height} 
        rx={element.rx || 0}
        fill={element.fill} 
        stroke={element.stroke} 
        strokeWidth={element.strokeWidth}
        style={selectionStyle}
      />
    );
  }

  // --- IMAGE ---
  if (element.type === 'image') {
    return (
      <image
        href={element.src}
        width={element.width}
        height={element.height}
        preserveAspectRatio="none"
        style={selectionStyle}
      />
    );
  }

  // --- TEXT ---
  if (element.type === 'text' || element.type === 'variable') {
    return (
      <text
        style={{ 
          fontFamily: element.fontFamily || 'Arial, sans-serif', 
          fontSize: `${element.fontSize}pt`, 
          fontWeight: element.fontWeight || 'normal',
          fontStyle: element.fontStyle || 'normal',
          textDecoration: element.textDecoration || 'none',
          userSelect: 'none', 
          fill: element.fill, 
          ...selectionStyle 
        }}
        dy="1em"
      >
        {element.text}
      </text>
    );
  }
  
  // --- QR CODE (Starbucks Style with Blank Middle) ---
  if (element.type === 'qr') {
    const matrix = useMemo(() => QRCodeUtil.generate(element.text || "EMPTY"), [element.text]);
    const size = matrix.length;
    const cellSize = element.width / size;
    
    // 1. Calculate Logo Position (pixels)
    // We use ~22% of the QR width for the logo to keep it safe
    const logoPixelSize = element.logo ? element.width * 0.22 : 0; 
    const logoStartPixel = (element.width - logoPixelSize) / 2;
    
    // 2. Calculate Grid Coordinates to CLEAR (modules)
    // We figure out which rows/cols correspond to that center pixel area
    // safeZoneRad is roughly how many cells from the center we need to clear
    const centerIdx = Math.floor(size / 2);
    const safeZoneRad = element.logo ? Math.floor(size * 0.11) : -1; // ~22% total coverage
    
    const safeRowStart = centerIdx - safeZoneRad;
    const safeRowEnd = centerIdx + safeZoneRad;
    const safeColStart = centerIdx - safeZoneRad;
    const safeColEnd = centerIdx + safeZoneRad;

    return (
      <g style={selectionStyle}>
        {/* White Background */}
        <rect width={element.width} height={element.height} fill="white" rx={2} />
        
        {matrix.map((row, r) => 
          row.map((cell, c) => {
            if (!cell) return null; 
            const x = c * cellSize;
            const y = r * cellSize;

            // --- LOGIC TO BLANK MIDDLE ---
            // If this cell falls within the calculated "Safe Zone", do NOT draw it.
            if (element.logo && r >= safeRowStart && r <= safeRowEnd && c >= safeColStart && c <= safeColEnd) {
               return null;
            }

            // Finder Patterns (The 3 big squares in corners)
            // Finders are always 7x7 modules
            const finderSize = 7;
            const isFinder = (r < finderSize && c < finderSize) || 
                             (r < finderSize && c >= size - finderSize) || 
                             (r >= size - finderSize && c < finderSize);
            
            if (isFinder) {
               // Draw Finders as crisp Rectangles
               // Adding +0.1 width avoids hairline gaps in some browsers
               return (
                 <rect 
                   key={`${r}-${c}`} 
                   x={x} y={y} 
                   width={cellSize + 0.1} height={cellSize + 0.1} 
                   fill={element.fill || "black"} 
                 />
               );
            }

            // Data Bits - Draw as Circles (Starbucks Style)
            return (
              <circle 
                key={`${r}-${c}`} 
                cx={x + cellSize/2} 
                cy={y + cellSize/2} 
                r={cellSize/2.2} 
                fill={element.fill || "black"} 
              />
            );
          })
        )}
        
        {/* Render Logo + White Backplate */}
        {element.logo && (
          <g transform={`translate(${logoStartPixel}, ${logoStartPixel})`}>
            {/* White square behind logo ensures strict contrast */}
            <rect x={0} y={0} width={logoPixelSize} height={logoPixelSize} fill="white" />
            <image 
              href={element.logo} 
              x={0} y={0} 
              width={logoPixelSize} 
              height={logoPixelSize} 
              preserveAspectRatio="xMidYMid meet" 
            />
          </g>
        )}
      </g>
    );
  }
  return null;
}