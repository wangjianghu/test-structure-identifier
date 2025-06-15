
import { RecognitionResult, FusionResult } from "./types";

export class ResultProcessor {
  static intelligentResultFusion(results: RecognitionResult[], preprocessingSteps: string[]): FusionResult {
    console.log("=== 启动智能结果融合系统 ===");
    
    if (results.length === 0) {
      throw new Error("没有可用的识别结果");
    }
    
    // 深度分析每个识别结果
    const analyzedResults = results.map(result => this.analyzeResult(result));
    
    // 综合评分系统
    const scoredResults = analyzedResults.map(analysis => {
      const scores = {
        confidenceScore: analysis.confidence * 0.3,
        lengthScore: this.calculateLengthScore(analysis.text),
        chineseScore: this.calculateChineseScore(analysis.text),
        mathScore: this.calculateMathScore(analysis.text),
        structureScore: this.calculateStructureScore(analysis.text),
        qualityScore: this.calculateQualityScore(analysis.text)
      };
      
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      
      console.log(`${analysis.config} 评分详情:`, {
        ...scores,
        总分: totalScore.toFixed(1),
        文本: analysis.text.substring(0, 50)
      });
      
      return { ...analysis, totalScore, scores };
    });
    
    // 选择最佳结果
    scoredResults.sort((a, b) => b.totalScore - a.totalScore);
    const bestResult = scoredResults[0];
    
    console.log(`选择最佳结果: ${bestResult.config}`, {
      总分: bestResult.totalScore.toFixed(1),
      置信度: bestResult.confidence.toFixed(1)
    });
    
    // 智能文本修正
    const correctedText = this.smartTextCorrection(bestResult.text, preprocessingSteps);
    
    // 最终清理
    const finalText = this.finalCleanup(correctedText, preprocessingSteps);
    
    // 计算最终置信度
    const finalConfidence = Math.min(95, bestResult.totalScore * 1.1);
    
    // 生成指标
    const metrics = this.generateMetrics(finalText, bestResult);
    
    preprocessingSteps.push(`最优引擎: ${bestResult.config} (评分: ${bestResult.totalScore.toFixed(1)})`);
    
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

  private static analyzeResult(result: RecognitionResult) {
    return {
      ...result,
      length: result.text.length,
      chineseCount: (result.text.match(/[\u4e00-\u9fff]/g) || []).length,
      mathSymbolCount: (result.text.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±]/g) || []).length,
      numberCount: (result.text.match(/\d/g) || []).length
    };
  }

  private static calculateLengthScore(text: string): number {
    const length = text.length;
    if (length >= 20 && length <= 200) return 25;
    if (length >= 10 && length <= 300) return 15;
    if (length < 5) return -10;
    return 10;
  }

  private static calculateChineseScore(text: string): number {
    let score = 0;
    
    // 数学关键词
    const mathKeywords = [
      '已知', '函数', '定义域', '值域', '求解', '计算', '证明', 
      '判断', '分析', '讨论', '设', '若', '对于', '正实数'
    ];
    
    mathKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 8;
    });
    
    // 中文字符比例
    const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const chineseRatio = chineseCount / Math.max(1, text.length);
    if (chineseRatio > 0.2 && chineseRatio < 0.7) score += 15;
    
    return score;
  }

  private static calculateMathScore(text: string): number {
    let score = 0;
    
    // 数学符号
    const mathSymbols = (text.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±]/g) || []).length;
    if (mathSymbols > 0) score += Math.min(20, mathSymbols * 2);
    
    // 函数表达式
    if (/f\s*\([^)]+\)/.test(text)) score += 10;
    if (/[xy]\s*[=<>≤≥]/.test(text)) score += 10;
    
    return score;
  }

  private static calculateStructureScore(text: string): number {
    let score = 0;
    
    // 题目编号
    if (/^\d+[.\s、]/.test(text.trim())) score += 15;
    
    // 选项检测
    const options = (text.match(/[A-D][.\s)）]/g) || []).length;
    if (options >= 2 && options <= 4) score += 15;
    
    return score;
  }

  private static calculateQualityScore(text: string): number {
    let score = 20; // 基础分
    
    // 减分项：明显的OCR错误
    const badPatterns = [
      /[\/\\|@#$%^&*_~`]{2,}/g,  // 连续特殊字符
      /\d[A-Za-z]{3,}/g,         // 数字后跟长字母串
      /[a-z]{5,}/g               // 过长的小写字母串
    ];
    
    badPatterns.forEach(pattern => {
      const matches = (text.match(pattern) || []).length;
      score -= matches * 3;
    });
    
    return Math.max(0, score);
  }

  private static smartTextCorrection(text: string, preprocessingSteps: string[]): string {
    let processed = text;
    let corrections = 0;
    
    console.log("开始智能文本修正，原文:", text.substring(0, 80));
    
    // 核心术语修正
    const coreCorrections = [
      [/[已己巳]知/g, '已知'],
      [/[函涵]数/g, '函数'],
      [/定[义乂又]域/g, '定义域'],
      [/值[域城或]/g, '值域'],
      [/[正证]实数/g, '正实数'],
      [/[求球]解/g, '求解'],
      [/[计汁]算/g, '计算'],
      [/[证正征]明/g, '证明'],
      [/[判判]断/g, '判断'],
      [/[分析][析]/g, '分析'],
      [/[讨论][论]/g, '讨论']
    ];
    
    coreCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) corrections++;
    });
    
    // 数学符号修正
    const symbolCorrections = [
      [/[×xX*]/g, '×'],
      [/[÷]/g, '÷'],
      [/（/g, '('],
      [/）/g, ')'],
      [/\s*=\s*/g, '='],
      [/\s*\+\s*/g, '+'],
      [/\s*-\s*/g, '-']
    ];
    
    symbolCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) corrections++;
    });
    
    // 常见OCR错误修正
    const ocrCorrections = [
      [/[oO0]/g, '0'],
      [/[Il|]/g, '1'],
      [/[rn]/g, 'n'],
      [/[()]/g, (match: string) => match], // 保持括号不变
      [/\s{2,}/g, ' '],
      [/^\s+|\s+$/g, '']
    ];
    
    ocrCorrections.forEach(([pattern, replacement]) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) corrections++;
    });
    
    console.log(`智能修正完成，应用了 ${corrections} 个修正`);
    preprocessingSteps.push(`智能文本修正: ${corrections} 处修正`);
    
    return processed.trim();
  }

  private static finalCleanup(text: string, preprocessingSteps: string[]): string {
    let processed = text;
    
    // 最终清理
    processed = processed
      .replace(/\s*，\s*/g, '，')
      .replace(/\s*。\s*/g, '。')
      .replace(/\s*；\s*/g, '；')
      .replace(/\s*：\s*/g, '：')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    preprocessingSteps.push("最终格式清理");
    return processed;
  }

  private static generateMetrics(text: string, result: any) {
    return {
      textRegionsDetected: Math.max(1, text.split(/[。！？\n]/).filter(s => s.trim()).length),
      mathSymbolsDetected: (text.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±]/g) || []).length,
      fractionLinesDetected: (text.match(/[÷\/]/g) || []).length,
      bracketsDetected: (text.match(/[()[\]{}]/g) || []).length,
      chineseCharactersDetected: (text.match(/[\u4e00-\u9fff]/g) || []).length,
      skewAngleCorrected: 0,
      noiseReductionApplied: true,
      binarizationMethod: "自适应阈值二值化",
      layoutAnalysisScore: result.totalScore,
      transformerConfidence: result.confidence,
      multiModalScore: result.totalScore * 1.1
    };
  }

  private static extractQuestionNumber(text: string): string | undefined {
    const match = text.match(/^(\d+)[.\s、]/);
    return match ? match[1] : undefined;
  }

  private static extractFormulas(text: string): string[] {
    const formulas = [];
    const patterns = [
      /f\s*\(\s*[xy]\s*\)\s*=\s*[^，。,.\n]+/g,
      /[xy]\s*[=]\s*[^，。,.\n]+/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) formulas.push(...matches);
    });
    
    return [...new Set(formulas)];
  }

  private static extractOptions(text: string): string[] {
    const options = [];
    const matches = text.match(/[A-D][.\s)）][^A-D\n]{1,50}/g);
    if (matches) {
      options.push(...matches.map(opt => opt.trim()));
    }
    return options;
  }
}
