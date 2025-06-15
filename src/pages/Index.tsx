
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Github, ChevronLeft, ChevronRight } from "lucide-react";
import { parseQuestion, ParsedQuestion } from "@/lib/parser";
import { AnalysisResult } from "@/components/AnalysisResult";
import { toast } from "sonner";
import { QuestionInput } from "@/components/QuestionInput";
import { OCRResult } from "@/lib/enhancedOCR";
import { MistralOCRResult } from "@/lib/mistralOCR";
import { OCRHistory } from "@/components/OCRHistory";
import { useOCRHistory } from "@/hooks/useOCRHistory";
import { SubjectAndTypeSelector } from "@/components/SubjectAndTypeSelector";
import { AlicloudOCRResult } from "@/lib/alicloudOCR";
import { useResponsiveWidth } from "@/hooks/useResponsiveWidth";
import { OCRProcessor } from "@/components/OCRProcessor";
import { OCRResultsDisplay } from "@/components/OCRResultsDisplay";
import { QuestionTypeStats } from "@/components/QuestionTypeStats";

const exampleText = "4.已知集合M={-2,-1,0,1,2},N={x|x²-x-2≤0},则M∩(CRN)=(  )\nA.{-2,-1}\nB.{-2}\nC.{-1,0}\nD.{0}";

const Index = () => {
  const [inputText, setInputText] = useState(exampleText);
  const [analysisResult, setAnalysisResult] = useState<ParsedQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState<(OCRResult | MistralOCRResult | AlicloudOCRResult)[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  
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

  const ocrProcessor = new OCRProcessor();

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setIsHistoryOpen(false);
      } else {
        setIsHistoryOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('遮罩层被点击，关闭历史面板');
    setIsHistoryOpen(false);
  }, []);

  const handleHistoryToggle = useCallback(() => {
    console.log('切换历史面板状态:', !isHistoryOpen);
    setIsHistoryOpen(!isHistoryOpen);
  }, [isHistoryOpen]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysisResult(null);
    
    try {
      let finalText = inputText;
      let imageHistoryItems: any[] = [];
      
      // 如果有上传的图片，先进行OCR识别
      if (uploadedImages.length > 0) {
        setIsOcrLoading(true);
        
        const { results, imageHistoryItems: newImageHistoryItems } = await ocrProcessor.processImages(
          uploadedImages,
          selectedSubject,
          questionTypeExample,
          addImageToHistory
        );
        
        setOcrResults(results);
        imageHistoryItems = newImageHistoryItems;
        
        // 合并所有OCR识别的文本
        const ocrTexts = results.map(r => r.text).filter(t => t.trim());
        if (ocrTexts.length > 0) {
          finalText = ocrTexts.join('\n\n');
          setInputText(finalText);
        }
        
        setIsOcrLoading(false);
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

  const handleImagesUpload = useCallback((newImages: File[]) => {
    setUploadedImages(newImages);
    setAnalysisResult(null);
    setOcrResults([]);
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setOcrResults(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback((clearOptimizationParams = false) => {
    setInputText("");
    setUploadedImages([]);
    setOcrResults([]);
    setAnalysisResult(null);
    
    if (clearOptimizationParams) {
      setSelectedSubject("");
      setQuestionTypeExample("");
      toast.success("已清空输入内容和识别优化参数");
    } else {
      toast.success("已清空输入内容");
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

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

  const historyWidth = useResponsiveWidth();

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col">
      <header className="w-full flex justify-between items-center p-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl lg:text-2xl font-bold text-primary">智能识别试题结构</h1>
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com/wangjianghu/Test-Structure-Identifier" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-6 w-6" />
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex relative">
          {/* 左侧：输入和分析区域 */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 p-4 lg:p-6">
              <div className="max-w-5xl mx-auto space-y-4">
                {/* 学科选择和OCR增强配置区域 */}
                <SubjectAndTypeSelector
                  selectedSubject={selectedSubject}
                  onSubjectChange={setSelectedSubject}
                  questionTypeExample={questionTypeExample}
                  onQuestionTypeExampleChange={setQuestionTypeExample}
                />

                {/* 描述文案 - 与输入框左对齐 */}
                <div className="text-left">
                  <p className="text-base lg:text-lg text-muted-foreground">
                    粘贴试题文本或上传图片，即刻获得结构化分析。支持数学、物理、化学、语文、英语等学科的多种题型识别。
                  </p>
                </div>

                {/* 输入区域 */}
                <div className="space-y-4">
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
                </div>
                
                {/* OCR 处理详情显示 */}
                <OCRResultsDisplay ocrResults={ocrResults} />

                {/* 分析结果显示 */}
                {analysisResult && (
                  <div className="w-full">
                    <AnalysisResult result={analysisResult} />
                  </div>
                )}

                {/* 题型示例统计信息 */}
                <QuestionTypeStats questionTypeExamples={questionTypeExamples} />
              </div>
            </div>
          </div>

          {/* 右侧：历史记录 - 响应式设计，调整宽度为30%，最小420px */}
          {isHistoryOpen && (
            <>
              {/* 遮罩层，仅在小屏幕且历史记录面板打开时显示 */}
              <div 
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={handleOverlayClick}
              />
              
              <div 
                className="fixed inset-y-0 right-0 z-40 bg-background border-l lg:relative lg:z-auto"
                style={{ width: historyWidth }}
              >
                <div className="h-full bg-background">
                  <OCRHistory
                    history={history}
                    onRemoveItem={removeItem}
                    onExport={exportHistory}
                    onClear={clearHistory}
                  />
                </div>
              </div>
            </>
          )}

          {/* 展开收起历史面板按钮 - 始终显示 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHistoryToggle}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 h-12 w-6 rounded-l-md rounded-r-none bg-background border border-l-0 shadow-md hover:bg-muted"
            style={{ transform: 'translateY(-50%)' }}
          >
            {isHistoryOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
