export interface ParsedQuestion {
  subject: string;
  questionNumber: string | null;
  questionType: string;
  body: string;
  options: { key: string; value: string }[] | null;
  // 新增复合题结构
  parentQuestion?: {
    number: string | null;
    body: string;
  };
  subQuestions?: Array<{
    number: string;
    body: string;
    options?: { key: string; value: string }[];
  }>;
  // 新增公式信息
  hasFormulas: boolean;
  formulaType?: 'latex' | 'mathtype' | 'mixed' | null;
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
      hasFormulas: false,
    };
  }

  // 1. 检测和处理公式
  const formulaInfo = detectAndProcessFormulas(originalText);
  let processedText = formulaInfo.processedText;

  // 2. 检测是否为复合题
  const compositeInfo = detectCompositeQuestion(processedText);
  
  if (compositeInfo.isComposite) {
    return parseCompositeQuestion(processedText, formulaInfo);
  }

  // 3. 常规题目解析
  let remainingText = processedText;

  // 提取题号
  const questionNumberMatch = remainingText.match(/^(?<number>\d+)\s*[.\uff0e\s]/);
  const questionNumber = questionNumberMatch?.groups?.number || null;
  if (questionNumber) {
    remainingText = remainingText.replace(/^(?<number>\d+)\s*[.\uff0e\s]/, "").trim();
  }

  // 提取选项 - 更新正则表达式以支持大小写字母
  const options: { key: string; value: string }[] = [];
  const optionRegex = /(?<key>[A-Za-z])\s*[.\uff0e\s](?<value>.*?)(?=\s[A-Za-z][.\uff0e\s]|$)/g;
  
  const firstOptionMatch = remainingText.match(/\s([A-Za-z])\s*[.\uff0e\s]/);
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

  // 学科检测
  const subject = detectSubject(body);

  // 题型检测 - 增强检测逻辑
  const questionType = detectQuestionType(body, options.length > 0, subject);

  return {
    subject,
    questionNumber,
    questionType,
    body,
    options: options.length > 0 ? options : null,
    hasFormulas: formulaInfo.hasFormulas,
    formulaType: formulaInfo.formulaType,
  };
}

// 新增：检测和处理公式
function detectAndProcessFormulas(text: string): {
  processedText: string;
  hasFormulas: boolean;
  formulaType: 'latex' | 'mathtype' | 'mixed' | null;
} {
  let hasLatex = false;
  let hasMathType = false;
  let processedText = text;

  // 检测LaTeX公式模式
  const latexPatterns = [
    /\$\$[^$]+\$\$/g,           // 块级公式 $$...$$
    /\$[^$\n]+\$/g,            // 行内公式 $...$
    /\\begin\{[^}]+\}.*?\\end\{[^}]+\}/gs,  // LaTeX环境
    /\\[a-zA-Z]+\{[^}]*\}/g,   // LaTeX命令 \command{...}
    /\\[a-zA-Z]+/g,            // 简单LaTeX命令 \alpha, \beta等
    /\\\([^)]+\\\)/g,          // 行内公式 \(...\)
    /\\\[[^\]]+\\\]/g,         // 块级公式 \[...\]
  ];

  // 检测MathType/Equation Editor模式
  const mathTypePatterns = [
    /\{[^{}]*\^[^{}]*\}/g,     // 上标 {base^superscript}
    /\{[^{}]*_[^{}]*\}/g,      // 下标 {base_subscript}
    /√\([^)]+\)/g,             // 根号
    /∫[^∫]*d[xyz]/g,           // 积分
    /∑[^∑]*=/g,                // 求和
    /∏[^∏]*=/g,                // 连乘
    /lim[^→]*→/g,              // 极限
  ];

  // 检测LaTeX
  latexPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      hasLatex = true;
    }
  });

  // 检测MathType
  mathTypePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      hasMathType = true;
    }
  });

  // 标准化公式格式
  if (hasLatex || hasMathType) {
    // 统一公式表示，保持原有格式但添加标记
    processedText = processedText
      // 保护LaTeX公式不被误处理
      .replace(/\$\$([^$]+)\$\$/g, '【数学公式：$1】')
      .replace(/\$([^$\n]+)\$/g, '【数学公式：$1】')
      .replace(/\\begin\{([^}]+)\}(.*?)\\end\{[^}]+\}/gs, '【数学公式：$1环境】')
      // 保护常见数学符号
      .replace(/([≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇])/g, '【数学符号：$1】')
      // 保护分数表示
      .replace(/(\d+)\/(\d+)/g, '【分数：$1/$2】');
  }

  const formulaType = hasLatex && hasMathType ? 'mixed' : 
                     hasLatex ? 'latex' : 
                     hasMathType ? 'mathtype' : null;

  return {
    processedText,
    hasFormulas: hasLatex || hasMathType,
    formulaType
  };
}

