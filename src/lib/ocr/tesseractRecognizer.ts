
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    console.log("=== 开始多配置并行OCR识别 ===");
    
    // 配置1: 专门针对中文数学的高精度识别
    const result1 = await this.recognizeWithConfig(imageBlob, {
      name: "中文数学专用",
      languages: ['chi_sim'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz已知函数定义域值域集合方程不等式求解计算证明判断若设对于正实数元素中的理由说明取值范围一二三四五六七八九十零百千万亿是有在了和对上大中小到为不得可以会用从被把这那里个着么什没过又要下去来回还都能与就其所以及将根据可得因为所以由于(),[]{}=+-×÷？。，、（）：；！<>≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇sincostan",
        preserve_interword_spaces: '1',
        language_model_ngram_on: '1',
        textord_really_old_xheight: '1',
        textord_min_xheight: '10'
      }
    });
    results.push(result1);

    // 配置2: 混合语言识别
    const result2 = await this.recognizeWithConfig(imageBlob, {
      name: "中英混合",
      languages: ['chi_sim', 'eng'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        preserve_interword_spaces: '1'
      }
    });
    results.push(result2);

    // 配置3: 纯英文数学公式
    const result3 = await this.recognizeWithConfig(imageBlob, {
      name: "英文公式",
      languages: ['eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωπ∞∟⊥∥∽≈≡→←↑↓<>/\\~`!@#$%&*':;.,sincostan",
        preserve_interword_spaces: '1'
      }
    });
    results.push(result3);

    console.log("=== 所有配置识别完成 ===");
    return results;
  }

  private static async recognizeWithConfig(imageBlob: Blob, config: TesseractConfig): Promise<RecognitionResult> {
    console.log(`开始 ${config.name} 识别配置...`);
    
    const worker = await createWorker(config.languages, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`${config.name}: ${(m.progress * 100).toFixed(1)}%`);
        }
      }
    });

    // 设置OCR参数
    await worker.setParameters({
      tessedit_pageseg_mode: config.psm,
      tessedit_ocr_engine_mode: config.oem,
      user_defined_dpi: config.dpi,
      ...config.params
    });

    const startTime = Date.now();
    const { data: { text, confidence } } = await worker.recognize(imageBlob);
    const processingTime = Date.now() - startTime;
    
    console.log(`${config.name} 识别结果:`, {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      confidence: confidence.toFixed(1) + '%',
      time: processingTime + 'ms',
      length: text.length
    });
    
    await worker.terminate();

    return { text, confidence, config: config.name };
  }
}
