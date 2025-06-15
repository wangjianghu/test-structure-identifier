
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Github, Zap, Image } from "lucide-react";
import { parseQuestion, ParsedQuestion } from "@/lib/parser";
import { AnalysisResult } from "@/components/AnalysisResult";
import { createWorker } from "tesseract.js";
import { toast } from "sonner";

const exampleText = "4.已知集合M={-2,-1,0,1,2},N={x|x²-x-2≤0},则M∩(CRN)=(  )\nA.{-2,-1}\nB.{-2}\nC.{-1,0}\nD.{0}";

const Index = () => {
  const [inputText, setInputText] = useState(exampleText);
  const [analysisResult, setAnalysisResult] = useState<ParsedQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);

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
    toast.info("开始识别图片中的文字...", {
      description: "这可能需要一些时间，请稍候。",
    });
    try {
      const worker = await createWorker('chi_sim');
      const { data: { text } } = await worker.recognize(file);
      setInputText(text);
      toast.success("图片识别成功！");
      await worker.terminate();
    } catch (err) {
      console.error(err);
      toast.error("图片识别失败", {
        description: "无法从图片中提取文字，请检查图片或稍后重试。",
      });
    } finally {
      setIsOcrLoading(false);
    }
  }, [isOcrLoading]);

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
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
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

      <main className="w-full max-w-4xl flex-grow flex flex-col items-center">
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 py-2">
            智能试题结构识别
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            粘贴试题文本或上传图片，即刻获得结构化分析。目前支持数学等学科的基础选择题与主观题识别。
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="在此处粘贴试题文本或图片..."
            className="min-h-[150px] text-base shadow-sm"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button onClick={handleAnalyze} disabled={isLoading || isOcrLoading || !inputText} className="w-full">
              <Zap className="mr-2 h-4 w-4" />
              {isLoading ? "分析中..." : "开始分析"}
            </Button>
            <Button asChild variant="outline" disabled={isOcrLoading} className="cursor-pointer">
              <label htmlFor="file-upload" className="w-full flex items-center justify-center">
                {isOcrLoading ? (
                  "识别中..."
                ) : (
                  <>
                    <Image className="mr-2 h-4 w-4" />
                    从图片识别
                  </>
                )}
                <input id="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" disabled={isOcrLoading} />
              </label>
            </Button>
          </div>
        </div>

        <div className="mt-8 w-full flex justify-center">
          {analysisResult && <AnalysisResult result={analysisResult} />}
        </div>
      </main>
      
      <footer className="w-full max-w-4xl mt-16 text-center text-sm text-muted-foreground py-4">
        <p>由 Lovable AI 强力驱动。</p>
        <p className="text-xs mt-1">注意：分析结果由基本算法生成，可能存在误差，仅供参考。</p>
      </footer>
    </div>
  );
};

export default Index;
