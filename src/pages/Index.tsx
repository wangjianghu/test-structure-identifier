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
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [currentImageHistoryId, setCurrentImageHistoryId] = useState<string | null>(null);
  
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

  const handleAnalyze = () => {
    setIsLoading(true);
    // 模拟处理时间
    setTimeout(() => {
      const result = parseQuestion(inputText);
      setAnalysisResult(result);
      
      // 记录分析结果到历史
      if (currentImageHistoryId) {
        // 如果当前是图片输入，更新对应的历史记录
        updateHistoryItemAnalysis(currentImageHistoryId, result);
        setCurrentImageHistoryId(null);
      } else {
        // 如果是文本输入，添加新的历史记录
        addTextToHistory(inputText, result, selectedSubject, questionTypeExample);
      }
      
      setIsLoading(false);
    }, 500);
  };

  const processImageFile = useCallback(async (file: File) => {
    if (isOcrLoading) return;
    setIsOcrLoading(true);
    setAnalysisResult(null);
    setOcrResult(null);
    setCurrentImageHistoryId(null);
    
    toast.info("开始高级 OCR 处理...", {
      description: "正在进行图像预处理、文字识别和智能分析。",
    });
    
    const enhancedOCR = new EnhancedOCR();
    
    try {
      const result = await enhancedOCR.processImage(file);
      
      console.log('Enhanced OCR 结果:', result);
      
      setOcrResult(result);
      setInputText(result.text);
      
      // 添加到历史记录
      const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
      setCurrentImageHistoryId(historyItem.id);
      
      // 显示处理结果
      if (result.classification.isQuestion) {
        toast.success("识别完成！检测到试题内容", {
          description: `OCR置信度: ${result.confidence.toFixed(1)}%, 分类置信度: ${(result.classification.confidence * 100).toFixed(1)}%`,
        });
      } else {
        toast.warning("识别完成，但可能不是试题", {
          description: `OCR置信度: ${result.confidence.toFixed(1)}%, 建议检查内容`,
        });
      }
      
    } catch (err) {
      console.error(err);
      toast.error("高级 OCR 处理失败", {
        description: "无法从图片中提取文字，请检查图片质量或稍后重试。",
      });
    } finally {
      enhancedOCR.destroy();
      setIsOcrLoading(false);
    }
  }, [isOcrLoading, addImageToHistory, selectedSubject, questionTypeExample]);

  // Reset current image history ID when text is manually changed
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setCurrentImageHistoryId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    processImageFile(file);
    e.target.value = ''; // Clear the file input
  };
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.includes('image')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            processImageFile(file);
            return; // Found an image, no need to check others
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processImageFile]);

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
                onImageUpload={handleImageUpload}
                isOcrLoading={isOcrLoading}
                disabled={isOcrLoading || isLoading}
                onAnalyze={handleAnalyze}
                isAnalyzing={isLoading}
              />
              
              {/* OCR 处理详情显示 */}
              {ocrResult && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-sm">当前 OCR 处理详情</h3>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>OCR 置信度: {ocrResult.confidence.toFixed(1)}%</div>
                    <div>处理时间: {ocrResult.processingTime}ms</div>
                    <div>检测学科: {ocrResult.classification.subject}</div>
                    <div>题型: {ocrResult.classification.questionType}</div>
                    <div>分类置信度: {(ocrResult.classification.confidence * 100).toFixed(1)}%</div>
                    <details className="mt-2">
                      <summary className="cursor-pointer hover:text-foreground">处理步骤</summary>
                      <ul className="mt-1 ml-4 space-y-1">
                        {ocrResult.preprocessingSteps.map((step, index) => (
                          <li key={index}>• {step}</li>
                        ))}
                      </ul>
                    </details>
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
