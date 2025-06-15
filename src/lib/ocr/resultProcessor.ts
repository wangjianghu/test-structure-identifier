
import { RecognitionResult, FusionResult } from "./types";

export class ResultProcessor {
  static intelligentResultFusion(results: RecognitionResult[], preprocessingSteps: string[]): FusionResult {
    preprocessingSteps.push("开始智能结果分析与选择");
    
    console.log("所有识别结果:", results.map(r => ({
      config: r.config,
      confidence: r.confidence,
      textLength: r.text.length,
      preview: r.text.substring(0, 100)
    })));
    
    // 1. 为每个结果计算综合质量分数
    const scoredResults = results.map(result => {
      let qualityScore = result.confidence;
      
      // 中文数学关键词加分
      const mathKeywords = ['已知', '函数', '定义域', '值域', '集合', '方程', '不等式', '求解', '计算', '证明', '判断'];
      const keywordMatches = mathKeywords.filter(keyword => result.text.includes(keyword)).length;
      qualityScore += keywordMatches * 15;
      
      // 常见数学符号加分
      const mathSymbols = (result.text.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰]/g) || []).length;
      qualityScore += mathSymbols * 2;
      
      // 连续数字和字母的合理性
      const validTokens = (result.text.match(/[a-zA-Z0-9\u4e00-\u9fff]+/g) || []).length;
      qualityScore += validTokens * 0.5;
      
      // 异常字符惩罚
      const weirdChars = (result.text.match(/[^\u4e00-\u9fff\w\s=+\-×÷()[\]{}.,，。；：？！≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇]/g) || []).length;
      qualityScore -= weirdChars * 3;
      
      // 文本长度合理性
      if (result.text.length > 20 && result.text.length < 300) {
        qualityScore += 10;
      }
      
      console.log(`${result.config} 质量评分:`, {
        baseConfidence: result.confidence,
        keywordBonus: keywordMatches * 15,
        symbolBonus: mathSymbols * 2,
        tokenBonus: validTokens * 0.5,
        weirdPenalty: -weirdChars * 3,
        lengthBonus: (result.text.length > 20 && result.text.length < 300) ? 10 : 0,
        finalScore: qualityScore
      });
      
      return { ...result, qualityScore };
    });
    
    // 2. 选择最佳结果
    scoredResults.sort((a, b) => b.qualityScore - a.qualityScore);
    const bestResult = scoredResults[0];
    
    console.log(`选择最佳结果: ${bestResult.config} (质量分数: ${bestResult.qualityScore.toFixed(1)})`);
    preprocessingSteps.push(`选择最佳结果: ${bestResult.config} (质量分数: ${bestResult.qualityScore.toFixed(1)})`);
    
    // 3. 精确的文本后处理
    let finalText = this.preciseTextCorrection(bestResult.text, preprocessingSteps);
    
    // 4. 计算最终指标
    const metrics = {
      textRegionsDetected: Math.ceil(finalText.split(/\n|。|！|？/).length),
      mathSymbolsDetected: (finalText.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇]/g) || []).length,
      fractionLinesDetected: (finalText.match(/[÷\/]/g) || []).length,
      bracketsDetected: (finalText.match(/[()[\]{}]/g) || []).length,
      skewAngleCorrected: 0,
      layoutAnalysisScore: bestResult.qualityScore,
      multiModalScore: bestResult.qualityScore * 1.1
    };
    
    return {
      text: finalText,
      confidence: Math.min(95, bestResult.qualityScore),
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

  private static preciseTextCorrection(text: string, preprocessingSteps: string[]): string {
    let processed = text;
    let corrections = 0;
    
    // 核心中文数学术语修正
    const criticalCorrections = [
      [/已和/g, '已知'],
      [/己知/g, '已知'],
      [/定乂域/g, '定义域'],
      [/定[义乂]域/g, '定义域'],
      [/值[域城]/g, '值域'],
      [/正[实史]数/g, '正实数'],
      [/[兀元]素/g, '元素'],
      [/[中众]的/g, '中的'],
      [/[理埋里]由/g, '理由'],
      [/[说话]明/g, '说明'],
      [/[取敢]值/g, '取值'],
      [/[范籁]围/g, '范围'],
      [/[和或]是/g, '或是'],
      [/[朱未]知/g, '未知'],
      
      // 数学函数名修正
      [/sin[×x\s]*([0-9a-zA-Z])/g, 'sin $1'],
      [/cos[×x\s]*([0-9a-zA-Z])/g, 'cos $1'],
      [/tan[×x\s]*([0-9a-zA-Z])/g, 'tan $1'],
      [/log[×x\s]*([0-9a-zA-Z])/g, 'log $1'],
      
      // 常见符号修正
      [/[×xX]/g, '×'],
      [/[÷]/g, '÷'],
      [/[(（]/g, '('],
      [/[)）]/g, ')'],
      [/[【[]/g, '['],
      [/[】]]/g, ']'],
      [/[{｛]/g, '{'],
      [/[}｝]/g, '}'],
      
      // 数字修正
      [/[oO]/g, '0'],
      [/[Il|]/g, '1'],
      
      // 清理乱码和多余字符
      [/[^\u4e00-\u9fff\w\s=+\-×÷()[\]{}.,，。；：？！≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇]/g, ''],
      [/\s+/g, ' '] // 合并多个空格
    ];
    
    criticalCorrections.forEach(([pattern, replacement], index) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) {
        corrections++;
        console.log(`修正规则 ${index + 1}: "${before.substring(0, 50)}" -> "${processed.substring(0, 50)}"`);
      }
    });
    
    preprocessingSteps.push(`应用 ${corrections} 个文本修正规则`);
    
    return processed.trim();
  }

  private static extractQuestionNumber(text: string): string | undefined {
    const patterns = [
      /^(\d+)[.\s、]/,
      /第\s*(\d+)\s*题/,
      /题\s*(\d+)/
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
      /f\s*\(\s*[x]\s*\)\s*=\s*[^，。,.\n]+/g,
      /[xy]\s*[=]\s*[^，。,.\n]+/g,
      /\w+\s*[+\-×÷]\s*\w+/g,
      /sin|cos|tan|log|ln/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) formulas.push(...matches);
    });
    
    return [...new Set(formulas)]; // 去重
  }

  private static extractOptions(text: string): string[] {
    const options = [];
    const patterns = [
      /[A-D][.\s)）][^A-D\n]{1,50}/g,
      /[(（][A-D][)）][^A-D\n]{1,50}/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) options.push(...matches.map(opt => opt.trim()));
    });
    
    return options;
  }
}
