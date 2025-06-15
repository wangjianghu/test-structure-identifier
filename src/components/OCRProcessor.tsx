
import { toast } from "sonner";
import { EnhancedOCR, OCRResult } from "@/lib/enhancedOCR";
import { EnhancedOCRv2, EnhancedOCRResult } from "@/lib/enhancedOCRv2";
import { EnhancedOCRv3, EnhancedOCRv3Result } from "@/lib/enhancedOCRv3";
import { EnhancedOCRv4, EnhancedOCRv4Result } from "@/lib/enhancedOCRv4";
import { MistralOCR, MistralOCRResult } from "@/lib/mistralOCR";
import { AlicloudOCR, AlicloudOCRResult } from "@/lib/alicloudOCR";

export class OCRProcessor {
  async processImages(
    images: File[], 
    selectedSubject: string, 
    questionTypeExample: string,
    addImageToHistory: (file: File, result: any, undefined: any, subject: string, example: string) => Promise<any>
  ): Promise<{
    results: (OCRResult | EnhancedOCRResult | EnhancedOCRv3Result | EnhancedOCRv4Result | MistralOCRResult | AlicloudOCRResult)[];
    imageHistoryItems: any[];
  }> {
    const results: (OCRResult | EnhancedOCRResult | EnhancedOCRv3Result | EnhancedOCRv4Result | MistralOCRResult | AlicloudOCRResult)[] = [];
    const imageHistoryItems: any[] = [];

    if (images.length === 0) {
      return { results, imageHistoryItems };
    }

    console.log("=== OCRProcessor 开始处理图片 ===");
    console.log("图片数量:", images.length);

    toast.info("开始处理上传的图片...", {
      description: `正在使用Enhanced OCR v4超级算法识别 ${images.length} 张图片中的数学公式。`,
    });

    // 强制使用Enhanced OCR v4，不管其他配置
    console.log("强制使用Enhanced OCR v4超级算法");
    await this.processEnhancedOCRv4(images, results, imageHistoryItems, addImageToHistory, selectedSubject, questionTypeExample);

    if (results.length > 0) {
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
      toast.success(`成功识别 ${results.length} 张图片`, {
        description: `平均置信度: ${avgConfidence.toFixed(1)}%，使用了Enhanced OCR v4超级算法`,
      });
    }

    console.log("=== OCRProcessor 处理完成 ===");
    return { results, imageHistoryItems };
  }

  // Enhanced OCR v4处理（强制使用）
  private async processEnhancedOCRv4(
    images: File[], 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    console.log("=== 使用Enhanced OCR v4超级算法识别 ===");
    toast.info("使用Enhanced OCR v4超级算法识别...", {
      description: "正在应用数学公式专用超级优化算法"
    });

    const enhancedOCRv4 = new EnhancedOCRv4();

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      console.log(`开始处理第 ${i + 1} 张图片: ${file.name}`);
      
      toast.info(`正在处理第 ${i + 1} 张图片...`, {
        description: `文件：${file.name} (Enhanced OCR v4 超级算法)`,
      });

      try {
        const result = await enhancedOCRv4.processImage(file);
        results.push(result);
        const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
        imageHistoryItems.push(historyItem);
        
        console.log(`第 ${i + 1} 张图片处理完成:`, {
          文本: result.text,
          置信度: result.confidence,
          数学符号: result.advancedMetrics.mathSymbolsDetected,
          中文字符: result.advancedMetrics.chineseCharactersDetected
        });
        
        toast.success(`第 ${i + 1} 张图片处理完成`, {
          description: `识别文本: "${result.text.substring(0, 50)}..." 置信度: ${result.confidence.toFixed(1)}%`,
        });
      } catch (err) {
        console.error(`Enhanced OCR v4 处理图片 ${file.name} 失败:`, err);
        toast.error(`Enhanced OCR v4 处理图片 ${file.name} 失败`, {
          description: "算法处理出现错误，请稍后重试。",
        });
      }
    }

