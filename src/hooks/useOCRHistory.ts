
import { useState, useCallback } from 'react';
import { HistoryItem, TextHistoryItem, ImageHistoryItem, QuestionTypeExample } from '@/types/ocrHistory';
import { OCRResult } from '@/lib/enhancedOCR';
import { ParsedQuestion } from '@/lib/parser';

export function useOCRHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [questionTypeExamples, setQuestionTypeExamples] = useState<QuestionTypeExample[]>([]);

  const addTextToHistory = useCallback((
    inputText: string, 
    analysisResult: ParsedQuestion, 
    selectedSubject?: string,
    questionTypeExample?: string
  ) => {
    const inputTime = new Date();
    const historyItem: TextHistoryItem = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: inputTime,
      inputTime,
      outputTime: new Date(),
      inputType: 'text',
      selectedSubject,
      questionTypeExample,
      inputText,
      analysisResult: {
        text: analysisResult.body,
        questionType: analysisResult.questionType,
        subject: analysisResult.subject,
        hasOptions: analysisResult.options ? analysisResult.options.length > 0 : false,
        options: analysisResult.options ? analysisResult.options.map(opt => `${opt.key}. ${opt.value}`) : [],
        processingTime: Date.now()
      }
    };

    // 收集题型结构示例
    if (selectedSubject && questionTypeExample && questionTypeExample.trim()) {
      collectQuestionTypeExample(selectedSubject, analysisResult.questionType, questionTypeExample);
    }

    setHistory(prev => [historyItem, ...prev]);
    return historyItem;
  }, []);

  const addImageToHistory = useCallback(async (
    file: File, 
    ocrResult: OCRResult, 
    analysisResult?: ParsedQuestion,
    selectedSubject?: string,
    questionTypeExample?: string
  ) => {
    const inputTime = new Date();
    
    // 创建图片的 Data URL
    const imageDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    const historyItem: ImageHistoryItem = {
      id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: inputTime,
      inputTime,
      outputTime: analysisResult ? new Date() : undefined,
      inputType: 'image',
      selectedSubject,
      questionTypeExample,
      originalImage: file,
      imageDataUrl,
      inputText: ocrResult.text,
      ocrResult,
      analysisResult: analysisResult ? {
        text: analysisResult.body,
        questionType: analysisResult.questionType,
        subject: analysisResult.subject,
        hasOptions: analysisResult.options ? analysisResult.options.length > 0 : false,
        options: analysisResult.options ? analysisResult.options.map(opt => `${opt.key}. ${opt.value}`) : [],
        processingTime: Date.now()
      } : undefined
    };

    // 收集题型结构示例
    if (selectedSubject && questionTypeExample && questionTypeExample.trim() && analysisResult) {
      collectQuestionTypeExample(selectedSubject, analysisResult.questionType, questionTypeExample);
    }

    setHistory(prev => [historyItem, ...prev]);
    return historyItem;
  }, []);

  const updateHistoryItemAnalysis = useCallback((id: string, analysisResult: ParsedQuestion) => {
    setHistory(prev => prev.map(item => {
      if (item.id === id && item.inputType === 'image') {
        const updatedItem = {
          ...item,
          outputTime: new Date(),
          analysisResult: {
            text: analysisResult.body,
            questionType: analysisResult.questionType,
            subject: analysisResult.subject,
            hasOptions: analysisResult.options ? analysisResult.options.length > 0 : false,
            options: analysisResult.options ? analysisResult.options.map(opt => `${opt.key}. ${opt.value}`) : [],
            processingTime: Date.now()
          }
        } as ImageHistoryItem;

        // 收集题型结构示例
        if (item.selectedSubject && item.questionTypeExample && item.questionTypeExample.trim()) {
          collectQuestionTypeExample(item.selectedSubject, analysisResult.questionType, item.questionTypeExample);
        }

        return updatedItem;
      }
      return item;
    }));
  }, []);

  const collectQuestionTypeExample = useCallback((subject: string, questionType: string, structureExample: string) => {
    setQuestionTypeExamples(prev => {
      const existingIndex = prev.findIndex(
        example => example.subject === subject && 
                  example.questionType === questionType && 
                  example.structureExample === structureExample
      );

      if (existingIndex >= 0) {
        // 更新使用次数
        const updated = [...prev];
        updated[existingIndex].usageCount += 1;
        return updated;
      } else {
        // 新增示例
        const newExample: QuestionTypeExample = {
          id: `example-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          subject,
          questionType,
          structureExample,
          usageCount: 1
        };
        return [...prev, newExample];
      }
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const exportHistory = useCallback(() => {
    const exportData = {
      history: history.map(item => {
        const baseData = {
          id: item.id,
          timestamp: item.timestamp.toISOString(),
          inputTime: item.inputTime.toISOString(),
          outputTime: item.outputTime?.toISOString(),
          inputType: item.inputType,
          selectedSubject: item.selectedSubject,
          questionTypeExample: item.questionTypeExample,
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
            fileType: item.originalImage.type,
            imageDataUrl: item.imageDataUrl,
            inputText: item.inputText,
            ocrResult: {
              text: item.ocrResult.text,
              confidence: item.ocrResult.confidence,
              isQuestion: item.ocrResult.classification.isQuestion,
              questionType: item.ocrResult.classification.questionType,
              subject: item.ocrResult.classification.subject,
              classificationConfidence: item.ocrResult.classification.confidence,
              features: item.ocrResult.classification.features,
              preprocessingSteps: item.ocrResult.preprocessingSteps,
              processingTime: item.ocrResult.processingTime
            },
            analysisResult: item.analysisResult
          };
        }
      }),
      questionTypeExamples: questionTypeExamples.map(example => ({
        ...example,
        timestamp: example.timestamp.toISOString()
      }))
    };

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
  }, [history, questionTypeExamples]);

  return {
    history,
    questionTypeExamples,
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
