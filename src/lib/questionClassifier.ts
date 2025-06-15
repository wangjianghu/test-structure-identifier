
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
    '已知', '设', '求', '证明', '计算', '解', '若', '则', '试', '问',
    '选择', '判断', '填空', '简答', '分析', '说明', '讨论', '比较'
  ];

  private mathSymbols = [
    '=', '≠', '≤', '≥', '<', '>', '+', '-', '×', '÷', '∞', '√',
    '²', '³', '¹', '⁰', 'x', 'y', 'z', 'f', 'g', 'π', 'α', 'β', 'γ',
    '∈', '∉', '∩', '∪', '⊂', '⊃', '∅', '∠', '∴', '∵', '∫', '∑'
  ];

  private physicsTerms = [
    '力', '速度', '加速度', '质量', '密度', '压强', '功', '功率', '能量',
    '电流', '电压', '电阻', '磁场', '波长', '频率', '温度', '热量'
  ];

  private chemistryTerms = [
    '原子', '分子', '离子', '化合价', '反应', '溶液', '浓度', '摩尔',
    'H₂O', 'CO₂', 'NaCl', 'H₂SO₄', 'HCl', 'NaOH', 'CaCO₃'
  ];

  private subjectKeywords = {
    '数学': [...this.mathSymbols, '函数', '方程', '不等式', '集合', '概率', '统计', '几何', '代数'],
    '物理': [...this.physicsTerms, '牛顿', '焦耳', '瓦特', '安培', '伏特'],
    '化学': [...this.chemistryTerms, '元素', '周期表', '氧化', '还原', '酸碱'],
    '语文': ['阅读', '理解', '作者', '文章', '段落', '语法', '修辞', '古诗'],
    '英语': ['reading', 'passage', 'choose', 'complete', 'translate', 'grammar']
  };

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
    if (features.textLength > 10 && features.textLength < 1000) {
      questionScore += 10;
    }

    const confidence = questionScore / maxScore;
    const isQuestion = confidence > 0.4; // 40%阈值

    // 确定题型
    let questionType: 'multiple_choice' | 'subjective' | 'unknown' = 'unknown';
    if (features.hasOptions) {
      questionType = 'multiple_choice';
    } else if (this.hasSubjectiveIndicators(text)) {
      questionType = 'subjective';
    }

    // 确定学科
    const subject = this.detectSubject(text);

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
                              /第\s*[一二三四五六七八九十\d]+\s*题/.test(text);

    // 选项检测 (A. B. C. D. 格式)
    const optionPattern = /[A-D]\s*[.\uff0e]\s*[^A-D\n]{1,}/g;
    const options = text.match(optionPattern);
    const hasOptions = options && options.length >= 2;

    // 问题词汇检测
    const hasQuestionWords = this.questionWords.some(word => text.includes(word));

    // 数学符号检测
    const hasMathSymbols = this.mathSymbols.some(symbol => text.includes(symbol)) ||
                           /[xyz]\s*[²³¹⁰]/.test(text) ||
                           /\d+\s*[×÷]\s*\d+/.test(text);

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

  private hasSubjectiveIndicators(text: string): boolean {
    const subjectiveWords = ['证明', '解答', '计算', '求解', '分析', '说明', '讨论'];
    return subjectiveWords.some(word => text.includes(word));
  }

  private detectSubject(text: string): string {
    let maxMatches = 0;
    let detectedSubject = '未知';

    for (const [subject, keywords] of Object.entries(this.subjectKeywords)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedSubject = subject;
      }
    }

    return detectedSubject;
  }
}
