
export interface ParsedQuestion {
  subject: string;
  questionNumber: string | null;
  questionType: string;
  body: string;
  options: { key: string; value: string }[] | null;
}

// 题型分类定义
const QUESTION_TYPES = {
  // 数学题型
  MATH: {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    FILL_BLANK: '填空题',
    SOLVE_PROBLEM: '解答题',
    PROOF: '证明题',
    CALCULATE: '计算题',
    COMPREHENSIVE: '综合题'
  },
  // 物理题型
  PHYSICS: {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    FILL_BLANK: '填空题',
    EXPERIMENT: '实验题',
    SOLVE_PROBLEM: '解答题',
    COMPREHENSIVE: '综合题',
    DRAWING: '作图题'
  },
  // 化学题型
  CHEMISTRY: {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    FILL_BLANK: '填空题',
    EXPERIMENT: '实验题',
    SOLVE_PROBLEM: '解答题',
    COMPREHENSIVE: '综合题',
    JUDGMENT: '判断题'
  },
  // 语文题型
  CHINESE: {
    MODERN_READING: '现代文阅读',
    LANGUAGE_USE: '语言文字运用',
    CLASSICAL_READING: '文言文阅读',
    POETRY_READING: '古代诗歌阅读',
    FAMOUS_RECITATION: '名篇名句默写',
    COMPOSITION: '作文',
    BOOK_READING: '整本书阅读',
    CLASSICAL_SMALL: '文言小题',
    JUDGMENT: '判断题'
  },
  // 英语题型
  ENGLISH: {
    SINGLE_CHOICE: '单项选择',
    READING_COMPREHENSION: '阅读理解',
    CLOZE_TEST: '完形填空',
    GRAMMAR_FILL: '语法填空',
    ERROR_CORRECTION: '改错',
    WORD_FILL: '选词填空',
    TRANSLATION: '翻译',
    SENTENCE_COMPLETION: '完成句子',
    WORD_SPELLING: '单词拼写',
    PASSAGE_FILL: '短文填空',
    WRITING: '书面表达',
    LETTER_WRITING: '书信写作'
  }
};

export function parseQuestion(text: string): ParsedQuestion {
  const originalText = text.trim();
  if (!originalText) {
    return {
      subject: '未知',
      questionNumber: null,
      questionType: '未知',
      body: '',
      options: null,
    };
  }

  let remainingText = originalText;

  // 1. 提取题号
  const questionNumberMatch = remainingText.match(/^(?<number>\d+)\s*[.\uff0e\s]/);
  const questionNumber = questionNumberMatch?.groups?.number || null;
  if (questionNumber) {
    remainingText = remainingText.replace(/^(?<number>\d+)\s*[.\uff0e\s]/, "").trim();
  }

  // 2. 提取选项
  const options: { key: string; value: string }[] = [];
  const optionRegex = /(?<key>[A-Z])\s*[.\uff0e\s](?<value>.*?)(?=\s[A-Z][.\uff0e\s]|$)/g;
  
  const firstOptionMatch = remainingText.match(/\s([A-Z])\s*[.\uff0e\s]/);
  let body = remainingText;
  
  if (firstOptionMatch && firstOptionMatch.index) {
      body = remainingText.substring(0, firstOptionMatch.index).trim();
      const optionsString = remainingText.substring(firstOptionMatch.index).trim();
      let match;
      while ((match = optionRegex.exec(optionsString)) !== null) {
          if (match.groups) {
              options.push({ key: match.groups.key, value: match.groups.value.trim() });
          }
      }
  }

  // 3. 学科检测
  const subject = detectSubject(body);

  // 4. 题型检测
  const questionType = detectQuestionType(body, options.length > 0, subject);

  return {
    subject,
    questionNumber,
    questionType,
    body,
    options: options.length > 0 ? options : null,
  };
}

function detectSubject(text: string): string {
  const subjectKeywords = {
    "数学": {
      keywords: ["集合", "函数", "方程", "不等式", "x²", "sin", "cos", "tan", "M∩", "CRN", "≤", "≥", "∞", "√", "²", "³", "π", "∫", "∑", "导数", "微分", "积分", "概率", "统计", "几何", "代数", "三角", "向量", "矩阵"],
      weight: 1
    },
    "物理": {
      keywords: ["力", "牛顿", "速度", "加速度", "质量", "密度", "压强", "功", "功率", "能量", "动能", "势能", "电流", "电压", "电阻", "磁场", "波长", "频率", "焦耳", "瓦特", "安培", "伏特", "欧姆", "牛", "帕", "赫兹", "实验", "测量"],
      weight: 1
    },
    "化学": {
      keywords: ["原子", "分子", "离子", "化合价", "反应", "溶液", "浓度", "摩尔", "H₂O", "CO₂", "NaCl", "H₂SO₄", "HCl", "NaOH", "CaCO₃", "元素", "周期表", "氧化", "还原", "酸碱", "化学式", "反应式", "实验"],
      weight: 1
    },
    "语文": {
      keywords: ["阅读", "理解", "作者", "文章", "段落", "语法", "修辞", "古诗", "诗歌", "文言文", "古文", "成语", "词语", "句子", "段意", "主旨", "中心思想", "表达方式", "写作手法", "作文", "默写"],
      weight: 1
    },
    "英语": {
      keywords: ["reading", "passage", "choose", "complete", "translate", "grammar", "vocabulary", "sentence", "paragraph", "comprehension", "cloze", "fill", "blank", "word", "phrase", "tense", "voice", "clause", "writing", "letter"],
      weight: 1
    }
  };

  let maxScore = 0;
  let detectedSubject = "未知";

  for (const [subject, config] of Object.entries(subjectKeywords)) {
    const score = config.keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length * config.weight;
    
    if (score > maxScore) {
      maxScore = score;
      detectedSubject = subject;
    }
  }

  return detectedSubject;
}

