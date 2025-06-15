
import { QuestionClassifier, ClassificationResult } from "./questionClassifier";

export interface MistralOCRResult {
  text: string;
  confidence: number;
  classification: ClassificationResult;
  preprocessingSteps: string[];
  processingTime: number;
}

export class MistralOCR {
  private classifier: QuestionClassifier;

  constructor() {
    this.classifier = new QuestionClassifier();
  }

  async processImage(file: File): Promise<MistralOCRResult> {
    const startTime = Date.now();
    const preprocessingSteps: string[] = [];

    try {
      const apiKey = localStorage.getItem('mistral_api_key');
      if (!apiKey) {
        throw new Error('Mistral.ai API Key 未配置');
      }

      preprocessingSteps.push("开始 Mistral.ai 图像识别");

      // 将图片转换为 base64
      const base64Image = await this.fileToBase64(file);
      preprocessingSteps.push("图片转换为 base64 格式");

      // 调用 Mistral.ai API
      preprocessingSteps.push("正在调用 Mistral.ai 视觉模型");
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'pixtral-12b-2409',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '请准确识别这张图片中的所有文字内容，包括题目、选项、公式等。保持原有的格式和结构，特别注意数学符号和中文字符的准确性。如果有题号，请保留题号格式。如果有选项（A、B、C、D等），请按行分别列出。'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Mistral.ai API 错误: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      if (!text.trim()) {
        throw new Error('Mistral.ai 未返回识别结果');
      }

      preprocessingSteps.push("Mistral.ai 识别完成");

      // 后处理文本
      const processedText = this.postProcessText(text);
      preprocessingSteps.push("文本后处理完成");

      // 计算置信度（基于返回文本的完整性）
      const confidence = this.calculateConfidence(processedText);

      // 文本分类
      preprocessingSteps.push("开始内容分类");
      const classification = this.classifier.classify(processedText);
      preprocessingSteps.push(`分类完成: ${classification.isQuestion ? '检测到试题' : '未检测到试题'}`);

      const processingTime = Date.now() - startTime;

      return {
        text: processedText,
        confidence,
        classification,
        preprocessingSteps,
        processingTime
      };

    } catch (error) {
      console.error('Mistral.ai OCR 处理失败:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private postProcessText(text: string): string {
    let processedText = text;

    // 清理可能的 AI 回复前缀
    processedText = processedText
      .replace(/^(根据图片内容，我识别到的文字是：|图片中的文字内容如下：|识别结果：)/i, '')
      .replace(/^[\s\n]+/, '')
      .trim();

    // 格式化题号
    processedText = processedText
      .replace(/(\d+)\s*[.．]\s*/g, '$1. ')
      .replace(/\s*([A-D])\s*[.．:：]\s*/g, '\n$1. ');

    // 修复常见符号
    processedText = processedText
      .replace(/[×xX]/g, '×')
      .replace(/[÷]/g, '÷')
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')')
      .replace(/[＝]/g, '=');

    // 整理段落
    processedText = processedText
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return processedText;
  }

  private calculateConfidence(text: string): number {
    let confidence = 50; // 基础置信度

    // 基于文本长度
    if (text.length > 20) confidence += 20;
    if (text.length > 50) confidence += 10;

    // 检测教育相关关键词
    const educationKeywords = ['题', '选择', '计算', '求解', '分析', '根据', '下列', '关于'];
    const foundKeywords = educationKeywords.filter(keyword => text.includes(keyword));
    confidence += foundKeywords.length * 2;

    // 检测选项格式
    if (/[A-D][.．]/g.test(text)) confidence += 10;

    // 检测数学符号
    if (/[×÷±≤≥∞∑∫√]/g.test(text)) confidence += 5;

    return Math.min(confidence, 95); // 最大95%
  }

  static isConfigured(): boolean {
    return !!localStorage.getItem('mistral_api_key');
  }
}
