
import { RecognitionResult, FusionResult } from "./types";

export class ResultProcessor {
  static intelligentResultFusion(results: RecognitionResult[], preprocessingSteps: string[]): FusionResult {
    console.log("=== 开始智能结果融合分析 ===");
    
    // 详细分析每个结果
    const scoredResults = results.map(result => {
      let score = result.confidence * 0.6; // 基础置信度权重降低
      
      console.log(`分析 ${result.config} 结果:`, {
        原始文本: result.text.substring(0, 50),
        原始置信度: result.confidence,
        文本长度: result.text.length
      });
      
      // 中文数学关键词检测（精确匹配）
      const mathKeywords = ['已知', '函数', '定义域', '值域', '集合', '方程', '不等式', '求解', '计算', '证明', '判断', '若', '设'];
      let keywordCount = 0;
      mathKeywords.forEach(keyword => {
        if (result.text.includes(keyword)) {
          keywordCount++;
          score += 20; // 大幅加分
        }
      });
      
      // 数学符号检测
      const mathSymbols = ['=', '+', '-', '×', '÷', '(', ')', '[', ']', '≤', '≥', '≠', '∞', '∑', '∫', '√'];
      let symbolCount = 0;
      mathSymbols.forEach(symbol => {
        const matches = (result.text.match(new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        symbolCount += matches;
        score += matches * 3;
      });
      
      // 数字和字母模式
      const numberPattern = /\d+/g;
      const letterPattern = /[a-zA-Z]+/g;
      const numberMatches = (result.text.match(numberPattern) || []).length;
      const letterMatches = (result.text.match(letterPattern) || []).length;
      score += (numberMatches + letterMatches) * 2;
      
      // 惩罚明显的乱码字符
      const badChars = /[\/\\|@#$%^&*_~`]/g;
      const badCharCount = (result.text.match(badChars) || []).length;
      score -= badCharCount * 5;
      
      // 文本长度合理性
      if (result.text.length > 15 && result.text.length < 200) {
        score += 15;
      } else if (result.text.length < 5) {
        score -= 20; // 太短的文本可能不完整
      }
      
      console.log(`${result.config} 评分详情:`, {
        基础分: (result.confidence * 0.6).toFixed(1),
        关键词加分: keywordCount * 20,
        符号加分: symbolCount * 3,
        数字字母加分: (numberMatches + letterMatches) * 2,
        乱码扣分: -badCharCount * 5,
        长度加分: (result.text.length > 15 && result.text.length < 200) ? 15 : 0,
        最终得分: score.toFixed(1)
      });
      
      return { ...result, qualityScore: score };
    });
    
    // 选择得分最高的结果
    scoredResults.sort((a, b) => b.qualityScore - a.qualityScore);
    const bestResult = scoredResults[0];
    
    console.log(`选择最佳结果: ${bestResult.config}`, {
      得分: bestResult.qualityScore.toFixed(1),
      置信度: bestResult.confidence.toFixed(1),
      文本: bestResult.text.substring(0, 100)
    });
    
    preprocessingSteps.push(`智能选择: ${bestResult.config} (得分: ${bestResult.qualityScore.toFixed(1)})`);
    
    // 高精度文本修正
    let finalText = this.preciseTextCorrection(bestResult.text, preprocessingSteps);
    
    // 计算最终指标
    const metrics = {
      textRegionsDetected: Math.max(1, finalText.split(/[。！？\n]/).filter(s => s.trim()).length),
      mathSymbolsDetected: (finalText.match(/[=+\-×÷()[\]{}≤≥≠∞∑∫√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∂∆∇]/g) || []).length,
      fractionLinesDetected: (finalText.match(/[÷\/]/g) || []).length,
      bracketsDetected: (finalText.match(/[()[\]{}]/g) || []).length,
      skewAngleCorrected: 0,
      layoutAnalysisScore: bestResult.qualityScore,
      multiModalScore: bestResult.qualityScore * 1.1
    };
    
    console.log("最终处理结果:", {
      原始文本: bestResult.text,
      修正后文本: finalText,
      最终置信度: Math.min(95, bestResult.qualityScore),
      检测指标: metrics
    });
    
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
    
    console.log("开始文本修正，原始文本:", text);
    
    // 关键修正规则（按优先级排序）
    const corrections_rules = [
      // 核心中文数学术语
      [/已和/g, '已知'],
      [/己知/g, '已知'],
      [/[定疋]乂域/g, '定义域'],
      [/定[义乂]域/g, '定义域'],
      [/值[域城]/g, '值域'],
      [/正[实史]数/g, '正实数'],
      [/[兀元]素/g, '元素'],
      [/[中众]/g, '中'],
      [/[理埋里]由/g, '理由'],
      [/[说话]明/g, '说明'],
      [/[取敢]值/g, '取值'],
      [/[范籁]围/g, '范围'],
      
      // 常见OCR错误修正
      [/[oO]/g, '0'],
      [/[Il|]/g, '1'],
      [/[)(]/g, ')'],
      [/[)(]/g, '('],
      [/[}]/g, '}'],
      [/[{]/g, '{'],
      [/[×xX*]/g, '×'],
      [/[÷]/g, '÷'],
      
      // 清理明显的乱码
      [/[\/\\|@#$%^&*_~`]/g, ''],
      [/\s+/g, ' '], // 合并多余空格
      [/^\s+|\s+$/g, ''] // 去除首尾空格
    ];
    
    corrections_rules.forEach(([pattern, replacement], index) => {
      const before = processed;
      processed = processed.replace(pattern as RegExp, replacement as string);
      if (before !== processed) {
        corrections++;
        console.log(`修正规则 ${index + 1}:`, {
          规则: pattern.toString(),
          前: before.substring(0, 50),
          后: processed.substring(0, 50)
        });
      }
    });
    
    console.log(`应用了 ${corrections} 个修正规则，最终文本:`, processed);
    preprocessingSteps.push(`文本修正: 应用 ${corrections} 个规则`);
    
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
      /\w+\s*[+\-×÷]\s*\w+/g
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
