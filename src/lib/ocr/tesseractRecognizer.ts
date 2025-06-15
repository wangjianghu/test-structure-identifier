
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    console.log("=== 启动选择题专用OCR识别 ===");
    
    // 配置1: 选择题题号和结构专用识别
    const result1 = await this.recognizeWithConfig(imageBlob, {
      name: "选择题结构专用",
      languages: ['eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789ABCDabcd.()°sincotan=+-×÷ ",
        classify_enable_learning: '0',
        classify_enable_adaptive_matcher: '1',
        textord_noise_normratio: '0.3',
        preserve_interword_spaces: '1',
        tessedit_enable_dict_correction: '0',
        textord_min_linesize: '2.0',
        textord_tabfind_find_tables: '1'
      }
    });
    results.push(result1);

    // 配置2: 三角函数和角度符号超高精度识别
    const result2 = await this.recognizeWithConfig(imageBlob, {
      name: "三角函数超精度",
      languages: ['eng'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '1200',
      params: {
        tessedit_char_whitelist: "0123456789sincotan°=+-×÷()ABCDabcd ",
        classify_enable_learning: '0',
        classify_enable_adaptive_matcher: '1',
        textord_noise_normratio: '0.2',
        preserve_interword_spaces: '1',
        tessedit_enable_dict_correction: '0',
        textord_min_linesize: '3.0',
        tessedit_char_blacklist: '1Il|!',
        load_system_dawg: '0',
        load_freq_dawg: '0'
      }
    });
    results.push(result2);

    // 配置3: 选项字母专用识别 (A B C D)
    const result3 = await this.recognizeWithConfig(imageBlob, {
      name: "选项字母专用",
      languages: ['eng'],
      psm: PSM.SINGLE_LINE,
      oem: OEM.LSTM_ONLY,
      dpi: '800',
      params: {
        tessedit_char_whitelist: "ABCDabcd0123456789°sincotan=+-×÷() ",
        classify_enable_learning: '0',
        textord_min_linesize: '2.5',
        textord_noise_sizelimit: '0.1',
        classify_enable_adaptive_matcher: '1',
        tessedit_enable_dict_correction: '0',
        tessedit_char_blacklist: '史了一'
      }
    });
    results.push(result3);

    // 配置4: 数学表达式完整识别
    const result4 = await this.recognizeWithConfig(imageBlob, {
      name: "数学表达式完整",
      languages: ['eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '900',
      params: {
        tessedit_char_whitelist: "0123456789sincotan°=+-×÷()[]ABCDabcd. ",
        tessedit_enable_dict_correction: '1',
        classify_enable_learning: '0',
        textord_noise_normratio: '0.4',
        preserve_interword_spaces: '1',
        textord_tabfind_find_tables: '1'
      }
    });
    results.push(result4);

    // 配置5: 混合内容识别 (包含中文字符可能性)
    const result5 = await this.recognizeWithConfig(imageBlob, {
      name: "混合内容识别",
      languages: ['eng', 'chi_sim'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789ABCDabcdsincotan°=+-×÷()[] ",
        tessedit_enable_dict_correction: '1',
        preserve_interword_spaces: '1',
        textord_min_linesize: '2.0',
        tessedit_char_blacklist: '史了一'
      }
    });
    results.push(result5);

    // 配置6: 极简字符集高置信度识别
    const result6 = await this.recognizeWithConfig(imageBlob, {
      name: "极简高置信度",
      languages: ['eng'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '1000',
      params: {
        tessedit_char_whitelist: "0123456789ABCDsincotan°=+-×÷() ",
        classify_enable_learning: '0',
        classify_enable_adaptive_matcher: '1',
        textord_noise_normratio: '0.1',
        tessedit_enable_dict_correction: '0',
        textord_min_linesize: '3.5',
        load_system_dawg: '0',
        load_freq_dawg: '0',
        load_unambig_dawg: '0'
      }
    });
    results.push(result6);

    console.log("=== 选择题专用OCR识别完成 ===");
    return results;
  }

  private static async recognizeWithConfig(imageBlob: Blob, config: TesseractConfig): Promise<RecognitionResult> {
    console.log(`启动 ${config.name} 识别引擎...`);
    
    const worker = await createWorker(config.languages, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`${config.name}: ${(m.progress * 100).toFixed(1)}%`);
        }
      }
    });

    try {
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
        原始文本: text,
        置信度: confidence.toFixed(1) + '%',
        耗时: processingTime + 'ms',
        文本长度: text.length
      });
      
      return { text, confidence, config: config.name };
    } finally {
      await worker.terminate();
    }
  }
}
