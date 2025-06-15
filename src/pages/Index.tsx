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

  // 图像预处理函数
  const preprocessImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 设置画布尺寸，适当放大以提高清晰度
        const scale = Math.max(1, 1200 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        if (ctx) {
          // 绘制原图
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // 获取图像数据进行处理
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // 图像增强处理
          for (let i = 0; i < data.length; i += 4) {
            // 转换为灰度
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            
            // 增强对比度和二值化
            const threshold = 128;
            const enhanced = gray > threshold ? 255 : 0;
            
            data[i] = enhanced;     // Red
            data[i + 1] = enhanced; // Green  
            data[i + 2] = enhanced; // Blue
            // Alpha保持不变
          }
          
          // 将处理后的图像数据放回画布
          ctx.putImageData(imageData, 0, 0);
        }
        
        // 转换为Blob然后为File
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { type: 'image/png' });
            resolve(processedFile);
          } else {
            resolve(file);
          }
        }, 'image/png');
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const processImageFile = useCallback(async (file: File) => {
    if (isOcrLoading) return;
    setIsOcrLoading(true);
    setAnalysisResult(null);
    toast.info("开始识别图片中的文字...", {
      description: "正在进行图像预处理和文字识别，请稍候。",
    });
    
    try {
      // 图像预处理
      const processedFile = await preprocessImage(file);
      
      // 使用多语言支持，优先中文
      const worker = await createWorker(['chi_sim', 'eng'], 1, {
        logger: m => console.log(m)
      });
      
      // 更精细的OCR参数设置
      await worker.setParameters({
        // 页面分割模式 - 尝试更适合数学公式的模式
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        // OCR引擎模式
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
        // 字符间距和行间距优化
        preserve_interword_spaces: '1',
        textord_min_linesize: '1.0',
        textord_baseline_debug: '0',
        // 字符识别优化
        classify_enable_learning: '0',
        classify_enable_adaptive_matcher: '1',
        // 数字和字母识别增强
        classify_integer_matcher_multiplier: '10',
        // 优化的字符白名单 - 更专注于数学符号
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz一二三四五六七八九十零.,()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ℃℉°′″π∞∟⊥∥∽≈≡→←↑↓⇋⇌⇄⇀⇁∀∃抛物线焦点双曲线渐近线距离已知集合的到线为选择题HClNaOHCaCO₃SO₄NO₃NH₄HNO₃H₂SO₄NaClKBrMgFeAlCuZnAgPbHgCdSnSbBiMnCrNiCoVTiW电子质子中子原子分子离子化合价氧化还原反应溶液浓度摩尔质量阿伏伽德罗常数速度加速度力重力摩擦力弹力压强密度温度热量功率能量动能势能电流电压电阻电容电感磁场磁感应强度波长频率振幅光速声速<>|_^/\\~`!@#$%&*':;？。，、（）「」『』《》【】〈〉〖〗·…\"\"''",
        // DPI优化
        user_defined_dpi: '300',
        // 图像处理优化
        tessedit_do_invert: '0',
        // 单词识别置信度
        tessedit_reject_bad_qual_wds: '1',
        // 字符置信度阈值
        tessedit_good_quality_unrej: '1.1'
      });
      
      const { data: { text, confidence } } = await worker.recognize(processedFile);
      console.log('OCR confidence:', confidence);
      console.log('Original OCR result:', text);
      
      // 强化的后处理逻辑
      let processedText = text
        // 1. 基础字符修正
        .replace(/[，、]/g, ',')
        .replace(/[（]/g, '(')
        .replace(/[）]/g, ')')
        .replace(/[＝]/g, '=')
        .replace(/[－—]/g, '-')
        .replace(/[＋]/g, '+')
        
        // 2. 数学符号的精确修正
        .replace(/[×xX]/g, '×')
        .replace(/[÷/]/g, '÷')
        .replace(/<=|≤/g, '≤')
        .replace(/>=|≥/g, '≥')
        .replace(/!=|≠/g, '≠')
        .replace(/sqrt|√/g, '√')
        .replace(/infinity|∞/g, '∞')
        .replace(/∈/g, '∈')
        .replace(/∉/g, '∉')
        .replace(/∩/g, '∩')
        .replace(/∪/g, '∪')
        .replace(/⊂/g, '⊂')
        .replace(/⊃/g, '⊃')
        
        // 3. 上标下标的智能识别和修正
        .replace(/\^2|²|2²/g, '²')
        .replace(/\^3|³|3³/g, '³')
        .replace(/\^4|⁴|4⁴/g, '⁴')
        .replace(/\^1|¹|1¹/g, '¹')
        .replace(/\^0|⁰|0⁰/g, '⁰')
        
        // 4. 变量和系数的修正
        .replace(/([a-zA-Z])\s*(\d)/g, '$1$2')  // 变量后紧跟数字
        .replace(/(\d)\s*([a-zA-Z])/g, '$1$2')  // 数字后紧跟变量
        
        // 5. 分数表示的修正
        .replace(/(\d+)\s*[\/丿]\s*(\d+)/g, '$1/$2')
        .replace(/1\s*[\/丿]\s*2/g, '1/2')
        .replace(/1\s*[\/丿]\s*3/g, '1/3')
        .replace(/1\s*[\/丿]\s*4/g, '1/4')
        
        // 6. 根号表达式修正
        .replace(/sqrt\s*\(([^)]+)\)/g, '√($1)')
        .replace(/√\s*([a-zA-Z0-9]+)/g, '√$1')
        
        // 7. 绝对值符号修正
        .replace(/\|\s*([^|]+)\s*\|/g, '|$1|')
        
        // 8. 向量符号修正
        .replace(/→\s*([a-zA-Z])/g, '→$1')
        .replace(/([a-zA-Z])\s*→/g, '$1→')
        
        // 9. 角度和弧度修正
        .replace(/π\s*\/\s*(\d+)/g, 'π/$1')
        .replace(/(\d+)\s*π/g, '$1π')
        
        // 10. 化学公式特殊修正
        .replace(/H\s*2\s*O/g, 'H₂O')
        .replace(/CO\s*2/g, 'CO₂')
        .replace(/SO\s*4/g, 'SO₄')
        .replace(/NO\s*3/g, 'NO₃')
        .replace(/NH\s*4/g, 'NH₄')
        .replace(/CaCO\s*3/g, 'CaCO₃')
        
        // 11. 常见错误字符替换
        .replace(/[Oo0]/g, (match, offset, string) => {
          // 上下文判断：如果前后是数字，则为0；如果是字母，则为O
          const before = string[offset - 1];
          const after = string[offset + 1];
          if (/\d/.test(before) || /\d/.test(after)) return '0';
          if (/[a-zA-Z]/.test(before) || /[a-zA-Z]/.test(after)) return 'O';
          return match;
        })
        
        // 12. 题号和选项格式修正
        .replace(/^\s*(\d+)\s*[.\uff0e]\s*/gm, '$1. ')
        .replace(/\s*([A-D])\s*[.\uff0e:：]\s*/g, '\n$1. ')
        
        // 13. 空格清理
        .replace(/\s+/g, ' ')
        .replace(/\n\s+/g, '\n')
        .replace(/\s+\n/g, '\n')
        .trim();
      
      // 14. 智能的学科术语修正
      const mathTerms = {
        '设': '设',
        '则': '则',
        '已知': '已知',
        '求': '求',
        '证明': '证明',
        '解': '解',
        '某圆锥': '某圆锥',
        '母线': '母线',
        '底面': '底面',
        '半径': '半径',
        '高': '高',
        '体积': '体积',
        '表面积': '表面积'
      };
      
      for (const [wrong, correct] of Object.entries(mathTerms)) {
        const regex = new RegExp(wrong.split('').join('\\s*'), 'g');
        processedText = processedText.replace(regex, correct);
      }
      
      console.log('Processed OCR result:', processedText);
      
      // 识别置信度检查
      if (confidence < 60) {
        toast.warning("识别置信度较低", {
          description: `置信度: ${confidence.toFixed(1)}%，建议检查识别结果并手动调整。`,
        });
      }
      
      setInputText(processedText);
      toast.success("图片识别完成！", {
        description: `识别置信度: ${confidence.toFixed(1)}%`,
      });
      await worker.terminate();
    } catch (err) {
      console.error(err);
      toast.error("图片识别失败", {
        description: "无法从图片中提取文字，请检查图片质量或稍后重试。",
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
