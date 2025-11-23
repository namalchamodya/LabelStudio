import QRCode from 'qrcode';

export const QRCodeUtil = {
  generate: (text) => {
    try {
      // Error Correction Level 'H' (High) allows ~30% damage/coverage
      const qr = QRCode.create(text || " ", { 
        errorCorrectionLevel: 'H', 
        margin: 0 
      });
      
      const size = qr.modules.size;
      const data = qr.modules.data;
      
      // Convert to 2D matrix
      const matrix = [];
      for (let r = 0; r < size; r++) {
        const row = [];
        for (let c = 0; c < size; c++) {
          row.push(data[r * size + c]);
        }
        matrix.push(row);
      }
      return matrix;
    } catch (e) {
      console.error("QR Generation failed", e);
      return Array(29).fill(0).map((_,r)=>Array(29).fill(0).map((_,c)=>((r+c)%2===0?1:0))); 
    }
  }
};