function detectQuestionType(text: string, hasOptions: boolean, subject: string): string {
  const lowerText = text.toLowerCase();

  // 根据选项数量和内容特征判断题型
  if (hasOptions) {
    // 检查是否为多选题的标志
    const multipleChoiceIndicators = [
      "下列正确的是", "下列错误的是", "正确的有", "错误的有", 
      "符合条件的是", "不符合条件的是", "属于", "不属于",
      "包括", "不包括", "可能", "一定", "选择所有"
    ];
    
    const isMultipleChoice = multipleChoiceIndicators.some(indicator => 
      lowerText.includes(indicator.toLowerCase())
    );
    
    if (isMultipleChoice && subject === "数学") {
      return QUESTION_TYPES.MATH.MULTIPLE_CHOICE;
    } else if (isMultipleChoice && subject === "物理") {
      return QUESTION_TYPES.PHYSICS.MULTIPLE_CHOICE;
    } else if (isMultipleChoice && subject === "化学") {
      return QUESTION_TYPES.CHEMISTRY.MULTIPLE_CHOICE;
    }
    
    // 默认单选题
    if (subject === "英语") {
      return QUESTION_TYPES.ENGLISH.SINGLE_CHOICE;
    } else if (subject === "数学") {
      return QUESTION_TYPES.MATH.SINGLE_CHOICE;
    } else if (subject === "物理") {
      return QUESTION_TYPES.PHYSICS.SINGLE_CHOICE;
    } else if (subject === "化学") {
      return QUESTION_TYPES.CHEMISTRY.SINGLE_CHOICE;
    }
    
    return "单选题";
  }

  // 无选项题型判断
  const typeIndicators = {
    // 填空题
    "填空题": ["填空", "空格", "______", "____", "（）", "___", "完成下列"],
    
    // 解答题/计算题
    "解答题": ["解答", "计算", "求解", "求出", "解下列", "计算下列"],
    
    // 证明题
    "证明题": ["证明", "证", "求证"],
    
    // 实验题
    "实验题": ["实验", "测量", "观察", "记录", "操作"],
    
    // 作图题
    "作图题": ["作图", "画图", "绘制", "画出"],
    
    // 阅读理解
    "阅读理解": ["阅读下列", "根据短文", "passage", "reading", "文章"],
    
    // 完形填空
    "完形填空": ["完形填空", "cloze", "空白处"],
    
    // 翻译题
    "翻译": ["翻译", "translate", "英译汉", "汉译英"],
    
    // 作文
    "作文": ["作文", "写作", "composition", "writing", "essay", "书面表达"],
    
    // 判断题
    "判断题": ["判断", "正确", "错误", "对错", "是否"],
    
    // 语法填空
    "语法填空": ["语法填空", "grammar", "用适当形式"],
    
    // 改错题
    "改错": ["改错", "error", "correction", "找出错误"],
    
    // 文言文阅读
    "文言文阅读": ["文言文", "古文", "古代", "文言"],
    
    // 现代文阅读
    "现代文阅读": ["现代文", "散文", "小说", "记叙文"],
    
    // 诗歌阅读
    "古代诗歌阅读": ["诗歌", "古诗", "词", "诗词"],
    
    // 名句默写
    "名篇名句默写": ["默写", "填写", "补写"]
  };

  for (const [type, indicators] of Object.entries(typeIndicators)) {
    if (indicators.some(indicator => lowerText.includes(indicator.toLowerCase()))) {
      return type;
    }
  }

  // 根据学科返回默认题型
  if (subject === "语文") {
    return "现代文阅读";
  } else if (subject === "英语") {
    return "阅读理解";
  } else if (subject === "数学") {
    return "解答题";
  } else if (subject === "物理") {
    return "解答题";
  } else if (subject === "化学") {
    return "解答题";
  }

  return "主观题";
}
