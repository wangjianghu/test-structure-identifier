
import { useState, useCallback } from 'react';
import { HistoryItem, TextHistoryItem, ImageHistoryItem } from '@/types/ocrHistory';
import { OCRResult } from '@/lib/enhancedOCR';
import { ParsedQuestion } from '@/lib/parser';

export function useOCRHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const addTextToHistory = useCallback((inputText: string, analysisResult: ParsedQuestion) => {
    const historyItem: TextHistoryItem = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      inputType: 'text',
      inputText,
      analysisResult: {
        text: analysisResult.text,
        questionType: analysisResult.type,
        subject: analysisResult.subject,
        hasOptions: analysisResult.options.length > 0,
        options: analysisResult.options,
        processingTime: Date.now() // Simple timestamp for now
      }
    };

    setHistory(prev => [historyItem, ...prev]);
    return historyItem;
  }, []);

  const addImageToHistory = useCallback(async (file: File, ocrResult: OCRResult, analysisResult?: ParsedQuestion) => {
    // 创建图片的 Data URL
    const imageDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    const historyItem: ImageHistoryItem = {
      id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      inputType: 'image',
      originalImage: file,
      imageDataUrl,
      inputText: ocrResult.text,
      ocrResult,
      analysisResult: analysisResult ? {
        text: analysisResult.text,
        questionType: analysisResult.type,
        subject: analysisResult.subject,
        hasOptions: analysisResult.options.length > 0,
        options: analysisResult.options,
        processingTime: Date.now()
      } : undefined
    };

    setHistory(prev => [historyItem, ...prev]);
    return historyItem;
  }, []);

  const updateHistoryItemAnalysis = useCallback((id: string, analysisResult: ParsedQuestion) => {
    setHistory(prev => prev.map(item => {
      if (item.id === id && item.inputType === 'image') {
        return {
          ...item,
          analysisResult: {
            text: analysisResult.text,
            questionType: analysisResult.type,
            subject: analysisResult.subject,
            hasOptions: analysisResult.options.length > 0,
            options: analysisResult.options,
            processingTime: Date.now()
          }
        } as ImageHistoryItem;
      }
      return item;
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const exportHistory = useCallback(() => {
    const exportData = history.map(item => {
      const baseData = {
        id: item.id,
        timestamp: item.timestamp.toISOString(),
        inputType: item.inputType,
      };

      if (item.inputType === 'text') {
        return {
          ...baseData,
          inputText: item.inputText,
          analysisResult: item.analysisResult
        };
      } else {
        return {
          ...baseData,
          fileName: item.originalImage.name,
          fileSize: item.originalImage.size,
          inputText: item.inputText,
          ocrResult: {
            text: item.ocrResult.text,
            confidence: item.ocrResult.confidence,
            isQuestion: item.ocrResult.classification.isQuestion,
            questionType: item.ocrResult.classification.questionType,
            subject: item.ocrResult.classification.subject,
            classificationConfidence: item.ocrResult.classification.confidence,
            processingTime: item.ocrResult.processingTime
          },
          analysisResult: item.analysisResult
        };
      }
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history]);

  return {
    history,
    addTextToHistory,
    addImageToHistory,
    updateHistoryItemAnalysis,
    clearHistory,
    removeItem,
    exportHistory,
    // Legacy methods for backward compatibility
    addToHistory: addImageToHistory
  };
}
