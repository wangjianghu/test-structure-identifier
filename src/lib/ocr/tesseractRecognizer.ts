
import { createWorker, PSM, OEM } from "tesseract.js";
import { TesseractConfig, RecognitionResult } from "./types";

export class TesseractRecognizer {
  static async multiScaleParallelRecognition(imageBlob: Blob, preprocessingSteps: string[]): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];
    
    console.log("=== 启动优化OCR识别 ===");
    
    // 减少到4个高质量配置，提升速度
    const promises = [
      this.recognizeWithConfig(imageBlob, {
        name: "数学题目优化识别",
        languages: ['eng'],
        psm: PSM.AUTO,
        oem: OEM.LSTM_ONLY,
        dpi: '900',
        params: {
          tessedit_char_whitelist: "0123456789ABCDabcd.()°sincotan=+-×÷ \n",
          classify_enable_learning: '0',
          classify_enable_adaptive_matcher: '1',
          textord_noise_normratio: '0.3',
          preserve_interword_spaces: '1',
          tessedit_enable_dict_correction: '1',
          textord_min_linesize: '2.5',
          textord_tabfind_find_tables: '1'
        }
      }),

      this.recognizeWithConfig(imageBlob, {
        name: "选项字母专用",
        languages: ['eng'],
        psm: PSM.SINGLE_BLOCK,
        oem: OEM.LSTM_ONLY,
        dpi: '1000',
        params: {
          tessedit_char_whitelist: "ABCDabcd.() ",
          classify_enable_learning: '0',
          classify_enable_adaptive_matcher: '1',
          textord_noise_normratio: '0.2',
          preserve_interword_spaces: '1',
          tessedit_enable_dict_correction: '0',
          textord_min_linesize: '3.0',
          load_system_dawg: '0',
          load_freq_dawg: '0'
        }
      }),

      this.recognizeWithConfig(imageBlob, {
        name: "完整文本识别",
        languages: ['eng'],
        psm: PSM.AUTO,
        oem: OEM.LSTM_ONLY,
        dpi: '800',
        params: {
          tessedit_char_whitelist: "0123456789ABCDabcd.()°sincotan=+-×÷ \n{}[]",
          tessedit_enable_dict_correction: '1',
          classify_enable_learning: '0',
          textord_noise_normratio: '0.4',
          preserve_interword_spaces: '1',
          textord_tabfind_find_tables: '1',
          textord_min_linesize: '2.0'
        }
      }),

      this.recognizeWithConfig(imageBlob, {
        name: "高精度数学",
        languages: ['eng'],
        psm: PSM.SINGLE_BLOCK,
        oem: OEM.LSTM_ONLY,
        dpi: '1200',
        params: {
          tessedit_char_whitelist: "0123456789sincotan°=+-×÷()ABCDabcd. ",
          classify_enable_learning: '0',
          classify_enable_adaptive_matcher: '1',
          textord_noise_normratio: '0.1',
          preserve_interword_spaces: '1',
          tessedit_enable_dict_correction: '0',
          textord_min_linesize: '4.0'
        }
      })
    ];

    // 并行执行所有识别任务
    const parallelResults = await Promise.all(promises);
    results.push(...parallelResults);

    console.log("=== 优化OCR识别完成 ===");
    return results;
  }

  private static async recognizeWithConfig(imageBlob: Blob, config: TesseractConfig): Promise<RecognitionResult> {
    console.log(`启动 ${config.name} 识别...`);
    
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
      
      console.log(`${config.name} 完成:`, {
        文本: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        置信度: confidence.toFixed(1) + '%',
        耗时: processingTime + 'ms'
      });
      
      return { text, confidence, config: config.name };
    } finally {
      await worker.terminate();
    }
  }
}
