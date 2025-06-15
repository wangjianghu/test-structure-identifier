
import { MathematicalOCRProcessor } from "./mathematicalOCRProcessor";
import { QuestionClassifier } from "./questionClassifier";
import { EnhancedOCRv4Result } from "./ocr/types";
import { ImagePreprocessor } from "./ocr/imagePreprocessor";
import { TesseractRecognizer } from "./ocr/tesseractRecognizer";
import { ResultProcessor } from "./ocr/resultProcessor";

export type { EnhancedOCRv4Result };

export class EnhancedOCRv4 {
  private processor: MathematicalOCRProcessor;
  private classifier: QuestionClassifier;

  constructor() {
    this.processor = new MathematicalOCRProcessor();
    this.classifier = new QuestionClassifier();
  }

  async processImage(file: File): Promise<EnhancedOCRv4Result> {
    const startTime = Date.now();
    const preprocessingSteps: string[] = [];

    try {
      console.log("=== Enhanced OCR v4 Super 开始处理 ===");
      console.log("原始图片信息:", { name: file.name, size: file.size, type: file.type });

      // 1. 超级增强的数学试题专用预处理
      console.log("1. 开始超级增强预处理...");
      preprocessingSteps.push("启动超级增强数学试题专用预处理算法");
      const enhancedImage = await ImagePreprocessor.superEnhancedPreprocessing(file, preprocessingSteps);
      console.log("预处理完成，图片尺寸:", enhancedImage.size);

      // 2. 多尺度多配置并行识别
      console.log("2. 开始多尺度多配置并行识别...");
      preprocessingSteps.push("执行多尺度多配置并行识别");
      const parallelResults = await TesseractRecognizer.multiScaleParallelRecognition(enhancedImage, preprocessingSteps);
      console.log("并行识别完成，结果数量:", parallelResults.length);

      // 3. 智能结果融合与后处理
      console.log("3. 开始智能结果融合与专业后处理...");
      preprocessingSteps.push("开始智能结果融合与专业后处理");
      const fusedResult = ResultProcessor.intelligentResultFusion(parallelResults, preprocessingSteps);
      console.log("结果融合完成，最终文本:", fusedResult.text);
      
      // 4. 增强文本分类
      console.log("4. 开始增强文本分类...");
      const classification = this.classifier.classify(fusedResult.text);
      
      const processingTime = Date.now() - startTime;
      preprocessingSteps.push(`超级算法处理完成，总耗时: ${processingTime}ms`);

      console.log("=== Enhanced OCR v4 Super 处理完成 ===");
      console.log("最终识别结果:", fusedResult.text);
      console.log("最终置信度:", fusedResult.confidence);

      return {
        text: fusedResult.text,
        confidence: fusedResult.confidence,
        classification,
        preprocessingSteps,
        processingTime,
        advancedMetrics: {
          textRegionsDetected: fusedResult.metrics.textRegionsDetected,
          mathSymbolsDetected: fusedResult.metrics.mathSymbolsDetected,
          fractionLinesDetected: fusedResult.metrics.fractionLinesDetected,
          bracketsDetected: fusedResult.metrics.bracketsDetected,
          chineseCharactersDetected: (fusedResult.text.match(/[\u4e00-\u9fff]/g) || []).length,
          skewAngleCorrected: fusedResult.metrics.skewAngleCorrected,
          noiseReductionApplied: true,
          binarizationMethod: "超级自适应数学专用二值化",
          layoutAnalysisScore: fusedResult.metrics.layoutAnalysisScore,
          transformerConfidence: fusedResult.confidence,
          multiModalScore: fusedResult.metrics.multiModalScore
        },
        algorithmUsed: "Enhanced OCR v4 Super (数学专用超级算法)",
        detectionResults: {
          textBlocks: fusedResult.textBlocks,
          layoutStructure: fusedResult.layoutStructure
        }
      };
    } catch (error) {
      console.error('Enhanced OCR v4 Super 处理失败:', error);
      throw error;
    }
  }

  destroy(): void {
    this.processor.destroy();
  }
}
