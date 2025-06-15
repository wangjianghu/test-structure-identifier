
export interface ParsedQuestion {
  subject: string;
  questionNumber: string | null;
  questionType: string;
  body: string;
  options: { key: string; value: string }[] | null;
}

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
  
  const questionType = options.length > 0 ? "选择题" : "主观题";

  // 3. 简单的学科检测
  const subjectKeywords: { [key: string]: string[] } = {
    "数学": ["集合", "函数", "方程", "x²", "sin", "cos", "tan", "M∩", "CRN", "≤0"],
    "物理": ["力", "牛顿", "速度", "加速度", "焦耳", "电路"],
    "化学": ["化学", "元素", "分子", "原子", "mol", "反应"],
    "语文": ["阅读", "古诗", "成语", "作者", "文言文"],
    "英语": ["passage", "word", "sentence", "English", "choose", "read"],
  };

  let subject: string = "未知";
  for (const sub in subjectKeywords) {
      if (subjectKeywords[sub].some(keyword => body.includes(keyword))) {
          subject = sub;
          break;
      }
  }

  return {
    subject,
    questionNumber,
    questionType,
    body,
    options: options.length > 0 ? options : null,
  };
}
