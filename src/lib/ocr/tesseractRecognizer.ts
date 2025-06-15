
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    console.log("=== 启动超级中文数学OCR识别引擎 ===");
    
    // 配置1: 极致优化的中文数学识别
    const result1 = await this.recognizeWithConfig(imageBlob, {
      name: "超级中文数学",
      languages: ['chi_sim', 'eng'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz已知函数定义域值域集合方程不等式求解计算证明判断分析讨论若设对于正实数元素中的理由说明取值范围一二三四五六七八九十零百千万亿当时则有是在和对上下大小到为不得可以会用从被把这那里个着么什没过又要去来回还都能与就其所以及将根据可得因为所以由于因此可知即故综上所述(),[]{}=+-×÷？。，、（）：；！<>≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωsincostan",
        language_model_penalty_non_freq_dict_word: '0.1',
        language_model_penalty_non_dict_word: '0.15',
        load_system_dawg: '1',
        load_freq_dawg: '1',
        textord_really_old_xheight: '1',
        textord_min_linesize: '2.0',
        preserve_interword_spaces: '1'
      }
    });
    results.push(result1);

    // 配置2: 单行数学公式超级识别
    const result2 = await this.recognizeWithConfig(imageBlob, {
      name: "单行数学公式",
      languages: ['chi_sim', 'eng'],
      psm: PSM.SINGLE_TEXT_LINE,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz已知函数求解计算判断分析讨论()[]{}=+-×÷≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωsincostan",
        textord_noise_normratio: '2',
        textord_noise_sizelimit: '0.5',
        classify_enable_learning: '0'
      }
    });
    results.push(result2);

    // 配置3: 高精度中文识别
    const result3 = await this.recognizeWithConfig(imageBlob, {
      name: "高精度中文",
      languages: ['chi_sim'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        language_model_penalty_non_dict_word: '0.2',
        textord_min_linesize: '1.5',
        chop_enable: '1',
        use_new_state_cost: '1',
        segment_penalty_dict_nonword: '1.25'
      }
    });
    results.push(result3);

    // 配置4: 自动检测最优模式
    const result4 = await this.recognizeWithConfig(imageBlob, {
      name: "智能自动检测",
      languages: ['chi_sim', 'eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_enable_dict_correction: '1',
        tessedit_enable_bigram_correction: '1',
        stopper_nondict_certainty_base: '-2.5',
        wordrec_enable_assoc: '1'
      }
    });
    results.push(result4);

    // 配置5: 专用数学符号识别
    const result5 = await this.recognizeWithConfig(imageBlob, {
      name: "数学符号专用",
      languages: ['eng'],
      psm: PSM.SINGLE_WORD,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789=+-×÷()[]{}≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψωsincostan",
        classify_enable_adaptive_matcher: '1',
        classify_enable_adaptive_debugger: '0'
      }
    });
    results.push(result5);

    console.log("=== 超级识别引擎处理完成 ===");
    return results;
  }

  private static async recognizeWithConfig(imageBlob: Blob, config: TesseractConfig): Promise<RecognitionResult> {
    console.log(`正在启动 ${config.name} 超级识别引擎...`);
    
    const worker = await createWorker(config.languages, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`${config.name}: ${(m.progress * 100).toFixed(1)}%`);
        }
      }
    });

    try {
      // 设置超级优化参数
      await worker.setParameters({
        tessedit_pageseg_mode: config.psm,
        tessedit_ocr_engine_mode: config.oem,
        user_defined_dpi: config.dpi,
        ...config.params
      });

      const startTime = Date.now();
      const { data: { text, confidence } } = await worker.recognize(imageBlob);
      const processingTime = Date.now() - startTime;
      
      console.log(`${config.name} 超级识别完成:`, {
        文本预览: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
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
