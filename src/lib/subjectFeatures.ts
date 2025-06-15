
// 学科特征数据库 - 用于提高学科识别准确性
export interface SubjectFeature {
  keywords: string[];
  symbols: string[];
  patterns: RegExp[];
  contextWords: string[];
  exclusiveFeatures: string[];
}

export const SUBJECT_FEATURES: Record<string, SubjectFeature> = {
  '数学': {
    keywords: [
      // 基础数学概念
      '函数', '方程', '不等式', '集合', '概率', '统计', '几何', '代数',
      '三角', '导数', '积分', '微分', '向量', '矩阵', '数列', '级数',
      // 数学运算和关系
      '已知', '设', '求', '证明', '计算', '解', '若', '则', '当', '对于',
      '使得', '满足', '子集', '交集', '并集', '补集', '定义域', '值域',
      '单调', '周期', '奇偶', '零点', '最值', '极值', '渐近线',
      // 数学对象和术语
      '实数', '有理数', '无理数', '整数', '自然数', '复数', '虚数',
      '平面', '直线', '圆', '椭圆', '双曲线', '抛物线', '立体', '空间',
      '角度', '弧度', '正弦', '余弦', '正切', '对数', '指数', '幂函数'
    ],
    symbols: [
      '=', '≠', '≤', '≥', '<', '>', '+', '-', '×', '÷', '∞', '√',
      '²', '³', '¹', '⁰', 'x', 'y', 'z', 'f', 'g', 'π', 'α', 'β', 'γ', 'θ',
      '∈', '∉', '∩', '∪', '⊂', '⊃', '∅', '∠', '∴', '∵', '∫', '∑', '∏',
      'sin', 'cos', 'tan', 'log', 'ln', 'lim', 'Δ', '∇', '∂', '°', '′', '″'
    ],
    patterns: [
      /\b[xyz]\s*[²³¹⁰]?\s*[+\-=≤≥<>≠]\s*[\d\-]/,
      /\{.*[xyz].*\|.*\}/,
      /[∩∪∈∉⊂⊃]/,
      /\b(sin|cos|tan|log|ln)\s*[xyz(]/,
      /已知.*[xyz]/,
      /求.*[xyz]/,
      /对于.*[xyz]/,
      /当.*[><=].*时/,
      /\(\s*[\d\-]+\s*,\s*[\d\-]+\s*\)/,
      /[A-D]\.\s*\([^)]*[,\d\-+∞)]+\)/
    ],
    contextWords: [
      '题', '选择', '填空', '计算', '证明', '解答', '求解', '化简',
      '比较', '判断', '作图', '画出', '求出', '确定', '验证'
    ],
    exclusiveFeatures: ['=', '≠', '≤', '≥', '∞', '√', '∫', '∑', 'π']
  },

  '物理': {
    keywords: [
      // 力学
      '力', '速度', '加速度', '质量', '密度', '压强', '功', '功率', '能量',
      '动能', '势能', '重力', '摩擦力', '弹力', '浮力', '压力', '冲量', '动量',
      '牛顿', '胡克', '阿基米德', '帕斯卡',
      // 电学
      '电流', '电压', '电阻', '电容', '电感', '磁场', '电场', '电荷',
      '库仑', '欧姆', '安培', '伏特', '瓦特', '焦耳', '法拉第',
      // 热学
      '温度', '热量', '比热', '热容', '熔点', '沸点', '蒸发', '凝固',
      '热传导', '对流', '辐射', '热膨胀',
      // 光学
      '光', '反射', '折射', '衍射', '干涉', '偏振', '透镜', '棱镜',
      '波长', '频率', '振幅', '周期', '相位',
      // 原子物理
      '原子', '电子', '质子', '中子', '核反应', '放射性', '半衰期'
    ],
    symbols: [
      'v', 'a', 'm', 'F', 'P', 'E', 'U', 'I', 'R', 'Q', 'W', 't',
      'ρ', 'μ', 'ε', 'λ', 'ν', 'ω', 'φ', 'θ', 'g', 'c', 'h', 'k',
      'N', 'J', 'W', 'V', 'A', 'Ω', 'Hz', 'Pa', 'C', 'F', 'H', 'T'
    ],
    patterns: [
      /[vafmPEUI]\s*[=]/,
      /\d+\s*(m\/s|km\/h|N|J|W|V|A|Ω|Hz|Pa|°C|K)/,
      /电路|磁场|重力|摩擦/,
      /实验.*测量/,
      /物体.*运动/
    ],
    contextWords: [
      '实验', '测量', '观察', '分析', '推导', '验证', '探究',
      '现象', '规律', '定律', '公式', '单位', '量纲'
    ],
    exclusiveFeatures: ['N', 'J', 'W', 'V', 'A', 'Ω', 'Hz', 'Pa', '°C']
  },

  '化学': {
    keywords: [
      // 基础概念
      '原子', '分子', '离子', '化合价', '反应', '溶液', '浓度', '摩尔',
      '元素', '周期表', '同位素', '化学键', '电子', '质子', '中子',
      '化学式', '反应式', '方程式', '配平',
      // 化学反应
      '氧化', '还原', '酸', '碱', '盐', '中和', '沉淀', '气体',
      '燃烧', '分解', '化合', '置换', '复分解',
      // 有机化学
      '烷烃', '烯烃', '炔烃', '苯', '醇', '醛', '酮', '酸', '酯',
      '聚合', '加成', '取代', '消去', '水解',
      // 实验
      '试剂', '指示剂', '催化剂', '滴定', '蒸馏', '萃取', '结晶'
    ],
    symbols: [
      'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
      'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
      'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Hg', 'Pb', 'I', 'Br',
      'H₂O', 'CO₂', 'NaCl', 'H₂SO₄', 'HCl', 'NaOH', 'CaCO₃',
      'NH₃', 'CH₄', 'C₂H₆', 'C₂H₄', 'C₆H₆'
    ],
    patterns: [
      /[A-Z][a-z]?₂?[A-Z]?[a-z]?₂?/,
      /\d*[A-Z][a-z]?₂?\s*[+\-→←⇌]/,
      /pH\s*[=<>]/,
      /mol\/L|g\/mol|℃/,
      /实验.*反应/
    ],
    contextWords: [
      '反应', '实验', '元素', '周期表', '化学反应', '化学式',
      '配平', '计算', '分析', '推断', '现象', '条件'
    ],
    exclusiveFeatures: ['H₂O', 'CO₂', 'NaCl', 'H₂SO₄', 'mol', 'pH']
  },

  '语文': {
    keywords: [
      // 文学体裁
      '诗歌', '古诗', '词', '曲', '文言文', '古文', '散文', '小说',
      '记叙文', '说明文', '议论文', '应用文', '戏剧', '传记',
      // 文学要素
      '作者', '文章', '段落', '中心思想', '主旨', '主题', '情感',
      '修辞', '表达方式', '写作手法', '艺术手法', '表现手法',
      '比喻', '拟人', '排比', '对偶', '夸张', '反复', '设问', '反问',
      // 语言文字
      '成语', '词语', '句子', '语法', '语言', '文字', '汉字',
      '拼音', '笔画', '部首', '偏旁', '声母', '韵母', '声调',
      // 阅读理解
      '阅读', '理解', '分析', '概括', '归纳', '赏析', '评价', '感受',
      '体会', '领悟', '品味', '欣赏', '鉴赏'
    ],
    symbols: [
      '。', '，', '；', '：', '？', '！', '"', '"', ''', ''',
      '（', '）', '【', '】', '《', '》', '〈', '〉', '……'
    ],
    patterns: [
      /阅读.*材料/,
      /下列.*正确/,
      /文中.*意思/,
      /作者.*表达/,
      /修辞.*作用/,
      /古诗.*赏析/
    ],
    contextWords: [
      '阅读', '理解', '作文', '默写', '古诗', '文言文',
      '分析', '概括', '赏析', '背诵', '朗读', '书写'
    ],
    exclusiveFeatures: ['古诗', '文言文', '修辞', '作者', '主旨']
  },

  '英语': {
    keywords: [
      // 语法
      'grammar', 'tense', 'verb', 'noun', 'adjective', 'adverb',
      'pronoun', 'preposition', 'conjunction', 'article',
      'subject', 'predicate', 'object', 'clause',
      // 阅读理解
      'reading', 'comprehension', 'passage', 'text', 'article',
      'paragraph', 'sentence', 'word', 'phrase', 'meaning',
      // 写作
      'writing', 'essay', 'letter', 'composition', 'story',
      'dialogue', 'conversation', 'narrative', 'description',
      // 词汇
      'vocabulary', 'spelling', 'pronunciation', 'definition',
      'synonym', 'antonym', 'translation'
    ],
    symbols: [
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had',
      'will', 'would', 'can', 'could', 'may', 'might', 'must', 'should'
    ],
    patterns: [
      /\b[A-Z][a-z]*\s+[a-z]+\s+[a-z]+/,
      /read.*passage/i,
      /choose.*correct/i,
      /complete.*sentence/i,
      /translate.*Chinese/i,
      /according.*passage/i
    ],
    contextWords: [
      'read', 'choose', 'complete', 'fill', 'translate', 'write',
      'answer', 'question', 'passage', 'comprehension', 'listening',
      'speaking', 'vocabulary', 'grammar'
    ],
    exclusiveFeatures: ['passage', 'reading', 'comprehension', 'grammar', 'vocabulary']
  },

  '生物': {
    keywords: [
      // 细胞生物学
      '细胞', '细胞膜', '细胞壁', '细胞核', '细胞质', '线粒体',
      '叶绿体', '核糖体', '内质网', '高尔基体', 'DNA', 'RNA',
      // 遗传学
      '基因', '染色体', '遗传', '变异', '突变', '杂交',
      '显性', '隐性', '基因型', '表现型', '等位基因',
      // 生理学
      '呼吸', '消化', '循环', '排泄', '神经', '内分泌',
      '免疫', '新陈代谢', '光合作用', '呼吸作用',
      // 生态学
      '生态系统', '食物链', '食物网', '生产者', '消费者',
      '分解者', '种群', '群落', '环境', '进化'
    ],
    symbols: [
      'ATP', 'ADP', 'CO₂', 'O₂', 'H₂O', 'C₆H₁₂O₆',
      '℃', 'pH', 'mol/L'
    ],
    patterns: [
      /细胞.*结构/,
      /基因.*遗传/,
      /生物.*实验/,
      /植物.*动物/,
      /ATP.*ADP/
    ],
    contextWords: [
      '生物', '实验', '观察', '培养', '显微镜', '标本',
      '分析', '研究', '探究', '验证'
    ],
    exclusiveFeatures: ['细胞', 'DNA', 'RNA', 'ATP', '基因', '染色体']
  },

  '历史': {
    keywords: [
      // 中国古代史
      '秦汉', '魏晋', '隋唐', '宋元', '明清', '春秋', '战国',
      '皇帝', '朝代', '封建', '农民起义', '变法', '改革',
      // 中国近现代史
      '鸦片战争', '洋务运动', '戊戌变法', '辛亥革命',
      '五四运动', '新文化运动', '抗日战争', '解放战争',
      // 世界史
      '古希腊', '古罗马', '中世纪', '文艺复兴', '启蒙运动',
      '工业革命', '法国大革命', '美国独立战争', '第一次世界大战', '第二次世界大战'
    ],
    symbols: ['年', '世纪', '公元', 'BC', 'AD'],
    patterns: [
      /\d+年/,
      /公元.*年/,
      /\d+世纪/,
      /历史.*事件/,
      /朝代.*皇帝/
    ],
    contextWords: [
      '历史', '时代', '事件', '人物', '制度', '文化',
      '政治', '经济', '社会', '影响', '意义', '作用'
    ],
    exclusiveFeatures: ['朝代', '皇帝', '革命', '战争', '变法']
  },

  '地理': {
    keywords: [
      // 自然地理
      '地形', '地貌', '山脉', '平原', '高原', '盆地', '丘陵',
      '河流', '湖泊', '海洋', '气候', '降水', '温度', '季风',
      '地震', '火山', '板块', '构造', '岩石', '土壤',
      // 人文地理
      '人口', '城市', '农业', '工业', '交通', '经济',
      '文化', '民族', '宗教', '政治', '国家', '地区',
      // 地图
      '经度', '纬度', '坐标', '方向', '比例尺', '图例'
    ],
    symbols: ['°', '′', '″', 'N', 'S', 'E', 'W', 'km', 'm', 'mm'],
    patterns: [
      /\d+°\d+'[NS]/,
      /\d+°\d+'[EW]/,
      /地理.*位置/,
      /气候.*特点/,
      /地形.*特征/
    ],
    contextWords: [
      '地理', '地图', '位置', '分布', '特征', '影响',
      '因素', '条件', '资源', '环境', '发展', '变化'
    ],
    exclusiveFeatures: ['经度', '纬度', '地形', '气候', '地图']
  }
};

// 获取学科的独特特征权重
export function getSubjectExclusiveWeight(text: string, subject: string): number {
  const features = SUBJECT_FEATURES[subject];
  if (!features) return 0;
  
  let weight = 0;
  features.exclusiveFeatures.forEach(feature => {
    if (text.includes(feature)) {
      weight += 2; // 独特特征给予更高权重
    }
  });
  
  return weight;
}

// 获取模式匹配得分
export function getPatternMatchScore(text: string, subject: string): number {
  const features = SUBJECT_FEATURES[subject];
  if (!features) return 0;
  
  let score = 0;
  features.patterns.forEach(pattern => {
    if (pattern.test(text)) {
      score += 3; // 模式匹配给予高权重
    }
  });
  
  return score;
}
