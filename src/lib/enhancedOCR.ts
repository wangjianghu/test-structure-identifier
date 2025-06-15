
import { createWorker, PSM, OEM } from "tesseract.js";
import { ImagePreprocessor } from "./imagePreprocessor";
import { QuestionClassifier, ClassificationResult } from "./questionClassifier";

export interface OCRResult {
  text: string;
  confidence: number;
  classification: ClassificationResult;
  preprocessingSteps: string[];
  processingTime: number;
}

export class EnhancedOCR {
  private preprocessor: ImagePreprocessor;
  private classifier: QuestionClassifier;

  constructor() {
    this.preprocessor = new ImagePreprocessor();
    this.classifier = new QuestionClassifier();
  }

  async processImage(file: File): Promise<OCRResult> {
    const startTime = Date.now();
    const preprocessingSteps: string[] = [];

    try {
      // 1. 图像预处理
      preprocessingSteps.push("开始图像预处理");
      const preprocessedFile = await this.preprocessor.preprocessImage(file);
      preprocessingSteps.push("图像预处理完成");

      // 2. 优化的 Tesseract 配置 - 专门针对中文教育材料
      preprocessingSteps.push("初始化中文优化 OCR 引擎");
      const worker = await createWorker(['chi_sim', 'chi_tra', 'eng'], 1, {
        logger: m => console.log('Tesseract:', m)
      });

      // 专门针对中文教育文档的高级配置
      await worker.setParameters({
        // 页面分割模式 - 自动检测方向和文档结构
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        // OCR引擎模式 - 使用最新的LSTM神经网络
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
        // 中文文本优化
        textord_equation_detect: '1',
        textord_tabfind_find_tables: '1',
        // 保持字符间距和结构
        preserve_interword_spaces: '1',
        // 针对中文和教育材料优化的字符集
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz一二三四五六七八九十零百千万亿的是有在了和对上大中小到为不得可以会用从被把这那里个了着么什没了已过又要下去来回还都能与就其所以及将对于文本题目阅读理解分析答案选择填空判断证明计算求解方程式函数化学物理数学语文英语历史地理政治生物艺术体育.,()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΕΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ℃℉°′″π∞∟⊥∥∽≈≡→←↑↓⇋⇌⇄⇀⇁∀∃<>|_^/\\~`!@#$%&*':;？。，、（）「」『』《》【】〈〉〖〗·…\"\"''：；！",
        // 提高DPI设置以更好识别中文字符
        user_defined_dpi: '600',
        // 质量控制参数
        tessedit_reject_bad_qual_wds: '0',
        tessedit_good_quality_unrej: '0.8',
        // 字符置信度优化
        classify_character_fragments_garbage_certainty_threshold: '30',
        // 针对中文的特殊设置
        tessedit_reject_fullstops: '0',
        tessedit_reject_suspect_fullstops: '0',
        // 启用中文优化
        language_model_penalty_non_freq_dict_word: '0.1',
        language_model_penalty_non_dict_word: '0.15',
        // 文本行检测优化
        textord_heavy_nr: '1',
        textord_min_linesize: '2.5'
      });

      preprocessingSteps.push("开始高精度中文识别");
      
      // 3. 执行 OCR
      const { data: { text, confidence } } = await worker.recognize(preprocessedFile);
      
      console.log('原始 OCR 结果:', text);
      console.log('OCR 置信度:', confidence);
      
      preprocessingSteps.push(`OCR 识别完成，置信度: ${confidence.toFixed(1)}%`);

      // 4. 智能后处理 - 专门针对中文教育材料
      preprocessingSteps.push("开始中文智能文本后处理");
      const processedText = this.intelligentChinesePostProcess(text);
      
      preprocessingSteps.push("中文文本后处理完成");

      // 5. 文本分类
      preprocessingSteps.push("开始教育内容分类分析");
      const classification = this.classifier.classify(processedText);
      
      preprocessingSteps.push(`分类完成: ${classification.isQuestion ? '检测到试题' : '未检测到试题'} (置信度: ${(classification.confidence * 100).toFixed(1)}%)`);

      await worker.terminate();

      const processingTime = Date.now() - startTime;

      return {
        text: processedText,
        confidence,
        classification,
        preprocessingSteps,
        processingTime
      };
    } catch (error) {
      console.error('Enhanced OCR 处理失败:', error);
      throw error;
    }
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
      // 数字题号修正
      [/(\d+)\s*[.\uff0e]\s*/g, '$1. '],
      // 选项格式修正  
      [/\s*([A-D])\s*[.\uff0e:：]\s*/g, '\n$1. '],
      // 括号题号修正
      [/\(\s*(\d+)\s*\)/g, '($1)'],
      // 常见中文标点修正
      [/[""]/g, '"'],
      [/['']/g, "'"],
      [/[。]/g, '。'],
      [/[？]/g, '？'],
      [/[！]/g, '！'],
      // 修复常见的字符识别错误
      [/BR/g, '地'],
      [/EN/g, '在'],
      [/TE/g, '的'],
      [/RE/g, '要'],
      [/TH/g, '中'],
      [/×E/g, '×'],
      [/÷LE/g, '÷'],
      [/HE/g, '可'],
      [/BE/g, '不']
    ];

    chineseCorrections.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern, replacement);
    });

    // 3. 移除明显的乱码（连续的大写字母或无意义字符）
    processedText = processedText
      .replace(/[A-Z]{5,}/g, '')
      .replace(/[~`|]{2,}/g, '')
      .replace(/[_]{3,}/g, '______')
      .replace(/[×÷=]{3,}/g, '');

    // 4. 智能断句和段落整理
    processedText = processedText
      .replace(/([。？！])\s*([一二三四五六七八九十\d]+[.\uff0e])/g, '$1\n\n$2')
      .replace(/([。？！])\s*([A-D][.\uff0e])/g, '$1\n$2')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();

    // 5. 常见教育术语修正
    const educationTerms: Array<[RegExp, string]> = [
      [/阅读下面/gi, '阅读下面'],
      [/根据要求/gi, '根据要求'],
      [/请写一篇/gi, '请写一篇'],
      [/不少于/gi, '不少于'],
      [/字数要求/gi, '字数要求'],
      [/材料引发/gi, '材料引发'],
      [/体现你的/gi, '体现你的']
    ];

    educationTerms.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern, replacement);
    });

    return processedText;
  }

  destroy(): void {
    this.preprocessor.destroy();
  }
}
