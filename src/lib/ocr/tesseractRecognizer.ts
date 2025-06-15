
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    console.log("=== 启动数学公式专用OCR识别 ===");
    
    // 配置1: 数学公式专用识别
    const result1 = await this.recognizeWithConfig(imageBlob, {
      name: "数学公式专用",
      languages: ['eng'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}=+-×÷°′″√²³¹⁰sincostan ",
        classify_enable_learning: '0',
        classify_enable_adaptive_matcher: '1',
        textord_noise_normratio: '1',
        preserve_interword_spaces: '1'
      }
    });
    results.push(result1);

    // 配置2: 角度符号专用识别
    const result2 = await this.recognizeWithConfig(imageBlob, {
      name: "角度符号专用",
      languages: ['eng'],
      psm: PSM.SINGLE_LINE,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789°′″sincostan()=+-× ",
        textord_min_linesize: '1.0',
        textord_noise_sizelimit: '0.3'
      }
    });
    results.push(result2);

    // 配置3: 选择题专用识别
    const result3 = await this.recognizeWithConfig(imageBlob, {
      name: "选择题专用",
      languages: ['eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}=+-×÷°′″√²³¹⁰sincostan.- ",
        tessedit_enable_dict_correction: '1'
      }
    });
    results.push(result3);

    console.log("=== 数学公式识别完成 ===");
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
        文本: text,
        置信度: confidence.toFixed(1) + '%',
        耗时: processingTime + 'ms'
      });
      
      return { text, confidence, config: config.name };
    } finally {
      await worker.terminate();
    }
  }
}