    enhancedOCRv4.destroy();
  }

  // 新增：回退到Enhanced OCR v3
  private async fallbackToEnhancedOCRv3(
    file: File, 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    try {
      const enhancedOCRv3 = new EnhancedOCRv3();
      const fallbackResult = await enhancedOCRv3.processImage(file);
      results.push(fallbackResult);
      enhancedOCRv3.destroy();
      
      const historyItem = await addImageToHistory(file, fallbackResult, undefined, selectedSubject, questionTypeExample);
      imageHistoryItems.push(historyItem);
    } catch (fallbackErr) {
      console.error(`Enhanced OCR v3 处理图片 ${file.name} 也失败:`, fallbackErr);
      await this.fallbackToEnhancedOCRv2(file, results, imageHistoryItems, addImageToHistory, selectedSubject, questionTypeExample);
    }
  }

  // 增强OCR v3处理
  private async processEnhancedOCRv3(
    images: File[], 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    toast.info("使用增强OCR v3算法识别...", {
      description: "正在应用数学试题专用图像预处理和多引擎识别"
    });

    const enhancedOCRv3 = new EnhancedOCRv3();

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      toast.info(`正在处理第 ${i + 1} 张图片...`, {
        description: `文件：${file.name} (增强OCR v3 - 数学专用)`,
      });

      try {
        const result = await enhancedOCRv3.processImage(file);
        results.push(result);
        const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
        imageHistoryItems.push(historyItem);
        
        toast.success(`第 ${i + 1} 张图片处理完成`, {
          description: `检测到 ${result.advancedMetrics.mathSymbolsDetected} 个数学符号，${result.advancedMetrics.chineseCharactersDetected} 个中文字符，置信度: ${result.confidence.toFixed(1)}%`,
        });
      } catch (err) {
        console.error(`增强OCR v3 处理图片 ${file.name} 失败:`, err);
        toast.error(`增强OCR v3 处理图片 ${file.name} 失败`, {
          description: "将使用增强OCR v2重试。",
        });
        await this.fallbackToEnhancedOCRv2(file, results, imageHistoryItems, addImageToHistory, selectedSubject, questionTypeExample);
      }
    }

    enhancedOCRv3.destroy();
  }

  // 增强OCR v2处理
  private async processEnhancedOCRv2(
    images: File[], 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    toast.info("使用增强OCR v2算法识别...", {
      description: "正在应用高级图像预处理和多配置识别"
    });

    const enhancedOCRv2 = new EnhancedOCRv2();

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      toast.info(`正在处理第 ${i + 1} 张图片...`, {
        description: `文件：${file.name} (增强OCR v2)`,
      });

      try {
        const result = await enhancedOCRv2.processImage(file);
        results.push(result);
        const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
        imageHistoryItems.push(historyItem);
        
        toast.success(`第 ${i + 1} 张图片处理完成`, {
          description: `检测到 ${result.advancedMetrics.textRegionsDetected} 个文字区域，置信度: ${result.confidence.toFixed(1)}%`,
        });
      } catch (err) {
        console.error(`增强OCR v2 处理图片 ${file.name} 失败:`, err);
        toast.error(`增强OCR v2 处理图片 ${file.name} 失败`, {
          description: "将使用标准OCR引擎重试。",
        });
        await this.fallbackToBuiltinOCR(file, results, imageHistoryItems, addImageToHistory, selectedSubject, questionTypeExample);
      }
    }

    enhancedOCRv2.destroy();
  }

  private async processMistralOCR(
    images: File[], 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    toast.info("使用 Mistral.ai 高精度识别...", {
      description: "正在处理图片中的文字和数学公式"
    });

    const mistralOCR = new MistralOCR();

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      toast.info(`正在处理第 ${i + 1} 张图片...`, {
        description: `文件：${file.name} (Mistral.ai)`,
      });

      try {
        const result = await mistralOCR.processImage(file);
        results.push(result);
        const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
        imageHistoryItems.push(historyItem);
      } catch (err) {
        console.error(`Mistral.ai 处理图片 ${file.name} 失败:`, err);
        toast.error(`Mistral.ai 处理图片 ${file.name} 失败`, {
          description: "将尝试其他 OCR 引擎。",
        });
        await this.fallbackToBuiltinOCR(file, results, imageHistoryItems, addImageToHistory, selectedSubject, questionTypeExample);
      }
    }
  }

  private async processAlicloudOCR(
    images: File[], 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    toast.info("使用阿里云 OCR 识别...", {
      description: "正在处理图片中的文字内容"
    });

    const alicloudOCR = new AlicloudOCR();

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      toast.info(`正在处理第 ${i + 1} 张图片...`, {
        description: `文件：${file.name} (阿里云 OCR)`,
      });

      try {
        const result = await alicloudOCR.processImage(file);
        results.push(result);
        const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
        imageHistoryItems.push(historyItem);
      } catch (err) {
        console.error(`阿里云 OCR 处理图片 ${file.name} 失败:`, err);
        toast.error(`阿里云 OCR 处理图片 ${file.name} 失败`, {
          description: "将使用内置 OCR 引擎重试。",
        });
        await this.fallbackToBuiltinOCR(file, results, imageHistoryItems, addImageToHistory, selectedSubject, questionTypeExample);
      }
    }
  }

  private async processBuiltinOCR(
    images: File[], 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    toast.info("使用内置 OCR 引擎识别...", {
      description: "正在处理图片中的文字和数学公式"
    });

    const enhancedOCR = new EnhancedOCR();

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      toast.info(`正在处理第 ${i + 1} 张图片...`, {
        description: `文件：${file.name} (内置OCR)`,
      });

      try {
        const result = await enhancedOCR.processImage(file);
        results.push(result);
        const historyItem = await addImageToHistory(file, result, undefined, selectedSubject, questionTypeExample);
        imageHistoryItems.push(historyItem);
      } catch (err) {
        console.error(`处理图片 ${file.name} 失败:`, err);
        toast.error(`处理图片 ${file.name} 失败`, {
          description: "请检查图片质量或稍后重试。",
        });
      }
    }

    enhancedOCR.destroy();
  }

  // 回退到增强OCR v2
  private async fallbackToEnhancedOCRv2(
    file: File, 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    try {
      const enhancedOCRv2 = new EnhancedOCRv2();
      const fallbackResult = await enhancedOCRv2.processImage(file);
      results.push(fallbackResult);
      enhancedOCRv2.destroy();
      
      const historyItem = await addImageToHistory(file, fallbackResult, undefined, selectedSubject, questionTypeExample);
      imageHistoryItems.push(historyItem);
    } catch (fallbackErr) {
      console.error(`增强OCR v2 处理图片 ${file.name} 也失败:`, fallbackErr);
      await this.fallbackToBuiltinOCR(file, results, imageHistoryItems, addImageToHistory, selectedSubject, questionTypeExample);
    }
  }

  private async fallbackToBuiltinOCR(
    file: File, 
    results: any[], 
    imageHistoryItems: any[], 
    addImageToHistory: any,
    selectedSubject: string,
    questionTypeExample: string
  ) {
    try {
      const enhancedOCR = new EnhancedOCR();
      const fallbackResult = await enhancedOCR.processImage(file);
      results.push(fallbackResult);
      enhancedOCR.destroy();
      
      const historyItem = await addImageToHistory(file, fallbackResult, undefined, selectedSubject, questionTypeExample);
      imageHistoryItems.push(historyItem);
    } catch (fallbackErr) {
      console.error(`内置 OCR 处理图片 ${file.name} 也失败:`, fallbackErr);
      toast.error(`处理图片 ${file.name} 失败`, {
        description: "请检查图片质量或稍后重试。",
      });
    }
  }
}
