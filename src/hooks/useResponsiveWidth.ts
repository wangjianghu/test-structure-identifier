
import { useState, useEffect } from 'react';

export function useResponsiveWidth() {
  const [historyWidth, setHistoryWidth] = useState('420px');

  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth >= 1024) {
        // 桌面端：取30%和420px的最大值
        const thirtyPercent = window.innerWidth * 0.3;
        const finalWidth = Math.max(420, thirtyPercent);
        setHistoryWidth(`${finalWidth}px`);
      } else {
        // 移动端：全屏
        setHistoryWidth('100%');
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return historyWidth;
}
