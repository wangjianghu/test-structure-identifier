
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    console.log("=== 启动极致数学公式OCR识别 ===");
    
    // 配置1: 三角函数专用识别 - 最激进配置
    const result1 = await this.recognizeWithConfig(imageBlob, {
      name: "三角函数专用",
      languages: ['eng'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '900',
      params: {
        tessedit_char_whitelist: "0123456789sincotan°=+-×÷()[] ",
        classify_enable_learning: '0',
        classify_enable_adaptive_matcher: '1',
        textord_noise_normratio: '0.5',
        preserve_interword_spaces: '1',
        tessedit_enable_dict_correction: '0',
        textord_min_linesize: '2.5'
      }
    });
    results.push(result1);

    // 配置2: 角度符号专用识别
    const result2 = await this.recognizeWithConfig(imageBlob, {
      name: "角度符号专用",
      languages: ['eng'],
      psm: PSM.SINGLE_LINE,
      oem: OEM.LSTM_ONLY,
      dpi: '900',
      params: {
        tessedit_char_whitelist: "0123456789°′″sincotan()=+-× ",
        textord_min_linesize: '2.0',
        textord_noise_sizelimit: '0.2',
        classify_enable_adaptive_matcher: '1'
      }
    });
    results.push(result2);

    // 配置3: 数学表达式专用
    const result3 = await this.recognizeWithConfig(imageBlob, {
      name: "数学表达式专用",
      languages: ['eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '900',
      params: {
        tessedit_char_whitelist: "0123456789sincotan°=+-×÷()[]ABCD ",
        tessedit_enable_dict_correction: '0',
        classify_enable_learning: '0',
        textord_noise_normratio: '0.3'
      }
    });
    results.push(result3);

    // 配置4: 高精度数字识别
    const result4 = await this.recognizeWithConfig(imageBlob, {
      name: "高精度数字",
      languages: ['eng'],
      psm: PSM.SINGLE_BLOCK,
      oem: OEM.LSTM_ONLY,
      dpi: '1200',
      params: {
        tessedit_char_whitelist: "0123456789°sincotan=+-×÷() ",
        classify_enable_learning: '0',
        textord_min_linesize: '3.0'
      }
    });
    results.push(result4);

    // 配置5: 选择题结构识别
    const result5 = await this.recognizeWithConfig(imageBlob, {
      name: "选择题结构",
      languages: ['eng'],
      psm: PSM.AUTO,
      oem: OEM.LSTM_ONLY,
      dpi: '600',
      params: {
        tessedit_char_whitelist: "0123456789ABCDsincotan°=+-×÷()[] ",
        tessedit_enable_dict_correction: '1',
        preserve_interword_spaces: '1'
      }
    });
    results.push(result5);

    console.log("=== 极致数学公式识别完成 ===");
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
