
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

  private mathSymbols = [
    '=', '≠', '≤', '≥', '<', '>', '+', '-', '×', '÷', '∞', '√',
    '²', '³', '¹', '⁰', 'x', 'y', 'z', 'f', 'g', 'π', 'α', 'β', 'γ',
    '∈', '∉', '∩', '∪', '⊂', '⊃', '∅', '∠', '∴', '∵', '∫', '∑',
    'sin', 'cos', 'tan', 'log', 'ln', 'lim', 'Δ', '∇', '∂'
  ];

  private physicsTerms = [
    '力', '速度', '加速度', '质量', '密度', '压强', '功', '功率', '能量',
    '电流', '电压', '电阻', '磁场', '波长', '频率', '温度', '热量',
    '牛顿', '焦耳', '瓦特', '安培', '伏特', '欧姆', '赫兹', '帕斯卡',
    '动能', '势能', '重力', '摩擦力', '弹力', '浮力', '压力'
  ];

  private chemistryTerms = [
    '原子', '分子', '离子', '化合价', '反应', '溶液', '浓度', '摩尔',
    'H₂O', 'CO₂', 'NaCl', 'H₂SO₄', 'HCl', 'NaOH', 'CaCO₃',
    '氧化', '还原', '酸', '碱', '盐', '化学键', '电子', '质子', '中子',
    '元素', '周期表', '同位素', '化学式', '反应式'
  ];

  private chineseTerms = [
    '作者', '文章', '段落', '中心思想', '主旨', '修辞', '表达方式',
    '诗歌', '古诗', '词', '文言文', '古文', '成语', '词语', '句子',
    '散文', '小说', '记叙文', '说明文', '议论文', '应用文'
  ];

  private englishTerms = [
    'passage', 'reading', 'comprehension', 'grammar', 'vocabulary',
    'sentence', 'paragraph', 'article', 'essay', 'letter', 'story',
    'dialogue', 'conversation', 'text', 'word', 'phrase', 'clause'
  ];

  // 增强的数学关键词识别
  private enhancedMathKeywords = [
    // 数学运算符号和符号
    '(', ')', '{', '}', '[', ']', '|', '∣',
    // 数学关系和不等式
    '对于', '当', '且', '或', '有', '使得', '满足', '的了什么',
    // 数学术语
    '和数', '已和数', '子集', '交集', '并集', '补集', '定义域', '值域',
    '单调', '周期', '奇偶', '零点', '最值', '极值',
    // 题目中常见的数学表述
    '已知', '设', '若', '则', '求', '证', '解', '计算',
    // 数学对象
    '函数', '方程', '不等式', '数列', '级数', '矩阵', '向量'
  ];

  private subjectKeywords = {
    '数学': [
      ...this.mathSymbols, 
      ...this.enhancedMathKeywords,
      '函数', '方程', '不等式', '集合', '概率', '统计', '几何', '代数', 
      '三角', '导数', '积分', '微分', '向量', '矩阵',
      // 添加更多数学特征词汇
      '已和数', '对于', '当z', '使得', '满足', '子集', '交集', '并集', '补集',
      '定义域', '值域', '单调', '周期', '奇偶', '零点', '最值', '极值'
    ],
    '物理': [...this.physicsTerms, '实验', '测量', '公式', '定律', '定理'],
    '化学': [...this.chemistryTerms, '实验', '元素', '周期表', '化学反应', '化学式'],
    '语文': [...this.chineseTerms, '阅读', '理解', '作文', '默写', '古诗', '文言文'],
    '英语': [...this.englishTerms, 'reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary']
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
    if (features.textLength > 10 && features.textLength < 2000) {
      questionScore += 10;
    }

    const confidence = questionScore / maxScore;
    const isQuestion = confidence > 0.3; // 降低阈值到30%

    // 确定题型
    let questionType: 'multiple_choice' | 'subjective' | 'unknown' = 'unknown';
    if (features.hasOptions) {
      questionType = 'multiple_choice';
    } else if (this.hasSubjectiveIndicators(text)) {
      questionType = 'subjective';
    }

    // 确定学科 - 使用增强的检测方法
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
    // 题号检测 - 更全面的模式
    const hasQuestionNumber = /^\s*\d+\s*[.\uff0e]/.test(text) || 
                              /第\s*[一二三四五六七八九十\d]+\s*题/.test(text) ||
                              /\(\s*\d+\s*\)/.test(text) ||
                              /【\s*\d+\s*】/.test(text);

    // 选项检测 - 支持更多格式
    const optionPatterns = [
      /[A-D]\s*[.\uff0e]\s*[^A-D\n]{1,}/g,  // A. B. C. D.
      /（[A-D]）/g,                          // （A）（B）（C）（D）
      /\([A-D]\)/g,                          // (A)(B)(C)(D)
      /[A-D]：/g                             // A：B：C：D：
    ];
    
    let hasOptions = false;
    for (const pattern of optionPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length >= 2) {
        hasOptions = true;
        break;
      }
    }

    // 问题词汇检测 - 更智能的检测
    const hasQuestionWords = this.questionWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    ) || 
    /[？?]/.test(text) ||  // 问号检测
    /填空|空格|______/.test(text) ||  // 填空题特征
    /选择|判断|计算|解答|证明/.test(text);  // 常见题型词汇

    // 学科符号检测 - 扩展检测范围，特别加强数学检测
    const hasMathSymbols = this.mathSymbols.some(symbol => text.includes(symbol)) ||
                           /[xyz]\s*[²³¹⁰]/.test(text) ||
                           /\d+\s*[×÷]\s*\d+/.test(text) ||
                           /[a-z]\([a-z]\)/.test(text) ||  // 函数表示
                           /\d+[a-z]/.test(text) ||  // 代数表达式
                           // 加强集合相关符号检测
                           /[∩∪∈∉⊂⊃∅]/.test(text) ||
                           // 加强数学表达式检测
                           /[(){}\[\]|]/.test(text) && /[xyz\d]/.test(text) ||
                           // 检测数学关系表述
                           /对于.*[xyz]/.test(text) ||
                           /当.*[><=]/.test(text);

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
    const subjectiveWords = [
      '证明', '解答', '计算', '求解', '分析', '说明', '讨论', '推导',
      '阅读理解', '完形填空', '语法填空', '翻译', '作文', '写作',
      '实验', '观察', '测量', '探究', '验证', '推断'
    ];
    return subjectiveWords.some(word => text.includes(word));
  }

  // 增强的学科检测方法
  private enhancedDetectSubject(text: string): string {
    let maxMatches = 0;
    let detectedSubject = '未知';

    for (const [subject, keywords] of Object.entries(this.subjectKeywords)) {
      let matches = 0;
      
      // 基础关键词匹配
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          matches++;
        }
      });

      // 针对数学的特殊加权检测
      if (subject === '数学') {
        // 检测数学表达式模式
        if (/[xyz]\s*[><=≤≥≠]\s*[\d-]/.test(text)) matches += 3;
        if (/\{.*[xyz].*\|.*\}/.test(text)) matches += 3; // 集合表示法
        if (/[∩∪∈∉⊂⊃]/.test(text)) matches += 3; // 集合运算符
        if (/[xyz]²|[xyz]³/.test(text)) matches += 2; // 幂次表示
        if (/已知.*[xyz]/.test(text)) matches += 2; // 数学题常见开头
        if (/求.*[xyz]/.test(text)) matches += 2; // 数学题常见结尾
        if (/对于.*[xyz]/.test(text)) matches += 2; // 数学表述
        if (/当.*[><=].*时/.test(text)) matches += 2; // 条件表述
        if (/的了什么/.test(text)) matches += 1; // OCR常见错误但可能是数学内容
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        detectedSubject = subject;
      }
    }

    // 如果仍然未知，进行更深入的模式检测
    if (detectedSubject === '未知') {
      // 英语检测
      if (/[a-zA-Z]{5,}/.test(text) && !/[一二三四五六七八九十]/.test(text)) {
        detectedSubject = '英语';
      }
      // 语文检测
      else if (/[古诗词文言]/.test(text)) {
        detectedSubject = '语文';
      }
      // 数学检测 - 更宽泛的数学特征
      else if (/[\d+\-×÷=<>≤≥≠(){}[\]|]/.test(text) && /[xyz]/.test(text)) {
        detectedSubject = '数学';
      }
      // 基于选项内容的数学检测
      else if (/[A-D]\.\s*\([^)]*[,\d\-+∞)]+\)/.test(text)) {
        detectedSubject = '数学';
      }
    }

    return detectedSubject;
  }

  private detectSubject(text: string): string {
    return this.enhancedDetectSubject(text);
  }
}
