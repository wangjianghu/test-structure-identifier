
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Github, Zap } from "lucide-react";
import { parseQuestion, ParsedQuestion } from "@/lib/parser";
import { AnalysisResult } from "@/components/AnalysisResult";
import { toast } from "sonner";
import { QuestionInput } from "@/components/QuestionInput";
import { EnhancedOCR, OCRResult } from "@/lib/enhancedOCR";
import { OCRHistory } from "@/components/OCRHistory";
import { useOCRHistory } from "@/hooks/useOCRHistory";
import { SubjectAndTypeSelector } from "@/components/SubjectAndTypeSelector";

const exampleText = "4.已知集合M={-2,-1,0,1,2},N={x|x²-x-2≤0},则M∩(CRN)=(  )\nA.{-2,-1}\nB.{-2}\nC.{-1,0}\nD.{0}";

const Index = () => {
  const [inputText, setInputText] = useState(exampleText);
  const [analysisResult, setAnalysisResult] = useState<ParsedQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  
  // 新增状态
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questionTypeExample, setQuestionTypeExample] = useState("");
  
  const { 
    history, 
    questionTypeExamples,
    addTextToHistory, 
    addImageToHistory, 
    updateHistoryItemAnalysis, 
    clearHistory, 
    removeItem, 
    exportHistory 
  } = useOCRHistory();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysisResult(null);
    
    try {
      let finalText = inputText;
      let imageHistoryItems: any[] = [];
      
      // 如果有上传的图片，先进行OCR识别
      if (uploadedImages.length > 0) {
        setIsOcrLoading(true);
        toast.info("开始处理上传的图片...", {
          description: `正在识别 ${uploadedImages.length} 张图片中的文字内容。`,
        });
        
        const enhancedOCR = new EnhancedOCR();
        const results: OCRResult[] = [];
        
        for (let i = 0; i < uploadedImages.length; i++) {
          const file = uploadedImages[i];
          toast.info(`正在处理第 ${i + 1} 张图片...`, {
            description: `文件：${file.name}`,
          });
          
          try {
            const result = await enhancedOCR.processImage(file);
            results.push(result);
            
            // 先添加到历史记录（不包含分析结果）
            const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
            imageHistoryItems.push(historyItem);
          } catch (err) {
            console.error(`处理图片 ${file.name} 失败:`, err);
            toast.error(`处理图片 ${file.name} 失败`, {
              description: "请检查图片质量或稍后重试。",
            });
          }
        }
        
        enhancedOCR.destroy();
        setOcrResults(results);
        
        // 合并所有OCR识别的文本
        const ocrTexts = results.map(r => r.text).filter(t => t.trim());
        if (ocrTexts.length > 0) {
          finalText = ocrTexts.join('\n\n');
          setInputText(finalText);
        }
        
        setIsOcrLoading(false);
        
        if (results.length > 0) {
          toast.success(`成功识别 ${results.length} 张图片`, {
            description: `平均置信度: ${(results.reduce((sum, r) => sum + r.confidence, 0) / results.length).toFixed(1)}%`,
          });
        }
      }
      
      // 进行题目结构分析
      if (finalText.trim()) {
        const result = parseQuestion(finalText);
        setAnalysisResult(result);
        
        // 如果是文本输入（没有图片），添加到历史记录
        if (uploadedImages.length === 0) {
          addTextToHistory(finalText, result, selectedSubject, questionTypeExample);
        } else {
          // 如果是图片输入，更新历史记录中的分析结果
          imageHistoryItems.forEach(historyItem => {
            updateHistoryItemAnalysis(historyItem.id, result);
          });
        }
      }
      
    } catch (error) {
      console.error('分析过程出错:', error);
      toast.error("分析失败", {
        description: "请检查输入内容或稍后重试。",
      });
    } finally {
      setIsLoading(false);
      setIsOcrLoading(false);
    }
  };

  // 处理多图片上传
  const handleImagesUpload = useCallback((newImages: File[]) => {
    setUploadedImages(newImages);
    setAnalysisResult(null);
    setOcrResults([]);
  }, []);

  // 删除图片
  const handleRemoveImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setOcrResults(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 清空输入框内容（文本和图片）
  const handleClear = useCallback(() => {
    setInputText("");
    setUploadedImages([]);
    setOcrResults([]);
    setAnalysisResult(null);
    toast.success("已清空输入内容");
  }, []);

  // 处理文本变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // 处理粘贴图片
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.includes('image')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }
      
      if (imageFiles.length > 0) {
        event.preventDefault();
        setUploadedImages(prev => [...prev, ...imageFiles]);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  return (
    <div className="h-screen w-full bg-background bg-grid text-foreground flex flex-col">
      <header className="w-full flex justify-between items-center p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-primary">题型分析器</h1>
        <a 
          href="https://github.com/lovable-dev/c5fe2474-d81b-4c79-850f-89431dfc1704" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="h-6 w-6" />
        </a>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* 左侧：输入和分析区域 */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 py-2">
                智能试题结构识别
              </h2>
              <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">
                粘贴试题文本或上传图片，即刻获得结构化分析。支持数学、物理、化学、语文、英语等学科的多种题型识别。
              </p>
            </div>

            <div className="flex-1 space-y-4 max-w-4xl mx-auto w-full">
              {/* 学科选择和题型示例输入 */}
              <SubjectAndTypeSelector
                selectedSubject={selectedSubject}
                onSubjectChange={setSelectedSubject}
                questionTypeExample={questionTypeExample}
                onQuestionTypeExampleChange={setQuestionTypeExample}
              />

              <QuestionInput
                value={inputText}
                onChange={handleTextChange}
                onImagesUpload={handleImagesUpload}
                uploadedImages={uploadedImages}
                onRemoveImage={handleRemoveImage}
                isOcrLoading={isOcrLoading}
                disabled={isOcrLoading || isLoading}
                onAnalyze={handleAnalyze}
                isAnalyzing={isLoading}
                onClear={handleClear}
              />
              
              {/* OCR 处理详情显示 */}
              {ocrResults.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-sm">图片 OCR 处理详情</h3>
                  <div className="space-y-3">
                    {ocrResults.map((result, index) => (
                      <div key={index} className="text-xs space-y-1 text-muted-foreground border-l-2 border-blue-200 pl-3">
                        <div className="font-medium">图片 {index + 1}:</div>
                        <div>OCR 置信度: {result.confidence.toFixed(1)}%</div>
                        <div>处理时间: {result.processingTime}ms</div>
                        <div>检测学科: {result.classification.subject}</div>
                        <div>题型: {result.classification.questionType}</div>
                        <div>分类置信度: {(result.classification.confidence * 100).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 分析结果显示 */}
              {analysisResult && (
                <div className="w-full">
                  <AnalysisResult result={analysisResult} />
                </div>
              )}

              {/* 题型示例统计信息 */}
              {questionTypeExamples.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-sm">题型结构收集统计</h3>
                  <div className="text-xs text-muted-foreground">
                    已收集 {questionTypeExamples.length} 种题型结构示例，将用于提升识别准确性
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：分析历史记录 - 撑满全屏 */}
          <div className="w-96 border-l bg-background/50">
            <OCRHistory
              history={history}
              onRemoveItem={removeItem}
              onExport={exportHistory}
              onClear={clearHistory}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
