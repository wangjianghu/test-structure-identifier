
import { OCRResult } from "./enhancedOCR";
import { QuestionClassifier } from "./questionClassifier";

export interface MathpixConfig {
  appId: string;
  appKey: string;
}

export interface MathpixResponse {
  text: string;
  confidence: number;
  latex?: string;
  mathml?: string;
}

export class MathpixOCR {
  private config: MathpixConfig;
  private classifier: QuestionClassifier;

  constructor(config: MathpixConfig) {
    this.config = config;
    this.classifier = new QuestionClassifier();
  }

  async processImage(file: File): Promise<OCRResult> {
    const startTime = Date.now();
    const preprocessingSteps: string[] = [];

    try {
      preprocessingSteps.push("开始 Mathpix 高精度识别");
      
      // 将文件转换为 base64
      const base64Data = await this.fileToBase64(file);
      
      preprocessingSteps.push("图片预处理完成，发送到 Mathpix");
      
      // 调用 Mathpix API
      const response = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: {
          'app_id': this.config.appId,
          'app_key': this.config.appKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: base64Data,
          formats: ['text', 'latex_styled'],
          data_options: {
            include_asciimath: true,
            include_latex: true
          },
          // 针对中文和教育材料的优化设置
          ocr_options: {
            math_inline_delimiters: ['$', '$'],
            math_display_delimiters: ['$$', '$$'],
            rm_spaces: true,
            rm_fonts: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Mathpix API 错误: ${response.status} ${response.statusText}`);
      }

      const mathpixResult = await response.json();
      
      preprocessingSteps.push(`Mathpix 识别完成，置信度: ${(mathpixResult.confidence * 100).toFixed(1)}%`);
      
      // 处理识别结果
      let processedText = mathpixResult.text || '';
      
      // 如果有 LaTeX，尝试转换为更易读的格式
      if (mathpixResult.latex_styled) {
        processedText = this.enhanceTextWithLatex(processedText, mathpixResult.latex_styled);
      }
      
      preprocessingSteps.push("开始智能文本后处理");
      
      // 应用中文优化后处理
      processedText = this.intelligentChinesePostProcess(processedText);
      
      preprocessingSteps.push("文本后处理完成");
      
      // 文本分类
      preprocessingSteps.push("开始教育内容分类分析");
      const classification = this.classifier.classify(processedText);
      
      preprocessingSteps.push(`分类完成: ${classification.isQuestion ? '检测到试题' : '未检测到试题'} (置信度: ${(classification.confidence * 100).toFixed(1)}%)`);

      const processingTime = Date.now() - startTime;

      return {
        text: processedText,
        confidence: mathpixResult.confidence * 100,
        classification,
        preprocessingSteps,
        processingTime
      };
    } catch (error) {
      console.error('Mathpix OCR 处理失败:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private enhanceTextWithLatex(text: string, latex: string): string {
    // 如果原文本很短或者主要是符号，优先使用 LaTeX 渲染的结果
    if (text.length < 20 || /^[\s\d+\-=<>(){}[\]\/\\^_]*$/.test(text)) {
      // 将常见的 LaTeX 符号转换为 Unicode
      return this.latexToUnicode(latex);
    }
    return text;
  }

  private latexToUnicode(latex: string): string {
    const conversions: Array<[RegExp, string]> = [
      // 希腊字母
      [/\\alpha/g, 'α'],
      [/\\beta/g, 'β'],
      [/\\gamma/g, 'γ'],
      [/\\delta/g, 'δ'],
      [/\\epsilon/g, 'ε'],
      [/\\theta/g, 'θ'],
      [/\\lambda/g, 'λ'],
      [/\\mu/g, 'μ'],
      [/\\pi/g, 'π'],
      [/\\sigma/g, 'σ'],
      [/\\phi/g, 'φ'],
      [/\\omega/g, 'ω'],
      
      // 数学符号
      [/\\infty/g, '∞'],
      [/\\sum/g, '∑'],
      [/\\int/g, '∫'],
      [/\\sqrt\{([^}]+)\}/g, '√($1)'],
      [/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)'],
      [/\\leq/g, '≤'],
      [/\\geq/g, '≥'],
      [/\\neq/g, '≠'],
      [/\\in/g, '∈'],
      [/\\notin/g, '∉'],
      [/\\subset/g, '⊂'],
      [/\\supset/g, '⊃'],
      [/\\cap/g, '∩'],
      [/\\cup/g, '∪'],
      [/\\emptyset/g, '∅'],
      
      // 上下标
      [/\^(\d+)/g, '$1'],
      [/\_(\d+)/g, '$1'],
      
      // 清理多余的 LaTeX 命令
      [/\\[a-zA-Z]+\{([^}]*)\}/g, '$1'],
      [/[{}]/g, ''],
      [/\\\\/g, ''],
    ];

    let result = latex;
    conversions.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });

    return result;
  }

  private intelligentChinesePostProcess(text: string): string {
    let processedText = text;

    // 1. 清理常见OCR错误字符
    processedText = processedText
      .replace(/[~`]/g, '')
      .replace(/\|/g, '')
      .replace(/[×xX*]/g, '×')
      .replace(/[÷/]/g, '÷')
      .replace(/[，、]/g, '，')
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')')
      .replace(/[＝]/g, '=')
      .replace(/[－—]/g, '-')
      .replace(/[＋]/g, '+');

    // 2. 修复常见的中文OCR错误
    const chineseCorrections: Array<[RegExp, string]> = [
      [/(\d+)\s*[.\uff0e]\s*/g, '$1. '],
      [/\s*([A-D])\s*[.\uff0e:：]\s*/g, '\n$1. '],
      [/\(\s*(\d+)\s*\)/g, '($1)'],
      [/[""]/g, '"'],
      [/['']/g, "'"],
      [/[。]/g, '。'],
      [/[？]/g, '？'],
      [/[！]/g, '！']
    ];

    chineseCorrections.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern, replacement);
    });

    // 3. 智能断句和段落整理
    processedText = processedText
      .replace(/([。？！])\s*([一二三四五六七八九十\d]+[.\uff0e])/g, '$1\n\n$2')
      .replace(/([。？！])\s*([A-D][.\uff0e])/g, '$1\n$2')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();

    return processedText;
  }

  static isConfigured(): boolean {
    const appId = localStorage.getItem('mathpix_app_id');
    const appKey = localStorage.getItem('mathpix_app_key');
    return !!(appId && appKey);
  }

  static getConfig(): MathpixConfig | null {
    const appId = localStorage.getItem('mathpix_app_id');
    const appKey = localStorage.getItem('mathpix_app_key');
    
    if (appId && appKey) {
      return { appId, appKey };
    }
    
    return null;
  }
}
