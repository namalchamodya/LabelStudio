import React, { useState } from 'react';
import { styles } from '../constants/styles';
import { callGemini } from '../utils/geminiApi';
import { Sparkles } from 'lucide-react';

export default function DataWorkspace({ batchSettings, setBatchSettings, isAiLoading, setIsAiLoading }) {
  const [aiPrompt, setAiPrompt] = useState("");

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    const prompt = `Generate a list of 20 items based on this request: "${aiPrompt}". 
    Return only the items, separated by commas or newlines. Do not number them. 
    Examples: 
    - If asked for "random hex", return "A1B2, C3D4, ..."
    - If asked for "funny robot names", return "BeepBoop, Rusty, ..."
    `;
    
    const result = await callGemini(prompt);
    
    // Clean up result: remove numbering (1. 2. etc) and split
    const cleanList = result
      .replace(/^\d+\.\s*/gm, '') // remove "1. "
      .replace(/[*•-]\s*/gm, '') // remove bullets
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .join('\n');

    setBatchSettings({ ...batchSettings, mode: 'custom', customList: cleanList });
    setIsAiLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Data Source</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          style={{ ...styles.toolBtn, backgroundColor: batchSettings.mode === 'sequence' ? '#eef2ff' : 'white', borderColor: batchSettings.mode === 'sequence' ? '#4f46e5' : '#ddd' }}
          onClick={() => setBatchSettings({ ...batchSettings, mode: 'sequence' })}
        >
          123 Numeric Sequence
        </button>
        <button 
          style={{ ...styles.toolBtn, backgroundColor: batchSettings.mode === 'custom' ? '#eef2ff' : 'white', borderColor: batchSettings.mode === 'custom' ? '#4f46e5' : '#ddd' }}
          onClick={() => setBatchSettings({ ...batchSettings, mode: 'custom' })}
        >
          <Sparkles size={14} color="#7c3aed" /> AI / Custom List
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
        
        {batchSettings.mode === 'sequence' ? (
          <>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Prefix String</label>
              <input type="text" style={styles.input} value={batchSettings.prefix} placeholder="e.g. ELIoT-" onChange={(e) => setBatchSettings({...batchSettings, prefix: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={styles.inputGroup}><label style={styles.label}>Start Number</label><input type="number" style={styles.input} value={batchSettings.start} onChange={(e) => setBatchSettings({...batchSettings, start: Number(e.target.value)})} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>End Number</label><input type="number" style={styles.input} value={batchSettings.end} onChange={(e) => setBatchSettings({...batchSettings, end: Number(e.target.value)})} /></div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '20px', padding: '15px', background: 'linear-gradient(to right, #f5f3ff, #fff)', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
              <label style={{...styles.label, color: '#7c3aed'}}>✨ Ask AI to generate data</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  style={{...styles.input, border: '1px solid #c4b5fd'}} 
                  placeholder="e.g. '20 random 6-digit serial numbers' or '10 spooky halloween names'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                />
                <button 
                  onClick={handleAiGenerate}
                  disabled={isAiLoading}
                  style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {isAiLoading ? '...' : 'Go'}
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Manual Edit (One item per line)</label>
              <textarea 
                style={styles.textarea} 
                value={batchSettings.customList} 
                onChange={(e) => setBatchSettings({...batchSettings, customList: e.target.value})}
                placeholder="Item 1&#10;Item 2&#10;Item 3..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}