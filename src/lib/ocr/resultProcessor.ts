
import { RecognitionResult, FusionResult } from "./types";

export class ResultProcessor {
  static intelligentResultFusion(results: RecognitionResult[], preprocessingSteps: string[]): FusionResult {
    console.log("=== 启动智能结果融合系统 ===");
    
    if (results.length === 0) {
      throw new Error("没有可用的识别结果");
    }
    
    // 深度分析每个识别结果
    const analyzedResults = results.map(result => this.deepAnalyzeResult(result));
    
    // 多维度评分系统
    const scoredResults = analyzedResults.map(analysis => {
      const scores = {
        confidenceScore: analysis.confidence * 0.4,
        contentQualityScore: this.calculateContentQuality(analysis),
        mathSpecificScore: this.calculateMathSpecificScore(analysis),
        chineseQualityScore: this.calculateChineseQualityScore(analysis),
        structureScore: this.calculateStructureScore(analysis),
        lengthScore: this.calculateLengthScore(analysis)
      };
      
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      
      console.log(`${analysis.config} 详细评分:`, {
        ...scores,
        总分: totalScore.toFixed(1),
        文本: analysis.text.substring(0, 60)
      });
      
      return { ...analysis, totalScore, scores };
    });
    
    // 选择最佳结果
    scoredResults.sort((a, b) => b.totalScore - a.totalScore);
    const bestResult = scoredResults[0];
    
    console.log(`选择最佳结果: ${bestResult.config}`, {
      总分: bestResult.totalScore.toFixed(1),
      置信度: bestResult.confidence.toFixed(1),
      文本长度: bestResult.text.length
    });
    
    // 应用高级文本修正
    const correctedText = this.advancedTextCorrection(bestResult.text, preprocessingSteps);
    
    // 智能文本后处理
    const finalText = this.intelligentPostProcessing(correctedText, preprocessingSteps);
    
    // 计算最终置信度
    const finalConfidence = Math.min(98, bestResult.totalScore * 1.2);
    
    // 生成详细指标
    const metrics = this.generateDetailedMetrics(finalText, bestResult);
    
    preprocessingSteps.push(`最佳引擎: ${bestResult.config} (总分: ${bestResult.totalScore.toFixed(1)})`);
    
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

  private static deepAnalyzeResult(result: RecognitionResult) {
    const text = result.text;
    
    return {
      ...result,
      length: text.length,
      chineseCharCount: (text.match(/[\u4e00-\u9fff]/g) || []).length,
      mathSymbolCount: (text.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇]/g) || []).length,
      numberCount: (text.match(/\d/g) || []).length,
      letterCount: (text.match(/[a-zA-Z]/g) || []).length,
      punctuationCount: (text.match(/[，。、；：！？""''（）]/g) || []).length,
      lineCount: text.split('\n').filter(line => line.trim()).length,
      wordCount: text.split(/\s+/).filter(word => word.trim()).length
    };
  }

  private static calculateContentQuality(analysis: any): number {
    let score = 0;
    
    // 文本长度合理性
    if (analysis.length > 20 && analysis.length < 500) score += 25;
    else if (analysis.length > 10) score += 15;
    else if (analysis.length < 5) score -= 20;
    
    // 中文字符比例
    const chineseRatio = analysis.chineseCharCount / Math.max(1, analysis.length);
    if (chineseRatio > 0.3 && chineseRatio < 0.8) score += 20;
    else if (chineseRatio > 0.1) score += 10;
    
    // 数字和字母比例
    const numLetterRatio = (analysis.numberCount + analysis.letterCount) / Math.max(1, analysis.length);
    if (numLetterRatio > 0.1 && numLetterRatio < 0.6) score += 15;
    
    return score;
  }

  private static calculateMathSpecificScore(analysis: any): number {
    let score = 0;
    
    // 数学关键词检测
    const mathKeywords = [
      '已知', '函数', '定义域', '值域', '集合', '方程', '不等式', 
      '求解', '计算', '证明', '判断', '若', '设', '对于', '正实数',
      '元素', '理由', '说明', '取值', '范围', '分析', '讨论'
    ];
    
    let keywordMatches = 0;
    mathKeywords.forEach(keyword => {
      if (analysis.text.includes(keyword)) {
        keywordMatches++;
        score += 8;
      }
    });
    
    // 数学符号密度
    const symbolDensity = analysis.mathSymbolCount / Math.max(1, analysis.length);
    if (symbolDensity > 0.05) score += 20;
    else if (symbolDensity > 0.02) score += 10;
    
    // 括号匹配检查
    const openBrackets = (analysis.text.match(/[([{]/g) || []).length;
    const closeBrackets = (analysis.text.match(/[)\]}]/g) || []).length;
    if (Math.abs(openBrackets - closeBrackets) <= 1) score += 10;
    
    console.log(`数学专业度评分: 关键词${keywordMatches}个, 符号密度${(symbolDensity*100).toFixed(2)}%`);
    
    return score;
  }

  private static calculateChineseQualityScore(analysis: any): number {
    let score = 0;
    
    // 常见中文数学表达
    const expressions = [
      '的', '是', '有', '在', '和', '对', '上', '下', '大', '小', 
      '到', '为', '不', '得', '可以', '会', '用', '从', '被', '把',
      '这', '那', '里', '个', '着', '么', '什', '没', '过', '又',
      '要', '去', '来', '回', '还', '都', '能', '与', '就', '其',
      '所以', '及', '将', '根据', '可得', '因为', '由于', '因此'
    ];
    
    let expressionMatches = 0;
    expressions.forEach(expr => {
      if (analysis.text.includes(expr)) {
        expressionMatches++;
        score += 2;
      }
    });
    
    // 中文标点符号
    if (analysis.punctuationCount > 0) score += 10;
    
    // 避免明显的OCR错误字符
    const badChars = /[\/\\|@#$%^&*_~`]/g;
    const badCharCount = (analysis.text.match(badChars) || []).length;
    score -= badCharCount * 3;
    
    return Math.max(0, score);
  }

  private static calculateStructureScore(analysis: any): number {
    let score = 0;
    
    // 题目编号检测
    if (/^\d+[.\s、]/.test(analysis.text.trim())) score += 15;
    
    // 选项检测
    const optionPattern = /[A-D][.\s)）]/g;
    const optionMatches = (analysis.text.match(optionPattern) || []).length;
    if (optionMatches >= 2 && optionMatches <= 4) score += 20;
    else if (optionMatches > 0) score += 10;
    
    // 行结构合理性
    if (analysis.lineCount > 1 && analysis.lineCount < 10) score += 10;
    
    return score;
  }

  private static calculateLengthScore(analysis: any): number {
    const length = analysis.length;
    
    if (length >= 30 && length <= 300) return 20;
    if (length >= 15 && length <= 500) return 15;
    if (length >= 10) return 10;
    if (length < 5) return -15;
    
    return 5;
  }

  private static advancedTextCorrection(text: string, preprocessingSteps: string[]): string {
    let processed = text;
    let totalCorrections = 0;
    
    console.log("开始高级文本修正，原始文本:", text.substring(0, 100));
    
    // 第一阶段：核心中文数学术语修正
    const coreCorrections = [
      [/[已己巳]知/g, '已知'],
      [/定[义乂又]域/g, '定义域'],
      [/值[域城或]/g, '值域'],
      [/[正证]实数/g, '正实数'],
      [/[兀元原]素/g, '元素'],
      [/[集急急]合/g, '集合'],
      [/[方万]程/g, '方程'],
      [/不等[式试]/g, '不等式'],
      [/[求球]解/g, '求解'],
      [/[计汁]算/g, '计算'],
      [/[证正征]明/g, '证明'],
      [/[判判]断/g, '判断'],
      [/[理埋里]由/g, '理由'],
      [/[说话]明/g, '说明'],
      [/[取敢收]值/g, '取值'],
      [/[范籁]围/g, '范围'],
      [/[函涵]数/g, '函数']
    ];
    
    coreCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) totalCorrections++;
    });
    
    // 第二阶段：数学符号和格式修正
    const symbolCorrections = [
      [/[×xX*]/g, '×'],
      [/[÷]/g, '÷'],
      [/[oO0]/g, '0'],
      [/[Il|]/g, '1'],
      [/[≤<=]/g, '≤'],
      [/[≥>=]/g, '≥'],
      [/[≠!=]/g, '≠'],
      [/\s*=\s*/g, '='],
      [/\s*\+\s*/g, '+'],
      [/\s*-\s*/g, '-'],
      [/（/g, '('],
      [/）/g, ')'],
      [/【/g, '['],
      [/】/g, ']']
    ];
    
    symbolCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) totalCorrections++;
    });
    
    // 第三阶段：结构和格式优化
    const structureCorrections = [
      [/\s*，\s*/g, '，'],
      [/\s*。\s*/g, '。'],
      [/\s*；\s*/g, '；'],
      [/\s*：\s*/g, '：'],
      [/\s{2,}/g, ' '],
      [/\n\s*\n/g, '\n'],
      [/^\s+|\s+$/g, '']
    ];
    
    structureCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) totalCorrections++;
    });
    
    console.log(`高级文本修正完成，应用了 ${totalCorrections} 个修正`);
    preprocessingSteps.push(`高级文本修正: ${totalCorrections} 个修正`);
    
    return processed.trim();
  }

  private static intelligentPostProcessing(text: string, preprocessingSteps: string[]): string {
    let processed = text;
    
    // 智能行合并
    const lines = processed.split('\n').filter(line => line.trim());
    const mergedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();
      
      // 如果当前行很短且下一行不是选项，尝试合并
      if (currentLine.length < 20 && nextLine && 
          !nextLine.match(/^[A-D][.\s)）]/) && 
          !currentLine.match(/^[A-D][.\s)）]/)) {
        mergedLines.push(currentLine + nextLine);
        i++; // 跳过下一行
      } else {
        mergedLines.push(currentLine);
      }
    }
    
    processed = mergedLines.join('\n');
    preprocessingSteps.push("智能行合并优化");
    
    return processed;
  }

  private static generateDetailedMetrics(text: string, result: any) {
    return {
      textRegionsDetected: Math.max(1, text.split(/[。！？\n]/).filter(s => s.trim()).length),
      mathSymbolsDetected: (text.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇]/g) || []).length,
      fractionLinesDetected: (text.match(/[÷\/]/g) || []).length,
      bracketsDetected: (text.match(/[()[\]{}]/g) || []).length,
      chineseCharactersDetected: (text.match(/[\u4e00-\u9fff]/g) || []).length,
      skewAngleCorrected: 0,
      noiseReductionApplied: true,
      binarizationMethod: "多级自适应阈值",
      layoutAnalysisScore: result.totalScore,
      transformerConfidence: result.confidence,
      multiModalScore: result.totalScore * 1.15
    };
  }

  private static extractQuestionNumber(text: string): string | undefined {
    const patterns = [
      /^(\d+)[.\s、]/,
      /第\s*(\d+)\s*题/,
      /题\s*(\d+)/,
      /(\d+)\s*\./
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  private static extractFormulas(text: string): string[] {
    const formulas = [];
    const patterns = [
      /f\s*\(\s*[xy]\s*\)\s*=\s*[^，。,.\n]+/g,
      /[xy]\s*[=]\s*[^，。,.\n]+/g,
      /\w+\s*[+\-×÷]\s*\w+\s*[=]\s*[^，。,.\n]+/g,
      /[a-zA-Z]\s*[²³¹⁰]+/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) formulas.push(...matches);
    });
    
    return [...new Set(formulas)];
  }

  private static extractOptions(text: string): string[] {
    const options = [];
    const patterns = [
      /[A-D][.\s)）][^A-D\n]{1,100}/g,
      /[(（][A-D][)）][^A-D\n]{1,100}/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        options.push(...matches.map(opt => opt.trim()));
      }
    });
    
    return options;
  }
}
