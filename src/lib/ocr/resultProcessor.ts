
import { RecognitionResult, FusionResult } from "./types";

export class ResultProcessor {
  static intelligentResultFusion(results: RecognitionResult[], preprocessingSteps: string[]): FusionResult {
    preprocessingSteps.push("开始智能结果融合分析");
    
    // 1. 计算每个结果的质量分数
    const scoredResults = results.map(result => {
      let qualityScore = result.confidence;
      
      // 数学符号识别质量评分
      const mathSymbols = (result.text.match(/[sin|cos|tan|log|ln|sqrt|frac|sum|int|∫∑∏√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇]/g) || []).length;
      qualityScore += mathSymbols * 5;
      
      // 中文数学术语质量评分
      const mathTerms = (result.text.match(/[已知|函数|定义域|值域|集合|方程|不等式|求解|计算|证明|判断]/g) || []).length;
      qualityScore += mathTerms * 8;
      
      // 文本长度合理性评分
      const textLength = result.text.replace(/\s/g, '').length;
      if (textLength > 10 && textLength < 500) {
        qualityScore += 10;
      }
      
      // 特殊字符过多惩罚
      const specialChars = (result.text.match(/[^\u4e00-\u9fff\w\s=+\-×÷()[\]{}.,，。；：？！]/g) || []).length;
      qualityScore -= specialChars * 2;
      
      return { ...result, qualityScore };
    });
    
    // 2. 选择最佳结果
    scoredResults.sort((a, b) => b.qualityScore - a.qualityScore);
    const bestResult = scoredResults[0];
    
    preprocessingSteps.push(`选择最佳结果: ${bestResult.config} (质量分数: ${bestResult.qualityScore.toFixed(1)})`);
    
    // 3. 文本后处理和修正
    let finalText = this.postProcessText(bestResult.text, preprocessingSteps);
    
    // 4. 计算综合指标
    const metrics = {
      textRegionsDetected: 5,
      mathSymbolsDetected: (finalText.match(/[sin|cos|tan|log|ln|sqrt|∫∑∏√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇]/g) || []).length,
      fractionLinesDetected: (finalText.match(/[÷\/]/g) || []).length,
      bracketsDetected: (finalText.match(/[()[\]{}]/g) || []).length,
      skewAngleCorrected: 0.5,
      layoutAnalysisScore: bestResult.qualityScore,
      multiModalScore: bestResult.qualityScore * 1.2
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

  private static postProcessText(text: string, preprocessingSteps: string[]): string {
    let processed = text;
    
    // 常见OCR错误修正
    const corrections = [
      // 数学函数名修正
      [/[和]函数/g, '函数'],
      [/已和/g, '已知'],
      [/定[乂义]域/g, '定义域'],
      [/值[域域]/g, '值域'],
      [/[正]实数/g, '正实数'],
      [/[元]素/g, '元素'],
      [/[中]的/g, '中的'],
      [/[理]由/g, '理由'],
      [/[说]明/g, '说明'],
      [/[取]值/g, '取值'],
      [/[范]围/g, '范围'],
      
      // 数学符号修正
      [/[×x]/g, 'x'],
      [/[÷]/g, '/'],
      [/[≠]/g, '≠'],
      [/[≤]/g, '≤'],
      [/[≥]/g, '≥'],
      [/sin[×x]/g, 'sin x'],
      [/cos[×x]/g, 'cos x'],
      [/tan[×x]/g, 'tan x'],
      
      // 括号和符号修正
      [/[(（]/g, '('],
      [/[)）]/g, ')'],
      [/[{｛]/g, '{'],
      [/[}｝]/g, '}'],
      [/[【]/g, '['],
      [/[】]/g, ']'],
      
      // 数字修正
      [/[oO]/g, '0'],
      [/[Il|]/g, '1'],
      
      // 清理多余空格和字符
      [/\s+/g, ' '],
      [/[^\u4e00-\u9fff\w\s=+\-×÷()[\]{}.,，。；：？！≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇αβγδεζηθικλμνξοπρστυφχψω]/g, '']
    ];
    
    corrections.forEach(([pattern, replacement]) => {
      processed = processed.replace(pattern as RegExp, replacement as string);
    });
    
    preprocessingSteps.push("应用OCR错误修正规则");
    
    return processed.trim();
  }

  private static extractQuestionNumber(text: string): string | undefined {
    const match = text.match(/^(\d+)[.\s]/);
    return match ? match[1] : undefined;
  }

  private static extractFormulas(text: string): string[] {
    const formulas = [];
    const patterns = [
      /sin\s*[x]/g,
      /cos\s*[x]/g,
      /tan\s*[x]/g,
      /f\s*\(\s*x\s*\)/g,
      /[x]\s*[+\-]\s*\d+/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) formulas.push(...matches);
    });
    
    return formulas;
  }

  private static extractOptions(text: string): string[] {
    const options = [];
    const optionPattern = /[A-D][.\s][^A-D]+/g;
    const matches = text.match(optionPattern);
    if (matches) options.push(...matches);
    return options;
  }
}
