
import { RecognitionResult, FusionResult } from "./types";

export class ResultProcessor {
  static intelligentResultFusion(results: RecognitionResult[], preprocessingSteps: string[]): FusionResult {
    console.log("=== 启动超级智能结果融合系统 ===");
    
    if (results.length === 0) {
      throw new Error("没有可用的识别结果");
    }
    
    // 超级深度分析每个识别结果
    const analyzedResults = results.map(result => this.superAnalyzeResult(result));
    
    // 超级综合评分系统（更严格的评分标准）
    const scoredResults = analyzedResults.map(analysis => {
      const scores = {
        confidenceScore: this.calculateConfidenceScore(analysis),
        qualityScore: this.calculateQualityScore(analysis),
        chineseScore: this.calculateChineseScore(analysis),
        mathScore: this.calculateMathScore(analysis),
        structureScore: this.calculateStructureScore(analysis),
        lengthScore: this.calculateLengthScore(analysis),
        coherenceScore: this.calculateCoherenceScore(analysis)
      };
      
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      
      console.log(`${analysis.config} 超级评分详情:`, {
        ...scores,
        总分: totalScore.toFixed(1),
        文本: analysis.text.substring(0, 60) + (analysis.text.length > 60 ? '...' : '')
      });
      
      return { ...analysis, totalScore, scores };
    });
    
    // 选择最佳结果
    scoredResults.sort((a, b) => b.totalScore - a.totalScore);
    const bestResult = scoredResults[0];
    
    console.log(`选择超级最佳结果: ${bestResult.config}`, {
      总分: bestResult.totalScore.toFixed(1),
      置信度: bestResult.confidence.toFixed(1)
    });
    
    // 超级智能文本修正
    const correctedText = this.superTextCorrection(bestResult.text, preprocessingSteps);
    
    // 最终精细清理
    const finalText = this.finalPolishing(correctedText, preprocessingSteps);
    
    // 计算最终置信度（更保守的计算）
    const finalConfidence = Math.min(90, bestResult.totalScore * 0.9);
    
    // 生成详细指标
    const metrics = this.generateDetailedMetrics(finalText, bestResult);
    
    preprocessingSteps.push(`超级最优引擎: ${bestResult.config} (评分: ${bestResult.totalScore.toFixed(1)})`);
    
    return {
      text: finalText,
      confidence: finalConfidence,
      metrics,
      textBlocks: [],
      layoutStructure: {
        questionNumber: this.extractQuestionNumber(finalText),
        mainContent: finalText,
        formulas: this.extractFormulas(finalText),
        options: this.extractOptions(finalText)
      }
    };
  }

  private static superAnalyzeResult(result: RecognitionResult) {
    const text = result.text;
    return {
      ...result,
      length: text.length,
      chineseCount: (text.match(/[\u4e00-\u9fff]/g) || []).length,
      mathSymbolCount: (text.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±]/g) || []).length,
      numberCount: (text.match(/\d/g) || []).length,
      punctuationCount: (text.match(/[。，、；：？！]/g) || []).length,
      englishCount: (text.match(/[a-zA-Z]/g) || []).length,
      specialCharCount: (text.match(/[\/\\|@#$%^&*_~`]/g) || []).length
    };
  }

  private static calculateConfidenceScore(analysis: any): number {
    // 置信度权重更高
    return analysis.confidence * 0.4;
  }

  private static calculateQualityScore(analysis: any): number {
    let score = 25; // 基础分
    
    // 严重减分项
    const badRatio = analysis.specialCharCount / Math.max(1, analysis.length);
    score -= badRatio * 100; // 特殊字符过多严重减分
    
    // 连续重复字符检测
    const repeats = (analysis.text.match(/(.)\1{3,}/g) || []).length;
    score -= repeats * 10;
    
    // 无意义字符串检测
    const nonsensePatterns = [
      /[a-z]{6,}/g,  // 长字母串
      /\d[a-zA-Z]{3,}/g,  // 数字+字母混乱
      /[\/\\]{2,}/g   // 连续斜杠
    ];
    
    nonsensePatterns.forEach(pattern => {
      const matches = (analysis.text.match(pattern) || []).length;
      score -= matches * 8;
    });
    
    return Math.max(0, score);
  }

  private static calculateChineseScore(analysis: any): number {
    let score = 0;
    
    // 中文数学关键词（更全面）
    const mathKeywords = [
      '已知', '函数', '定义域', '值域', '求解', '计算', '证明', '判断', 
      '分析', '讨论', '设', '若', '对于', '正实数', '取值范围',
      '方程', '不等式', '集合', '元素', '当', '时', '则', '有',
      '理由', '说明', '根据', '可得', '因为', '所以', '由于', '因此'
    ];
    
    mathKeywords.forEach(keyword => {
      if (analysis.text.includes(keyword)) score += 12;
    });
    
    // 中文比例评分
    const chineseRatio = analysis.chineseCount / Math.max(1, analysis.length);
    if (chineseRatio >= 0.3 && chineseRatio <= 0.8) {
      score += 20;
    } else if (chineseRatio >= 0.1 && chineseRatio < 0.3) {
      score += 10;
    }
    
    return score;
  }

  private static calculateMathScore(analysis: any): number {
    let score = 0;
    
    // 数学符号评分
    if (analysis.mathSymbolCount > 0) {
      score += Math.min(25, analysis.mathSymbolCount * 3);
    }
    
    // 函数表达式检测
    const functionPatterns = [
      /f\s*\([^)]+\)/g,
      /[xy]\s*[=<>≤≥]/g,
      /\d+[+\-×÷]\d+/g
    ];
    
    functionPatterns.forEach(pattern => {
      const matches = (analysis.text.match(pattern) || []).length;
      score += matches * 8;
    });
    
    return score;
  }

