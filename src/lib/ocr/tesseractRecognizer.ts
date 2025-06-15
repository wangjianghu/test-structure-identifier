
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    // 配置1: 超高精度中文数学
    preprocessingSteps.push("配置1: 启动超高精度中文数学识别");
    const result1 = await this.recognizeWithConfig(imageBlob, {
      name: "超高精度中文数学",
      languages: ['chi_sim', 'eng', 'equ'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '2400',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz已知函数定义域值域集合方程不等式求解计算证明判断若设对于正实数元素中的理由说明取值范围sin cos tan log ln exp sqrt frac sum int lim一二三四五六七八九十零百千万亿是有在了和对上大中小到为不得可以会用从被把这那里个着么什没过又要下去来回还都能与就其所以及将根据可得因为所以由于的×÷=+-()[]{}≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΕΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ℃℉°′″π∞∟⊥∥∽≈≡→←↑↓⇋⇌⇄⇀⇁∀∃<>|_^/\\~`!@#$%&*':;？。，、（）「」『』《》【】〈〉〖〗·…\"\"''：；！",
        textord_equation_detect: '1',
        textord_tabfind_find_tables: '1',
        preserve_interword_spaces: '1',
        language_model_ngram_on: '1',
        language_model_ngram_order: '8',
        classify_enable_adaptive_matcher: '1',
        classify_enable_learning: '1',
        segment_penalty_dict_nonword: '0.5',
        segment_penalty_garbage: '0.8',
        user_words_suffix: "user-words",
        edges_max_children_per_outline: '100',
        textord_min_linesize: '0.3'
      }
    });
    results.push(result1);

    // 配置2: 数学公式专用识别
    preprocessingSteps.push("配置2: 启动数学公式专用识别");
    const result2 = await this.recognizeWithConfig(imageBlob, {
      name: "数学公式专用",
      languages: ['eng', 'equ'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '3000',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΕΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩπ∞∟⊥∥∽≈≡→←↑↓⇋⇌⇄⇀⇁∀∃<>|_^/\\~`!@#$%&*':;.,sin cos tan log ln exp lim frac sum int sqrt",
        textord_equation_detect: '1',
        textord_tabfind_find_tables: '0',
        preserve_interword_spaces: '1',
        edges_max_children_per_outline: '150',
        textord_min_linesize: '0.2'
      }
    });
    results.push(result2);

    // 配置3: 中文文本专用识别
    preprocessingSteps.push("配置3: 启动中文文本专用识别");
    const result3 = await this.recognizeWithConfig(imageBlob, {
      name: "中文文本专用",
      languages: ['chi_sim'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '1800',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz已知函数定义域值域集合方程不等式求解计算证明判断若设对于正实数元素中的理由说明取值范围一二三四五六七八九十零百千万亿是有在了和对上大中小到为不得可以会用从被把这那里个着么什没过又要下去来回还都能与就其所以及将根据可得因为所以由于的()[]{}=+-×÷？。，、（）「」『』《》【】〈〉〖〗·…\"\"''：；！",
        language_model_ngram_on: '1',
        language_model_ngram_order: '8',
        classify_enable_adaptive_matcher: '1'
      }
    });
    results.push(result3);

    // 配置4: 混合高精度识别
    preprocessingSteps.push("配置4: 启动混合高精度识别");
    const result4 = await this.recognizeWithConfig(imageBlob, {
      name: "混合高精度",
      languages: ['chi_sim', 'eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '2000',
      params: {
        preserve_interword_spaces: '1',
        language_model_ngram_on: '1',
        classify_enable_adaptive_matcher: '1'
      }
    });
    results.push(result4);

    return results;
  }

  private static async recognizeWithConfig(imageBlob: Blob, config: TesseractConfig): Promise<RecognitionResult> {
    const worker = await createWorker(config.languages, 1, {
      logger: m => console.log(`${config.name}:`, m)
    });

    await worker.setParameters({
      tessedit_pageseg_mode: config.psm,
      tessedit_ocr_engine_mode: config.oem,
      user_defined_dpi: config.dpi,
      ...config.params
    });

    const { data: { text, confidence } } = await worker.recognize(imageBlob);
    await worker.terminate();

    return { text, confidence, config: config.name };
  }
}
