
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

const exampleText = "4.已知集合M={-2,-1,0,1,2},N={x|x²-x-2≤0},则M∩(CRN)=(  )\nA.{-2,-1}\nB.{-2}\nC.{-1,0}\nD.{0}";

const Index = () => {
  const [inputText, setInputText] = useState(exampleText);
  const [analysisResult, setAnalysisResult] = useState<ParsedQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  
  const { history, addToHistory, clearHistory, removeItem, exportHistory } = useOCRHistory();

  const handleAnalyze = () => {
    setIsLoading(true);
    // 模拟处理时间
    setTimeout(() => {
      const result = parseQuestion(inputText);
      setAnalysisResult(result);
      setIsLoading(false);
    }, 500);
  };

  const processImageFile = useCallback(async (file: File) => {
    if (isOcrLoading) return;
    setIsOcrLoading(true);
    setAnalysisResult(null);
    setOcrResult(null);
    
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
      await addToHistory(file, result);
      
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
  }, [isOcrLoading, addToHistory]);

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
    <div className="min-h-screen w-full bg-background bg-grid text-foreground flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8">
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

      <main className="w-full max-w-6xl flex-grow">
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 py-2">
            智能试题结构识别
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            粘贴试题文本或上传图片，即刻获得结构化分析。目前支持数学等学科的基础选择题与主观题识别。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：输入和分析区域 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="max-w-2xl">
              <QuestionInput
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onImageUpload={handleImageUpload}
                isOcrLoading={isOcrLoading}
                disabled={isOcrLoading || isLoading}
                onAnalyze={handleAnalyze}
                isAnalyzing={isLoading}
              />
              
              {/* OCR 处理详情显示 */}
              {ocrResult && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
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
            </div>

            {/* 分析结果显示 */}
            {analysisResult && (
              <div className="w-full">
                <AnalysisResult result={analysisResult} />
              </div>
            )}
          </div>

          {/* 右侧：OCR 历史记录 */}
          <div className="lg:col-span-1">
            <OCRHistory
              history={history}
              onRemoveItem={removeItem}
              onExport={exportHistory}
              onClear={clearHistory}
            />
          </div>
        </div>
      </main>
      
      <footer className="w-full max-w-6xl mt-16 text-center text-sm text-muted-foreground py-4">
        <p>由 Lovable AI 强力驱动。</p>
        <p className="text-xs mt-1">注意：分析结果由基本算法生成，可能存在误差，仅供参考。</p>
      </footer>
    </div>
  );
};

export default Index;