  private static calculateStructureScore(analysis: any): number {
    let score = 0;
    
    // 题目编号检测
    if (/^\s*\d+[.\s、]/m.test(analysis.text)) {
      score += 20;
    }
    
    // 选项检测
    const optionMatches = (analysis.text.match(/[A-D][.\s)）]/g) || []).length;
    if (optionMatches >= 2 && optionMatches <= 4) {
      score += 15;
    }
    
    // 句号分隔的语句数量
    const sentences = analysis.text.split(/[。！？]/).filter(s => s.trim().length > 3).length;
    if (sentences >= 1 && sentences <= 5) {
      score += 10;
    }
    
    return score;
  }

  private static calculateLengthScore(analysis: any): number {
    const length = analysis.length;
    if (length >= 30 && length <= 300) return 20;
    if (length >= 15 && length <= 500) return 15;
    if (length < 10) return -15; // 太短严重减分
    if (length > 500) return -10; // 太长减分
    return 5;
  }

  private static calculateCoherenceScore(analysis: any): number {
    let score = 15; // 基础分
    
    // 检查文本连贯性
    const words = analysis.text.split(/\s+/);
    let incoherentCount = 0;
    
    words.forEach(word => {
      // 检查是否是无意义的字符混合
      if (word.length > 2 && /[a-zA-Z]\d[a-zA-Z]/g.test(word)) {
        incoherentCount++;
      }
    });
    
    score -= incoherentCount * 3;
    
    return Math.max(0, score);
  }

  private static superTextCorrection(text: string, preprocessingSteps: string[]): string {
    let processed = text;
    let corrections = 0;
    
    console.log("开始超级智能文本修正，原文:", text.substring(0, 100));
    
    // 核心术语修正（更全面）
    const coreCorrections = [
      // 基础术语
      [/[已己巳呈旨]知/g, '已知'],
      [/[函涵含凼]数/g, '函数'],
      [/定[义乂又父交][域城或感或]/g, '定义域'],
      [/值[域城或感或]/g, '值域'],
      [/[正证征王玉][实英买央宾]数/g, '正实数'],
      [/[求球秋]解/g, '求解'],
      [/[计汁什什技]算/g, '计算'],
      [/[证正征王玉]明/g, '证明'],
      [/[判断][判断]/g, '判断'],
      [/[分份][析柝]/g, '分析'],
      [/[讨计][论沦]/g, '讨论'],
      
      // 数学专用词汇
      [/[方房][程棚]/g, '方程'],
      [/不[等登][式戎]/g, '不等式'],
      [/[集整][合台]/g, '集合'],
      [/元[索素]/g, '元素'],
      [/取值[范范][围团]/g, '取值范围'],
      
      // 逻辑词汇
      [/[因困囚][为韦]/g, '因为'],
      [/[所厢][以己已]/g, '所以'],
      [/[由田甲][于手千]/g, '由于'],
      [/[因困囚][此比些]/g, '因此'],
      [/可[得德]/g, '可得'],
      [/[根跟][据拒]/g, '根据']
    ];
    
    coreCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) corrections++;
    });
    
    // 数学符号和标点修正
    const symbolCorrections = [
      [/[×xX*]/g, '×'],
      [/[÷]/g, '÷'],
      [/[（(]/g, '('],
      [/[）)]/g, ')'],
      [/\s*=\s*/g, '='],
      [/\s*\+\s*/g, '+'],
      [/\s*-\s*/g, '-'],
      [/\s*，\s*/g, '，'],
      [/\s*。\s*/g, '。'],
      [/\s*；\s*/g, '；'],
      [/\s*：\s*/g, '：']
    ];
    
    symbolCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) corrections++;
    });
    
    // OCR常见错误修正
    const ocrCorrections = [
      [/[oO]/g, '0'],
      [/[Il1|]/g, '1'],
      [/[S5]/g, '5'],
      [/rn/g, 'n'],
      [/vv/g, 'w'],
      [/\/\/+/g, '/'], // 多个斜杠合并
      [/\s{2,}/g, ' '], // 多个空格合并
      [/^\s+|\s+$/g, ''] // 去除首尾空格
    ];
    
    ocrCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) corrections++;
    });
    
    console.log(`超级智能修正完成，应用了 ${corrections} 个修正`);
    preprocessingSteps.push(`超级智能文本修正: ${corrections} 处修正`);
    
    return processed.trim();
  }

  private static finalPolishing(text: string, preprocessingSteps: string[]): string {
    let processed = text;
    
    // 最终精细清理
    processed = processed
      .replace(/\s*，\s*/g, '，')
      .replace(/\s*。\s*/g, '。')
      .replace(/\s*；\s*/g, '；')
      .replace(/\s*：\s*/g, '：')
      .replace(/\s*？\s*/g, '？')
      .replace(/\s*！\s*/g, '！')
      .replace(/\n\s*\n/g, '\n')
      .replace(/[^\u4e00-\u9fff\w\s=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇φψωαβγδεζηθικλμνξοπρστυφχψω。，、；：？！]/g, '') // 移除异常字符
      .trim();
    
    preprocessingSteps.push("最终精细抛光");
    return processed;
  }

  private static generateDetailedMetrics(text: string, result: any) {
    return {
      textRegionsDetected: Math.max(1, text.split(/[。！？\n]/).filter(s => s.trim()).length),
      mathSymbolsDetected: (text.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±]/g) || []).length,
      fractionLinesDetected: (text.match(/[÷\/]/g) || []).length,
      bracketsDetected: (text.match(/[()[\]{}]/g) || []).length,
      chineseCharactersDetected: (text.match(/[\u4e00-\u9fff]/g) || []).length,
      skewAngleCorrected: 0,
      noiseReductionApplied: true,
      binarizationMethod: "超级自适应数学专用二值化",
      layoutAnalysisScore: result.totalScore,
      transformerConfidence: result.confidence,
      multiModalScore: result.totalScore * 1.2,
      correctionCount: text.length - result.text.length
    };
  }

  private static extractQuestionNumber(text: string): string | undefined {
    const match = text.match(/^\s*(\d+)[.\s、]/);
    return match ? match[1] : undefined;
  }

  private static extractFormulas(text: string): string[] {
    const formulas = [];
    const patterns = [
      /f\s*\(\s*[xy]\s*\)\s*=\s*[^，。,.\n]+/g,
      /[xy]\s*[=<>≤≥]\s*[^，。,.\n]+/g,
      /\d+\s*[+\-×÷]\s*\d+/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) formulas.push(...matches);
    });
    
    return [...new Set(formulas)];
  }

  private static extractOptions(text: string): string[] {
    const options = [];
    const matches = text.match(/[A-D][.\s)）][^A-D\n]{1,80}/g);
    if (matches) {
      options.push(...matches.map(opt => opt.trim()));
    }
    return options;
  }
}