// 新增：检测复合题
function detectCompositeQuestion(text: string): { isComposite: boolean } {
  // 检测复合题的特征
  const compositeIndicators = [
    /阅读下面.*?完成.*?题/,
    /根据.*?材料.*?回答.*?问题/,
    /阅读.*?材料.*?完成.*?小题/,
    /根据.*?回答下列问题/,
    /阅读.*?回答.*?问题/,
    // 检测多个独立题号的模式
    /\(\s*\d+\s*\).*?\(\s*\d+\s*\)/s,
    /\d+\s*[.\uff0e].*?\d+\s*[.\uff0e]/s,
  ];

  const isComposite = compositeIndicators.some(pattern => pattern.test(text));
  
  return { isComposite };
}

// 新增：解析复合题
function parseCompositeQuestion(text: string, formulaInfo: any): ParsedQuestion {
  // 提取父题信息
  const parentQuestionMatch = text.match(/^(?<number>\d+)\s*[.\uff0e]\s*(?<body>.*?)(?=\(\s*\d+\s*\)|$)/s);
  
  let parentQuestion = null;
  let remainingText = text;

  if (parentQuestionMatch?.groups) {
    parentQuestion = {
      number: parentQuestionMatch.groups.number,
      body: parentQuestionMatch.groups.body.trim()
    };
    remainingText = text.substring(parentQuestionMatch[0].length).trim();
  }

  // 提取子题
  const subQuestions: Array<{
    number: string;
    body: string;
    options?: { key: string; value: string }[];
  }> = [];

  // 匹配子题模式：(1) 或 1. 或 ① 等
  const subQuestionPattern = /(?:\(\s*(\d+)\s*\)|(\d+)\s*[.\uff0e]|([①②③④⑤⑥⑦⑧⑨⑩]))\s*(.*?)(?=(?:\(\s*\d+\s*\)|(?:\d+)\s*[.\uff0e]|[①②③④⑤⑥⑦⑧⑨⑩])|$)/gs;
  
  let subMatch;
  while ((subMatch = subQuestionPattern.exec(remainingText)) !== null) {
    const subNumber = subMatch[1] || subMatch[2] || subMatch[3];
    const subBody = subMatch[4].trim();
    
    if (subNumber && subBody) {
      // 检查是否有选项 - 更新为支持大小写字母
      const optionRegex = /([A-Za-z])\s*[.\uff0e\s](.*?)(?=\s[A-Za-z][.\uff0e\s]|$)/g;
      const options: { key: string; value: string }[] = [];
      
      const firstOptionMatch = subBody.match(/\s([A-Za-z])\s*[.\uff0e\s]/);
      let cleanSubBody = subBody;
      
      if (firstOptionMatch && firstOptionMatch.index) {
        cleanSubBody = subBody.substring(0, firstOptionMatch.index).trim();
        const optionsString = subBody.substring(firstOptionMatch.index).trim();
        let optionMatch;
        while ((optionMatch = optionRegex.exec(optionsString)) !== null) {
          options.push({ key: optionMatch[1], value: optionMatch[2].trim() });
        }
      }

      subQuestions.push({
        number: subNumber,
        body: cleanSubBody,
        options: options.length > 0 ? options : undefined
      });
    }
  }

  // 检测整体学科
  const fullText = (parentQuestion?.body || '') + ' ' + subQuestions.map(sq => sq.body).join(' ');
  const subject = detectSubject(fullText);

  return {
    subject,
    questionNumber: parentQuestion?.number || null,
    questionType: '复合题',
    body: parentQuestion?.body || text,
    options: null,
    parentQuestion,
    subQuestions: subQuestions.length > 0 ? subQuestions : undefined,
    hasFormulas: formulaInfo.hasFormulas,
    formulaType: formulaInfo.formulaType,
  };
}

