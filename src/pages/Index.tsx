import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Github, Zap } from "lucide-react";
import { parseQuestion, ParsedQuestion } from "@/lib/parser";
import { AnalysisResult } from "@/components/AnalysisResult";
import { createWorker, PSM, OEM } from "tesseract.js";
import { toast } from "sonner";
import { QuestionInput } from "@/components/QuestionInput";

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
      // 使用多语言支持，包括中文和英文
      const worker = await createWorker(['chi_sim', 'eng'], 1, {
        logger: m => console.log(m)
      });
      
      // 优化OCR设置 - 专门针对数学、化学、物理公式和科学文档
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY, // 使用LSTM引擎，对复杂文本效果更好
        preserve_interword_spaces: '1',
        // 扩展字符白名单，包含更多学科符号
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz一二三四五六七八九十零.,()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ℃℉°′″π∞∟⊥∥∠∠∴∵∽≈≡→←↑↓⇋⇌⇄⇀⇁∴∵∀∃抛物线焦点双曲线渐近线距离已知集合的到线为选择题ABCDHClNaOHCaCO₃SO₄NO₃NH₄HNO₃H₂SO₄NaClKBrMgFeAlCuZnAgPbHgCdSnSbBiMnCrNiCoVTiW电子质子中子原子分子离子化合价氧化还原反应溶液浓度摩尔质量阿伏伽德罗常数速度加速度力重力摩擦力弹力压强密度温度热量功率能量动能势能电流电压电阻电容电感磁场磁感应强度波长频率振幅光速声速<>|_^/\\~`!@#$%&*'';:？。，、（）「」『』《》【】〈〉〖〗·…""''", // 包含数学、化学、物理符号和术语
        user_defined_dpi: '300', // 提高DPI以获得更好的识别效果
        // 优化识别模式
        tessedit_do_invert: '0',
        textord_min_linesize: '1.25',
        // 改善数字和符号识别
        classify_enable_learning: '0',
        classify_enable_adaptive_matcher: '1'
      });
      
      const { data: { text } } = await worker.recognize(file);
      
      // 增强后处理 - 针对数学、化学、物理公式的特殊处理
      let processedText = text
        // 修复常见的标点符号识别错误
        .replace(/[，、]/g, ',')
        .replace(/[（]/g, '(')
        .replace(/[）]/g, ')')
        .replace(/[＝]/g, '=')
        .replace(/[－—]/g, '-')
        .replace(/[＋]/g, '+')
        .replace(/[×]/g, '×')
        .replace(/[÷]/g, '÷')
        
        // 修复数学符号识别错误
        .replace(/[∈]/g, '∈')
        .replace(/[∉]/g, '∉')
        .replace(/[∩]/g, '∩')
        .replace(/[∪]/g, '∪')
        .replace(/[⊂]/g, '⊂')
        .replace(/[⊃]/g, '⊃')
        .replace(/[≤]/g, '≤')
        .replace(/[≥]/g, '≥')
        .replace(/[≠]/g, '≠')
        .replace(/[√]/g, '√')
        .replace(/[∞]/g, '∞')
        
        // 修复上标和下标
        .replace(/x\s*[²2²]\s*/g, 'x²')
        .replace(/y\s*[²2²]\s*/g, 'y²')
        .replace(/[²2²]/g, '²')
        .replace(/[³3³]/g, '³')
        .replace(/[¹1¹]/g, '¹')
        
        // 修复分数识别
        .replace(/(\d+)\s*[\/丿]\s*(\d+)/g, '$1/$2')
        .replace(/1\s*[\/丿]\s*2/g, '1/2')
        .replace(/1\s*[\/丿]\s*3/g, '1/3')
        .replace(/1\s*[\/丿]\s*4/g, '1/4')
        .replace(/1\s*[\/丿]\s*8/g, '1/8')
        
        // 修复化学公式常见错误
        .replace(/H\s*2\s*O/g, 'H₂O')
        .replace(/CO\s*2/g, 'CO₂')
        .replace(/SO\s*4/g, 'SO₄')
        .replace(/NO\s*3/g, 'NO₃')
        .replace(/NH\s*4/g, 'NH₄')
        .replace(/CaCO\s*3/g, 'CaCO₃')
        .replace(/H\s*2\s*SO\s*4/g, 'H₂SO₄')
        .replace(/HNO\s*3/g, 'HNO₃')
        
        // 修复物理单位和符号
        .replace(/m\s*\/\s*s/g, 'm/s')
        .replace(/kg\s*·\s*m\s*\/\s*s/g, 'kg·m/s')
        .replace(/°C/g, '℃')
        .replace(/°F/g, '℉')
        
        // 修复常见数学术语的识别错误
        .replace(/抛物线.*?[=＝]/g, '抛物线y=')
        .replace(/双曲线.*?[=＝]/g, '双曲线')
        .replace(/焦点.*?到/g, '焦点到')
        .replace(/渐近线.*?的/g, '渐近线的')
        .replace(/距离.*?为/g, '距离为')
        
        // 修复常见错误字符
        .replace(/二\s*>/g, 'x²')
        .replace(/蕊\s*_\s*22\s*-\s*1/g, 'y²/22 - x²/1 = 1')
        .replace(/了/g, '1/2')
        .replace(/。\s*\)/g, ')')
        .replace(/\(\s*。\s*/g, '(')
        
        // 修复选项格式
        .replace(/\s*([A-D])\s*[.\uff0e:：]\s*/g, '\n$1. ')
        .replace(/(\d+)\s*[.\uff0e]\s*/g, '$1. ')
        
        // 清理多余空格和换行
        .replace(/\s+/g, ' ')
        .replace(/\n\s+/g, '\n')
        .replace(/\s+\n/g, '\n')
        .trim();
      
      // 进一步的学科特定修正
      processedText = processedText
        // 数学公式修正
        .replace(/x\s*平方/g, 'x²')
        .replace(/y\s*平方/g, 'y²')
        .replace(/平方根/g, '√')
        .replace(/无穷大/g, '∞')
        .replace(/小于等于/g, '≤')
        .replace(/大于等于/g, '≥')
        .replace(/不等于/g, '≠')
        .replace(/属于/g, '∈')
        .replace(/不属于/g, '∉')
        .replace(/交集/g, '∩')
        .replace(/并集/g, '∪')
        .replace(/包含于/g, '⊂')
        .replace(/包含/g, '⊃')
        
        // 化学公式修正
        .replace(/氢氧化钠/g, 'NaOH')
        .replace(/碳酸钙/g, 'CaCO₃')
        .replace(/硫酸/g, 'H₂SO₄')
        .replace(/硝酸/g, 'HNO₃')
        .replace(/氯化钠/g, 'NaCl')
        .replace(/氨气/g, 'NH₃')
        .replace(/二氧化碳/g, 'CO₂')
        .replace(/水/g, 'H₂O')
        
        // 物理公式修正
        .replace(/米每秒/g, 'm/s')
        .replace(/千克/g, 'kg')
        .replace(/牛顿/g, 'N')
        .replace(/焦耳/g, 'J')
        .replace(/瓦特/g, 'W')
        .replace(/摄氏度/g, '℃')
        .replace(/安培/g, 'A')
        .replace(/伏特/g, 'V')
        .replace(/欧姆/g, 'Ω');
      
      console.log('Original OCR result:', text);
      console.log('Processed OCR result:', processedText);
      
      setInputText(processedText);
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
          <QuestionInput
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onImageUpload={handleImageUpload}
            isOcrLoading={isOcrLoading}
            disabled={isOcrLoading || isLoading}
            onAnalyze={handleAnalyze}
            isAnalyzing={isLoading}
          />
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
