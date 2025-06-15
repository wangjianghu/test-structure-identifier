
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    // 配置1: 高精度中文识别
    preprocessingSteps.push("配置1: 高精度中文识别");
    const result1 = await this.recognizeWithConfig(imageBlob, {
      name: "高精度中文",
      languages: ['chi_sim'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz已知函数定义域值域集合方程不等式求解计算证明判断若设对于正实数元素中的理由说明取值范围一二三四五六七八九十零百千万亿是有在了和对上大中小到为不得可以会用从被把这那里个着么什没过又要下去来回还都能与就其所以及将根据可得因为所以由于的()[]{}=+-×÷？。，、（）「」『』《》【】〈〉〖〗·…\"\"''：；！",
        preserve_interword_spaces: '1',
        language_model_ngram_on: '1',
        language_model_ngram_order: '8'
      }
    });
    results.push(result1);

    // 配置2: 数学公式识别
    preprocessingSteps.push("配置2: 数学公式识别");
    const result2 = await this.recognizeWithConfig(imageBlob, {
      name: "数学公式",
      languages: ['eng', 'equ'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωπ∞∟⊥∥∽≈≡→←↑↓⇋⇌⇄⇀⇁∀∃<>|_^/\\~`!@#$%&*':;.,sin cos tan log ln exp lim frac sum int sqrt",
        preserve_interword_spaces: '1'
      }
    });
    results.push(result2);

    // 配置3: 混合语言识别
    preprocessingSteps.push("配置3: 混合语言识别");
    const result3 = await this.recognizeWithConfig(imageBlob, {
      name: "混合语言",
      languages: ['chi_sim', 'eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        preserve_interword_spaces: '1',
        language_model_ngram_on: '1'
      }
    });
    results.push(result3);

    return results;
  }

  private static async recognizeWithConfig(imageBlob: Blob, config: TesseractConfig): Promise<RecognitionResult> {
    const worker = await createWorker(config.languages, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`${config.name}: 识别进度 ${(m.progress * 100).toFixed(1)}%`);
        }
      }
    });

    await worker.setParameters({
      tessedit_pageseg_mode: config.psm,
      tessedit_ocr_engine_mode: config.oem,
      user_defined_dpi: config.dpi,
      ...config.params
    });

    console.log(`开始 ${config.name} 识别...`);
    const { data: { text, confidence } } = await worker.recognize(imageBlob);
    console.log(`${config.name} 识别完成，置信度: ${confidence}%，文本: ${text.substring(0, 50)}...`);
    
    await worker.terminate();

    return { text, confidence, config: config.name };
  }
}
