
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

      // 2. 优化的 Tesseract 配置
      preprocessingSteps.push("初始化 OCR 引擎");
      const worker = await createWorker(['chi_sim', 'eng'], 1, {
        logger: m => console.log('Tesseract:', m)
      });

      // 配置专门针对学术文档的 OCR 参数
      await worker.setParameters({
        // 页面分割模式
        tessedit_pageseg_mode: PSM.AUTO_OSD,
        // OCR引擎模式
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
        // 文本方向检测
        textord_equation_detect: '1',
        textord_tabfind_find_tables: '1',
        // 保持字符间距
        preserve_interword_spaces: '1',
        // 优化的字符白名单
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz一二三四五六七八九十零.,()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ℃℉°′″π∞∟⊥∥∽≈≡→←↑↓⇋⇌⇄⇀⇁∀∃抛物线焦点双曲线渐近线距离已知集合的到线为选择题HClNaOHCaCO₃SO₄NO₃NH₄HNO₃H₂SO₄NaClKBrMgFeAlCuZnAgPbHgCdSnSbBiMnCrNiCoVTiW电子质子中子原子分子离子化合价氧化还原反应溶液浓度摩尔质量阿伏伽德罗常数速度加速度力重力摩擦力弹力压强密度温度热量功率能量动能势能电流电压电阻电容电感磁场磁感应强度波长频率振幅光速声速证明解答计算求解分析说明讨论比较判断填空简答<>|_^/\\~`!@#$%&*':;？。，、（）「」『』《》【】〈〉〖〗·…\"\"''",
        // DPI设置
        user_defined_dpi: '400',
        // 质量控制
        tessedit_reject_bad_qual_wds: '1',
        tessedit_good_quality_unrej: '1.1',
        // 字符置信度
        classify_character_fragments_garbage_certainty_threshold: '50',
        // 单词置信度
        tessedit_reject_fullstops: '0',
        tessedit_reject_suspect_fullstops: '0'
      });

      preprocessingSteps.push("开始文字识别");
      
      // 3. 执行 OCR
      const { data: { text, confidence } } = await worker.recognize(preprocessedFile);
      
      console.log('原始 OCR 结果:', text);
      console.log('OCR 置信度:', confidence);
      
      preprocessingSteps.push(`OCR 识别完成，置信度: ${confidence.toFixed(1)}%`);

      // 4. 智能后处理
      preprocessingSteps.push("开始智能文本后处理");
      const processedText = this.intelligentPostProcess(text);
      
      preprocessingSteps.push("文本后处理完成");

      // 5. 文本分类
      preprocessingSteps.push("开始文本分类分析");
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

  private intelligentPostProcess(text: string): string {
    let processedText = text;

    // 1. 基础符号修正
    processedText = processedText
      .replace(/[，、]/g, ',')
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')')
      .replace(/[＝]/g, '=')
      .replace(/[－—]/g, '-')
      .replace(/[＋]/g, '+');

    // 2. 数学符号智能修正
    const mathCorrections = [
      [/[×xX*]/g, '×'],
      [/[÷/]/g, '÷'],
      [/<=|≤/g, '≤'],
      [/>=|≥/g, '≥'],
      [/!=|≠/g, '≠'],
      [/sqrt|√/g, '√'],
      [/infinity|∞/g, '∞'],
      [/\^2|²/g, '²'],
      [/\^3|³/g, '³'],
      [/\^1|¹/g, '¹'],
      [/\^0|⁰/g, '⁰']
    ];

    mathCorrections.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern, replacement);
    });

    // 3. 变量和公式修正
    processedText = processedText
      .replace(/([a-zA-Z])\s*(\d)/g, '$1$2')
      .replace(/(\d)\s*([a-zA-Z])/g, '$1$2')
      .replace(/(\d+)\s*[\/丿]\s*(\d+)/g, '$1/$2');

    // 4. 化学公式修正
    const chemicalCorrections = [
      [/H\s*2\s*O/g, 'H₂O'],
      [/CO\s*2/g, 'CO₂'],
      [/SO\s*4/g, 'SO₄'],
      [/NO\s*3/g, 'NO₃'],
      [/NH\s*4/g, 'NH₄'],
      [/CaCO\s*3/g, 'CaCO₃'],
      [/H\s*2\s*SO\s*4/g, 'H₂SO₄'],
      [/HNO\s*3/g, 'HNO₃']
    ];

    chemicalCorrections.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern, replacement);
    });

    // 5. 选项格式修正
    processedText = processedText
      .replace(/\s*([A-D])\s*[.\uff0e:：]\s*/g, '\n$1. ')
      .replace(/^\s*(\d+)\s*[.\uff0e]\s*/gm, '$1. ');

    // 6. 空格和换行清理
    processedText = processedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\s+\n/g, '\n')
      .trim();

    return processedText;
  }

  destroy(): void {
    this.preprocessor.destroy();
  }
}
