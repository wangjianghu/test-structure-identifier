
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, FileText, BookOpen, HelpCircle, Calculator } from "lucide-react";
import { ParsedQuestion } from "@/lib/parser";
import { toast } from "sonner";

interface AnalysisResultProps {
  result: ParsedQuestion;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制${label}到剪贴板`);
  };

  const copyAllResults = () => {
    let fullText = `学科: ${result.subject}\n题型: ${result.questionType}\n`;
    
    if (result.hasFormulas) {
      fullText += `公式类型: ${result.formulaType || '未知'}\n`;
    }
    
    if (result.parentQuestion) {
      fullText += `\n父题题号: ${result.parentQuestion.number}\n`;
      fullText += `父题题干: ${result.parentQuestion.body}\n`;
      
      if (result.subQuestions) {
        fullText += `\n子题:\n`;
        result.subQuestions.forEach((subQ, index) => {
          fullText += `  (${subQ.number}) ${subQ.body}\n`;
          if (subQ.options) {
            subQ.options.forEach(option => {
              fullText += `    ${option.key}. ${option.value}\n`;
            });
          }
        });
      }
    } else {
      if (result.questionNumber) {
        fullText += `题号: ${result.questionNumber}\n`;
      }
      fullText += `题干: ${result.body}\n`;
      
      if (result.options) {
        fullText += `选项:\n`;
        result.options.forEach(option => {
          fullText += `${option.key}. ${option.value}\n`;
        });
      }
    }
    
    copyToClipboard(fullText, "完整分析结果");
  };

  const copyParentInfo = () => {
    if (result.parentQuestion) {
      const parentText = `父题题号: ${result.parentQuestion.number || ''}\n父题题干: ${result.parentQuestion.body}`;
      copyToClipboard(parentText, "父题信息");
    }
  };

  const copySubQuestionInfo = (subQ: any) => {
    const subText = `子题题号: (${subQ.number})\n子题题干: ${subQ.body}`;
    copyToClipboard(subText, "子题信息");
  };

  const copyAllOptions = (options: any[]) => {
    const optionsText = options.map(option => `${option.key}. ${option.value}`).join('\n');
    copyToClipboard(optionsText, "全部选项");
  };

  const copyQuestionInfo = () => {
    const questionText = `${result.questionNumber ? `题号: ${result.questionNumber}\n` : ''}题干: ${result.body}`;
    copyToClipboard(questionText, "题目信息");
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
              <FileText className="h-5 w-5" />
              题目结构分析
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {result.subject}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                {result.questionType}
              </Badge>
              {result.hasFormulas && (
                <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200">
                  <Calculator className="h-3 w-3" />
                  {result.formulaType === 'latex' ? 'LaTeX公式' : 
                   result.formulaType === 'mathtype' ? 'MathType公式' : 
                   result.formulaType === 'mixed' ? '混合公式' : '数学公式'}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyAllResults}
            className="flex items-center gap-1 text-xs"
          >
            <Copy className="h-3 w-3" />
            复制全部
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 复合题结构 */}
        {result.parentQuestion ? (
          <div className="space-y-4">
            {/* 父题 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground">父题信息</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyParentInfo}
                  className="flex items-center gap-1 text-xs h-7"
                >
                  <Copy className="h-3 w-3" />
                  复制父题信息
                </Button>
              </div>
              
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {result.parentQuestion.number && (
                  <div>
                    <span className="text-sm font-medium">父题题号:</span>
                    <span className="ml-2 text-sm">{result.parentQuestion.number}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium">父题题干:</span>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{result.parentQuestion.body}</p>
                </div>
              </div>
            </div>

            {/* 子题 */}
            {result.subQuestions && result.subQuestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground">子题信息</h4>
                </div>
                
                {result.subQuestions.map((subQ, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">子题 {index + 1}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copySubQuestionInfo(subQ)}
                        className="flex items-center gap-1 text-xs h-7"
                      >
                        <Copy className="h-3 w-3" />
                        复制子题信息
                      </Button>
                    </div>
                    
                    <div className="space-y-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div>
                        <span className="text-sm font-medium">子题题号:</span>
                        <span className="ml-2 text-sm">({subQ.number})</span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">子题题干:</span>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{subQ.body}</p>
                      </div>
                    </div>
                    
                    {subQ.options && subQ.options.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">选项:</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyAllOptions(subQ.options)}
                            className="flex items-center gap-1 text-xs h-7"
                          >
                            <Copy className="h-3 w-3" />
                            复制全部选项
                          </Button>
                        </div>
                        <div className="space-y-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          {subQ.options.map((option: any, optIndex: number) => (
                            <div key={optIndex} className="text-sm">
                              {option.key}. {option.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 普通题目结构 */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">题目信息</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={copyQuestionInfo}
                className="flex items-center gap-1 text-xs h-7"
              >
                <Copy className="h-3 w-3" />
                复制题目信息
              </Button>
            </div>
            
            <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {result.questionNumber && (
                <div>
                  <span className="text-sm font-medium">题号:</span>
                  <span className="ml-2 text-sm">{result.questionNumber}</span>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium">题干:</span>
                <p className="mt-1 text-sm whitespace-pre-wrap">{result.body}</p>
              </div>
            </div>
            
            {result.options && result.options.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">选项:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyAllOptions(result.options!)}
                    className="flex items-center gap-1 text-xs h-7"
                  >
                    <Copy className="h-3 w-3" />
                    复制全部选项
                  </Button>
                </div>
                <div className="space-y-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  {result.options.map((option, index) => (
                    <div key={index} className="text-sm">
                      {option.key}. {option.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
