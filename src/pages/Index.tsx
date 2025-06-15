import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Github, Zap, PanelRightOpen, PanelRightClose } from "lucide-react";
import { parseQuestion, ParsedQuestion } from "@/lib/parser";
import { AnalysisResult } from "@/components/AnalysisResult";
import { toast } from "sonner";
import { QuestionInput } from "@/components/QuestionInput";
import { EnhancedOCR, OCRResult } from "@/lib/enhancedOCR";
import { MistralOCR, MistralOCRResult } from "@/lib/mistralOCR";
import { OCRHistory } from "@/components/OCRHistory";
import { useOCRHistory } from "@/hooks/useOCRHistory";
import { SubjectAndTypeSelector } from "@/components/SubjectAndTypeSelector";
import { MistralConfig } from "@/components/MistralConfig";
import { AlicloudOCR, AlicloudOCRResult } from "@/lib/alicloudOCR";

const exampleText = "4.已知集合M={-2,-1,0,1,2},N={x|x²-x-2≤0},则M∩(CRN)=(  )\nA.{-2,-1}\nB.{-2}\nC.{-1,0}\nD.{0}";

const Index = () => {
  const [inputText, setInputText] = useState(exampleText);
  const [analysisResult, setAnalysisResult] = useState<ParsedQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState<(OCRResult | MistralOCRResult | AlicloudOCRResult)[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  
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

  // 响应式检测：小屏幕时默认关闭历史记录面板
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setIsHistoryOpen(false);
      } else {
        setIsHistoryOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 修复遮罩层点击处理逻辑
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('遮罩层被点击，关闭历史面板');
    setIsHistoryOpen(false);
  }, []);

  // 添加历史面板切换处理
  const handleHistoryToggle = useCallback(() => {
    console.log('切换历史面板状态:', !isHistoryOpen);
    setIsHistoryOpen(!isHistoryOpen);
  }, [isHistoryOpen]);

  const fallbackToBuiltinOCR = async (file: File, results: any[], imageHistoryItems: any[]) => {
    try {
      const enhancedOCR = new EnhancedOCR();
      const fallbackResult = await enhancedOCR.processImage(file);
      results.push(fallbackResult);
      enhancedOCR.destroy();
      
      const historyItem = await addImageToHistory(file, fallbackResult, undefined, selectedSubject, questionTypeExample);
      imageHistoryItems.push(historyItem);
    } catch (fallbackErr) {
      console.error(`内置 OCR 处理图片 ${file.name} 也失败:`, fallbackErr);
      toast.error(`处理图片 ${file.name} 失败`, {
        description: "请检查图片质量或稍后重试。",
      });
    }
  }

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
        
        const results: (OCRResult | MistralOCRResult | AlicloudOCRResult)[] = [];
        
        // 检查配置的OCR服务
        const useMistral = MistralOCR.isConfigured();
        const useAlicloud = AlicloudOCR.isConfigured();
        
        if (useMistral) {
          toast.info("使用 Mistral.ai 高精度识别...", {
            description: "正在处理图片中的文字和数学公式"
          });
          
          const mistralOCR = new MistralOCR();
          
          for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            toast.info(`正在处理第 ${i + 1} 张图片...`, {
              description: `文件：${file.name} (Mistral.ai)`,
            });
            
            try {
              const result = await mistralOCR.processImage(file);
              results.push(result);
              
              const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
              imageHistoryItems.push(historyItem);
            } catch (err) {
              console.error(`Mistral.ai 处理图片 ${file.name} 失败:`, err);
              toast.error(`Mistral.ai 处理图片 ${file.name} 失败`, {
                description: "将尝试其他 OCR 引擎。",
              });
              
              // fallback 到其他OCR
              await fallbackToBuiltinOCR(file, results, imageHistoryItems);
            }
          }
        } else if (useAlicloud) {
          toast.info("使用阿里云 OCR 识别...", {
            description: "正在处理图片中的文字内容"
          });
          
          const alicloudOCR = new AlicloudOCR();
          
          for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            toast.info(`正在处理第 ${i + 1} 张图片...`, {
              description: `文件：${file.name} (阿里云 OCR)`,
            });
            
            try {
              const result = await alicloudOCR.processImage(file);
              results.push(result);
              
              const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
              imageHistoryItems.push(historyItem);
            } catch (err) {
              console.error(`阿里云 OCR 处理图片 ${file.name} 失败:`, err);
              toast.error(`阿里云 OCR 处理图片 ${file.name} 失败`, {
                description: "将使用内置 OCR 引擎重试。",
              });
              
              // fallback 到内置 OCR
              await fallbackToBuiltinOCR(file, results, imageHistoryItems);
            }
          }
        } else {
          // 使用增强 OCR
          toast.info("使用内置 OCR 引擎识别...", {
            description: "正在处理图片中的文字和数学公式"
          });
          
          const enhancedOCR = new EnhancedOCR();
          
          for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            toast.info(`正在处理第 ${i + 1} 张图片...`, {
              description: `文件：${file.name}`,
            });
            
            try {
              const result = await enhancedOCR.processImage(file);
              results.push(result);
              
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
        }
        
        setOcrResults(results);
        
        // 合并所有OCR识别的文本
        const ocrTexts = results.map(r => r.text).filter(t => t.trim());
        if (ocrTexts.length > 0) {
          finalText = ocrTexts.join('\n\n');
          setInputText(finalText);
        }
        
        setIsOcrLoading(false);
        
        if (results.length > 0) {
          const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
          const engineName = useMistral ? 'Mistral.ai' : useAlicloud ? '阿里云 OCR' : '内置OCR';
          toast.success(`成功识别 ${results.length} 张图片`, {
            description: `平均置信度: ${avgConfidence.toFixed(1)}% (${engineName})`,
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
    
    // 如果选择清空优化参数
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

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col">
      <header className="w-full flex justify-between items-center p-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl lg:text-2xl font-bold text-primary">智能识别试题结构</h1>
        <div className="flex items-center gap-4">
          {/* 历史记录面板切换按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHistoryToggle}
            className="lg:hidden"
          >
            {isHistoryOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
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
                {ocrResults.length > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <h3 className="font-semibold mb-2 text-sm">图片 OCR 处理详情</h3>
                    <div className="space-y-3">
                      {ocrResults.map((result, index) => {
                        const isMistral = 'classification' in result && !('features' in result.classification);
                        const isAlicloud = 'classification' in result && 'processingTime' in result && !isMistral;
                        const engineName = isMistral ? 'Mistral.ai' : isAlicloud ? '阿里云 OCR' : '内置OCR';
                        
                        return (
                          <div key={index} className="text-xs space-y-1 text-muted-foreground border-l-2 border-blue-200 pl-3">
                            <div className="font-medium">图片 {index + 1} ({engineName}):</div>
                            <div>OCR 置信度: {result.confidence.toFixed(1)}%</div>
                            <div>处理时间: {result.processingTime}ms</div>
                            <div>检测学科: {result.classification.subject}</div>
                            <div>题型: {result.classification.questionType}</div>
                            <div>分类置信度: {(result.classification.confidence * 100).toFixed(1)}%</div>
                          </div>
                        );
                      })}
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
          </div>

          {/* 右侧：历史记录 - 响应式设计 */}
          {isHistoryOpen && (
            <>
              {/* 遮罩层，仅在小屏幕且历史记录面板打开时显示 */}
              <div 
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={handleOverlayClick}
              />
              
              <div className="w-full fixed inset-y-0 right-0 z-40 bg-background border-l lg:relative lg:w-80 lg:z-auto lg:fixed">
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
        </div>
      </main>
    </div>
  );
};

export default Index;
