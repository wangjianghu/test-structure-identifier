
import { useState, useCallback } from 'react';
import { HistoryItem, TextHistoryItem, ImageHistoryItem, QuestionTypeExample } from '@/types/ocrHistory';
import { OCRResult } from '@/lib/enhancedOCR';
import { ParsedQuestion } from '@/lib/parser';
import { supabase } from '@/integrations/supabase/client';

// 生成8位随机正整数
const generateDisplayId = (): number => {
  return Math.floor(10000000 + Math.random() * 90000000);
};

export function useOCRHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [questionTypeExamples, setQuestionTypeExamples] = useState<QuestionTypeExample[]>([]);

  const saveToSupabase = async (subject: string, questionType: string, structureExample: string) => {
    try {
      console.log('保存到 Supabase:', { subject, questionType, structureExample });
      
      // 检查是否已存在相同的示例
      const { data: existingData, error: checkError } = await supabase
        .from('question_type_examples')
        .select('*')
        .eq('subject', subject)
        .eq('question_type', questionType)
        .eq('structure_example', structureExample)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('检查现有记录时出错:', checkError);
        return;
      }

      if (existingData) {
        // 更新使用次数
        const { error: updateError } = await supabase
          .from('question_type_examples')
          .update({
            usage_count: existingData.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) {
          console.error('更新使用次数时出错:', updateError);
        }
      } else {
        // 创建新记录
        const { error: insertError } = await supabase
          .from('question_type_examples')
          .insert({
            subject,
            question_type: questionType,
            structure_example: structureExample,
            usage_count: 1,
            last_used_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('插入新记录时出错:', insertError);
        }
      }
    } catch (error) {
      console.error('保存到 Supabase 失败:', error);
    }
  };

  const addTextToHistory = useCallback((
    inputText: string, 
    analysisResult: ParsedQuestion, 
    selectedSubject?: string,
    questionTypeExample?: string
  ) => {
    const inputTime = new Date();
    const historyItem: TextHistoryItem = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      displayId: generateDisplayId(),
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

    // 收集题型结构示例并保存到 Supabase
    if (selectedSubject && questionTypeExample && questionTypeExample.trim()) {
      collectQuestionTypeExample(selectedSubject, analysisResult.questionType, questionTypeExample);
      saveToSupabase(selectedSubject, analysisResult.questionType, questionTypeExample);
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
      displayId: generateDisplayId(),
      timestamp: inputTime,
      inputTime,
      outputTime: analysisResult ? new Date() : undefined, // 修复：当有分析结果时设置完成时间
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

    // 收集题型结构示例并保存到 Supabase
    if (selectedSubject && questionTypeExample && questionTypeExample.trim() && analysisResult) {
      collectQuestionTypeExample(selectedSubject, analysisResult.questionType, questionTypeExample);
      saveToSupabase(selectedSubject, analysisResult.questionType, questionTypeExample);
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

        // 收集题型结构示例并保存到 Supabase
        if (item.selectedSubject && item.questionTypeExample && item.questionTypeExample.trim()) {
          collectQuestionTypeExample(item.selectedSubject, analysisResult.questionType, item.questionTypeExample);
          saveToSupabase(item.selectedSubject, analysisResult.questionType, item.questionTypeExample);
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
