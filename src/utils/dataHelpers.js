export function generateBatchData(settings) {
    if (settings.mode === 'custom') {
      return settings.customList ? settings.customList.split('\n').filter(x => x.trim() !== '') : [];
    }
    const { prefix, start, end } = settings;
    const list = [];
    if (end < start) return list;
    for (let i = start; i <= end; i++) {
      list.push(`${prefix}${i}`);
    }
    return list;
  }