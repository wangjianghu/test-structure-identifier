
import { SUBJECT_FEATURES, getSubjectExclusiveWeight, getPatternMatchScore } from './subjectFeatures';

export interface ClassificationResult {
  isQuestion: boolean;
  confidence: number;
  questionType: 'multiple_choice' | 'subjective' | 'unknown';
  subject: string;
  features: {
    hasQuestionNumber: boolean;
    hasOptions: boolean;
    hasMathSymbols: boolean;
    hasQuestionWords: boolean;
    textLength: number;
  };
}

export class QuestionClassifier {
  private questionWords = [
    // 通用问题词汇
    '已知', '设', '求', '证明', '计算', '解', '若', '则', '试', '问',
    '选择', '判断', '填空', '简答', '分析', '说明', '讨论', '比较',
    
    // 数学专用词汇
    '函数', '方程', '不等式', '集合', '概率', '统计', '几何', '代数',
    '导数', '积分', '极限', '向量', '矩阵', '三角', '微分',
    
    // 物理专用词汇
    '实验', '测量', '观察', '分析', '推导', '验证', '探究',
    
    // 化学专用词汇
    '反应', '实验', '配平', '计算', '分析', '推断',
    
    // 语文专用词汇
    '阅读', '理解', '分析', '概括', '归纳', '赏析', '评价', '默写',
    
    // 英语专用词汇
    'read', 'choose', 'complete', 'fill', 'translate', 'write',
    'answer', 'question', 'passage', 'comprehension'
  ];

  classify(text: string): ClassificationResult {
    const cleanText = text.trim().toLowerCase();
    const features = this.extractFeatures(text);
    
    // 计算是否为试题的置信度
    let questionScore = 0;
    let maxScore = 0;

    // 1. 题号检测 (权重: 25%)
    maxScore += 25;
    if (features.hasQuestionNumber) {
      questionScore += 25;
    }

    // 2. 选项检测 (权重: 30%)
    maxScore += 30;
    if (features.hasOptions) {
      questionScore += 30;
    }

    // 3. 问题词汇检测 (权重: 20%)
    maxScore += 20;
    if (features.hasQuestionWords) {
      questionScore += 20;
    }

    // 4. 学科符号检测 (权重: 15%)
    maxScore += 15;
    if (features.hasMathSymbols) {
      questionScore += 15;
    }

    // 5. 文本长度合理性 (权重: 10%)
    maxScore += 10;
    if (features.textLength > 10 && features.textLength < 2000) {
      questionScore += 10;
    }

    const confidence = questionScore / maxScore;
    const isQuestion = confidence > 0.3;

    // 确定题型
    let questionType: 'multiple_choice' | 'subjective' | 'unknown' = 'unknown';
    if (features.hasOptions) {
      questionType = 'multiple_choice';
    } else if (this.hasSubjectiveIndicators(text)) {
      questionType = 'subjective';
    }

    // 使用增强的学科检测
    const subject = this.enhancedDetectSubject(text);

    return {
      isQuestion,
      confidence,
      questionType,
      subject,
      features
    };
  }

  private extractFeatures(text: string): ClassificationResult['features'] {
    // 题号检测
    const hasQuestionNumber = /^\s*\d+\s*[.\uff0e]/.test(text) || 
                              /第\s*[一二三四五六七八九十\d]+\s*题/.test(text) ||
                              /\(\s*\d+\s*\)/.test(text) ||
                              /【\s*\d+\s*】/.test(text);

    // 选项检测
    const optionPatterns = [
      /[A-D]\s*[.\uff0e]\s*[^A-D\n]{1,}/g,
      /（[A-D]）/g,
      /\([A-D]\)/g,
      /[A-D]：/g
    ];
    
    let hasOptions = false;
    for (const pattern of optionPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length >= 2) {
        hasOptions = true;
        break;
      }
    }

    // 问题词汇检测
    const hasQuestionWords = this.questionWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    ) || 
    /[？?]/.test(text) ||
    /填空|空格|______/.test(text) ||
    /选择|判断|计算|解答|证明/.test(text);

    // 学科符号检测
    const hasMathSymbols = this.detectSubjectSymbols(text);

    // 文本长度
    const textLength = text.length;

    return {
      hasQuestionNumber,
      hasOptions,
      hasMathSymbols,
      hasQuestionWords,
      textLength
    };
  }

  private detectSubjectSymbols(text: string): boolean {
    // 检测任何学科的特征符号
    for (const subject of Object.keys(SUBJECT_FEATURES)) {
      const symbols = SUBJECT_FEATURES[subject].symbols;
      if (symbols.some(symbol => text.includes(symbol))) {
        return true;
      }
    }
    return false;
  }

  private hasSubjectiveIndicators(text: string): boolean {
    const subjectiveWords = [
      '证明', '解答', '计算', '求解', '分析', '说明', '讨论', '推导',
      '阅读理解', '完形填空', '语法填空', '翻译', '作文', '写作',
      '实验', '观察', '测量', '探究', '验证', '推断'
    ];
    return subjectiveWords.some(word => text.includes(word));
  }

  private enhancedDetectSubject(text: string): string {
    let maxScore = 0;
    let detectedSubject = '未知';

    for (const [subject, features] of Object.entries(SUBJECT_FEATURES)) {
      let score = 0;
      
      // 1. 基础关键词匹配
      features.keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
        }
      });

      // 2. 符号匹配
      features.symbols.forEach(symbol => {
        if (text.includes(symbol)) {
          score += 1;
        }
      });

      // 3. 模式匹配（高权重）
      score += getPatternMatchScore(text, subject);

      // 4. 独特特征权重（最高权重）
      score += getSubjectExclusiveWeight(text, subject);

      // 5. 上下文词汇匹配
      features.contextWords.forEach(word => {
        if (text.toLowerCase().includes(word.toLowerCase())) {
          score += 0.5;
        }
      });

      console.log(`学科 ${subject} 得分: ${score}`);

      if (score > maxScore) {
        maxScore = score;
        detectedSubject = subject;
      }
    }

    // 如果仍然未知，进行更深入的模式检测
    if (detectedSubject === '未知' && maxScore < 2) {
      // 英语检测：大量英文且无中文数学符号
      if (/[a-zA-Z]{20,}/.test(text) && !/[一二三四五六七八九十√∞∑∫]/.test(text)) {
        detectedSubject = '英语';
      }
      // 语文检测：古文特征
      else if (/[古诗词文言曰者也之乎焉哉]/.test(text)) {
        detectedSubject = '语文';
      }
      // 数学检测：数学表达式
      else if (/[\d+\-×÷=<>≤≥≠(){}[\]|]/.test(text) && /[xyz]/.test(text)) {
        detectedSubject = '数学';
      }
    }

    console.log(`最终检测学科: ${detectedSubject} (得分: ${maxScore})`);
    return detectedSubject;
  }
}
