
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    console.log("=== 启动多引擎并行OCR识别 ===");
    
    // 配置1: 超精准中文数学识别
    const result1 = await this.recognizeWithConfig(imageBlob, {
      name: "超精准中文数学",
      languages: ['chi_sim'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz已知函数定义域值域集合方程不等式求解计算证明判断若设对于正实数元素中的理由说明取值范围一二三四五六七八九十零百千万亿分析讨论当时则有的是在和对上下大小到为不得可以会用从被把这那里个着么什没过又要去来回还都能与就其所以及将根据可得因为所以由于因此可知即故综上所述因而(),[]{}=+-×÷？。，、（）：；！<>≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωsincostan",
        preserve_interword_spaces: '1',
        language_model_ngram_on: '1',
        textord_really_old_xheight: '1',
        textord_min_xheight: '8',
        tessedit_write_images: '0',
        user_words_suffix: 'user-words',
        user_patterns_suffix: 'user-patterns'
      }
    });
    results.push(result1);

    // 配置2: 优化版中英混合
    const result2 = await this.recognizeWithConfig(imageBlob, {
      name: "中英混合优化版",
      languages: ['chi_sim', 'eng'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        preserve_interword_spaces: '1',
        textord_noise_normratio: '2',
        textord_noise_sizelimit: '0.5',
        edges_max_children_per_outline: '40'
      }
    });
    results.push(result2);

    // 配置3: 数学公式专用引擎
    const result3 = await this.recognizeWithConfig(imageBlob, {
      name: "数学公式专用",
      languages: ['eng'],
      psm: PSM.SINGLE_LINE,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωπ∞∟⊥∥∽≈≡→←↑↓<>/\\~`!@#$%&*':;.,sincostan",
        preserve_interword_spaces: '0',
        textord_noise_normratio: '1'
      }
    });
    results.push(result3);

    // 配置4: 高密度文本识别
    const result4 = await this.recognizeWithConfig(imageBlob, {
      name: "高密度文本",
      languages: ['chi_sim'],
      psm: PSM.SINGLE_BLOCK_VERT_TEXT,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        preserve_interword_spaces: '1',
        textord_min_linesize: '1.25',
        textord_excess_blobsize: '1.3',
        language_model_penalty_non_dict_word: '0.5'
      }
    });
    results.push(result4);

    // 配置5: 清晰度自适应识别
    const result5 = await this.recognizeWithConfig(imageBlob, {
      name: "清晰度自适应",
      languages: ['chi_sim', 'eng'],
      psm: PSM.AUTO_OSD,
      oem: OEM.LSTM_ONLY,
      dpi: '300',
      params: {
        preserve_interword_spaces: '1',
        textord_tabfind_show_vlines: '0',
        textord_use_cjk_fp_model: '1',
        classify_enable_learning: '0'
      }
    });
    results.push(result5);

    console.log("=== 所有引擎识别完成 ===");
    return results;
  }

  private static async recognizeWithConfig(imageBlob: Blob, config: TesseractConfig): Promise<RecognitionResult> {
    console.log(`正在启动 ${config.name} 识别引擎...`);
    
    const worker = await createWorker(config.languages, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`${config.name}: ${(m.progress * 100).toFixed(1)}%`);
        }
      }
    });

    try {
      // 设置核心OCR参数
      await worker.setParameters({
        tessedit_pageseg_mode: config.psm,
        tessedit_ocr_engine_mode: config.oem,
        user_defined_dpi: config.dpi,
        ...config.params
      });

      const startTime = Date.now();
      const { data: { text, confidence } } = await worker.recognize(imageBlob);
      const processingTime = Date.now() - startTime;
      
      console.log(`${config.name} 识别完成:`, {
        文本预览: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
        置信度: confidence.toFixed(1) + '%',
        耗时: processingTime + 'ms',
        字符数: text.length
      });
      
      return { text, confidence, config: config.name };
    } finally {
      await worker.terminate();
    }
  }
}