function detectSubject(text: string): string {
  const subjectKeywords = {
    "数学": {
      keywords: [
        // 基础数学词汇
        "集合", "函数", "方程", "不等式", "导数", "微分", "积分", "概率", "统计", 
        "几何", "代数", "三角", "向量", "矩阵", "数列", "极限", "定义域", "值域",
        // 数学符号和表达式
        "x²", "sin", "cos", "tan", "log", "ln", "exp", "M∩", "CRN", "∪", "∈", "⊂",
        // 数学运算符号
        "≤", "≥", "≠", "≈", "∞", "√", "²", "³", "π", "∫", "∑", "∏", "∂", "∆",
        // 高中数学特定内容
        "二次函数", "一元二次方程", "线性规划", "排列组合", "概率分布",
        "解析几何", "立体几何", "平面向量", "数学归纳法", "等差数列", "等比数列"
      ],
      weight: 2 // 提高数学的权重
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

  // 增强数学检测 - 检查数学符号和公式模式
  if (detectedSubject === "未知") {
    const mathPatterns = [
      /[xy]\s*[²³⁴⁵⁶⁷⁸⁹]/,  // 指数表达式
      /\b[xy]\s*[=<>≤≥]/,        // 变量和不等式
      /[∫∑∏]/,                   // 积分、求和、连乘
      /sin|cos|tan|log|ln/,      // 三角函数和对数
      /[{}\[\]()]\s*[xy]/,       // 包含变量的括号表达式
      /集合|函数|方程|不等式/,    // 中文数学词汇
      /定义域|值域|单调/,         // 函数相关词汇
    ];
    
    if (mathPatterns.some(pattern => pattern.test(text))) {
      detectedSubject = "数学";
      maxScore = 2; // 给予高分
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

  // 无选项题型判断 - 增强数学题型识别
  const typeIndicators = {
    // 填空题
    "填空题": ["填空", "空格", "______", "____", "（）", "___", "完成下列"],
    
    // 解答题/计算题 - 增强数学相关词汇
    "解答题": [
      "解答", "计算", "求解", "求出", "解下列", "计算下列", "求函数", "求方程",
      "求不等式", "求集合", "求定义域", "求值域", "求导数", "求积分", "求极限"
    ],
    
    // 证明题
    "证明题": ["证明", "证", "求证"],
    
    // 实验题
    "实验题": ["实验", "测量", "观察", "记录", "操作"],
    
    // 作图题
    "作图题": ["作图", "画图", "绘制", "画出", "作函数图像"],
    
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

  // 优先检查具体题型
  for (const [type, indicators] of Object.entries(typeIndicators)) {
    if (indicators.some(indicator => lowerText.includes(indicator.toLowerCase()))) {
      return type;
    }
  }

  // 根据学科和内容特征进一步判断
  if (subject === "数学") {
    // 数学特殊题型识别
    if (/求.*的.*值|计算.*的.*值|求.*等于/.test(text)) {
      return QUESTION_TYPES.MATH.CALCULATE;
    }
    if (/已知.*求|设.*求|若.*求/.test(text)) {
      return QUESTION_TYPES.MATH.SOLVE_PROBLEM;
    }
    if (/证明.*等式|证明.*不等式|证明.*函数/.test(text)) {
      return QUESTION_TYPES.MATH.PROOF;
    }
    return QUESTION_TYPES.MATH.SOLVE_PROBLEM;
  } else if (subject === "语文") {
    return "现代文阅读";
  } else if (subject === "英语") {
    return "阅读理解";
  } else if (subject === "物理") {
    return "解答题";
  } else if (subject === "化学") {
    return "解答题";
  }

  return "主观题";
}
