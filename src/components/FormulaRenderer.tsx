
import React from 'react';

interface FormulaRendererProps {
  content: string;
  className?: string;
}

export function FormulaRenderer({ content, className = "" }: FormulaRendererProps) {
  // Function to convert LaTeX and MathType formulas to readable format
  const renderFormulas = (text: string): string => {
    let processedText = text;

    // Convert LaTeX inline formulas \( ... \) to readable format
    processedText = processedText.replace(/\\\((.*?)\\\)/g, (_, formula) => {
      return convertLatexToReadable(formula);
    });

    // Convert LaTeX block formulas \[ ... \] to readable format
    processedText = processedText.replace(/\\\[(.*?)\\\]/g, (_, formula) => {
      return convertLatexToReadable(formula);
    });

    // Convert dollar sign formulas $ ... $ to readable format
    processedText = processedText.replace(/\$([^$]+)\$/g, (_, formula) => {
      return convertLatexToReadable(formula);
    });

    // Convert double dollar sign formulas $$ ... $$ to readable format
    processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (_, formula) => {
      return convertLatexToReadable(formula);
    });

    return processedText;
  };

  const convertLatexToReadable = (latex: string): string => {
    let readable = latex.trim();

    // Convert common LaTeX commands to readable format
    const conversions = [
      // Fractions
      [/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)'],
      
      // Superscripts
      [/\^(\d+)/g, '的$1次方'],
      [/\^{([^}]+)}/g, '的($1)次方'],
      
      // Subscripts
      [/_(\d+)/g, '下标$1'],
      [/_{([^}]+)}/g, '下标($1)'],
      
      // Square roots
      [/\\sqrt\{([^}]+)\}/g, '√($1)'],
      [/\\sqrt\[(\d+)\]\{([^}]+)\}/g, '$1次根号($2)'],
      
      // Greek letters
      [/\\alpha/g, 'α'],
      [/\\beta/g, 'β'],
      [/\\gamma/g, 'γ'],
      [/\\delta/g, 'δ'],
      [/\\epsilon/g, 'ε'],
      [/\\theta/g, 'θ'],
      [/\\lambda/g, 'λ'],
      [/\\mu/g, 'μ'],
      [/\\pi/g, 'π'],
      [/\\sigma/g, 'σ'],
      [/\\phi/g, 'φ'],
      [/\\omega/g, 'ω'],
      
      // Mathematical operators
      [/\\cdot/g, '·'],
      [/\\times/g, '×'],
      [/\\div/g, '÷'],
      [/\\pm/g, '±'],
      [/\\mp/g, '∓'],
      
      // Inequalities
      [/\\leq/g, '≤'],
      [/\\geq/g, '≥'],
      [/\\neq/g, '≠'],
      [/\\approx/g, '≈'],
      
      // Set theory
      [/\\in/g, '∈'],
      [/\\notin/g, '∉'],
      [/\\subset/g, '⊂'],
      [/\\supset/g, '⊃'],
      [/\\cap/g, '∩'],
      [/\\cup/g, '∪'],
      [/\\emptyset/g, '∅'],
      
      // Calculus
      [/\\int/g, '∫'],
      [/\\sum/g, '∑'],
      [/\\prod/g, '∏'],
      [/\\lim/g, 'lim'],
      [/\\partial/g, '∂'],
      [/\\infty/g, '∞'],
      
      // Functions
      [/\\sin/g, 'sin'],
      [/\\cos/g, 'cos'],
      [/\\tan/g, 'tan'],
      [/\\log/g, 'log'],
      [/\\ln/g, 'ln'],
      [/\\exp/g, 'exp'],
      
      // Brackets
      [/\\left\(/g, '('],
      [/\\right\)/g, ')'],
      [/\\left\[/g, '['],
      [/\\right\]/g, ']'],
      [/\\left\{/g, '{'],
      [/\\right\}/g, '}'],
      
      // Cases environment - 优化处理
      [/\\begin\{cases\}(.*?)\\end\{cases\}/gs, (match, content) => {
        const cases = content.split('\\\\').map((line: string) => {
          const parts = line.split('&');
          return parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : line.trim();
        }).filter((line: string) => line);
        return `{ ${cases.join('; ')} }`;
      }],
      
      // Remove remaining LaTeX commands
      [/\\[a-zA-Z]+\{([^}]*)\}/g, '$1'],
      [/\\[a-zA-Z]+/g, ''],
      [/\{([^}]*)\}/g, '$1'],
    ];

    // Apply all conversions
    conversions.forEach(([pattern, replacement]) => {
      readable = readable.replace(pattern as RegExp, replacement as string);
    });

    // Clean up extra spaces
    readable = readable.replace(/\s+/g, ' ').trim();

    return readable;
  };

  const processedContent = renderFormulas(content);

  // 检查是否包含数学符号，如果是则使用特殊样式
  const hasMathSymbols = /[∫∑∏√²³¹⁰±∩∪∈∉⊂⊃∅∠∴∵∝∂∆∇αβγδεθλμπσφω≤≥≠≈×÷·]/.test(processedContent);

  return (
    <span className={`formula-content ${className} ${hasMathSymbols ? 'font-mono text-blue-700' : ''}`}>
      {processedContent}
    </span>
  );
}
