
import { useState, useCallback } from 'react';
import { OCRHistoryItem } from '@/types/ocrHistory';
import { OCRResult } from '@/lib/enhancedOCR';

export function useOCRHistory() {
  const [history, setHistory] = useState<OCRHistoryItem[]>([]);

  const addToHistory = useCallback(async (file: File, ocrResult: OCRResult) => {
    // 创建图片的 Data URL
    const imageDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    const historyItem: OCRHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      originalImage: file,
      imageDataUrl,
      ocrResult
    };

    setHistory(prev => [historyItem, ...prev]);
    return historyItem;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const exportHistory = useCallback(() => {
    const exportData = history.map(item => ({
      id: item.id,
      timestamp: item.timestamp.toISOString(),
      fileName: item.originalImage.name,
      fileSize: item.originalImage.size,
      ocrText: item.ocrResult.text,
      ocrConfidence: item.ocrResult.confidence,
      isQuestion: item.ocrResult.classification.isQuestion,
      questionType: item.ocrResult.classification.questionType,
      subject: item.ocrResult.classification.subject,
      classificationConfidence: item.ocrResult.classification.confidence,
      processingTime: item.ocrResult.processingTime
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history]);

  return {
    history,
    addToHistory,
    clearHistory,
    removeItem,
    exportHistory
  };
}
