
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ParsedQuestion } from "@/lib/parser";
import { ListChecks, Hash, Type, Book, Copy } from "lucide-react";
import { toast } from "sonner";

interface AnalysisResultProps {
  result: ParsedQuestion;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`已复制${description}到剪贴板`);
    } catch (err) {
      toast.error("复制失败，请手动复制");
    }
  };

  const copyQuestionBody = () => {
    const text = result.questionNumber 
      ? `${result.questionNumber}. ${result.body}` 
      : result.body;
    copyToClipboard(text, "题干");
  };

  const copyOptions = () => {
    if (!result.options) return;
    const text = result.options
      .map(option => `${option.key}. ${option.value}`)
      .join('\n');
    copyToClipboard(text, "选项");
  };

  const copyAll = () => {
    let text = '';
    
    // 题干
    if (result.questionNumber) {
      text += `题号: ${result.questionNumber}\n`;
    }
    text += `学科: ${result.subject}\n`;
    text += `题型: ${result.questionType}\n`;
    text += `题干: ${result.body}\n`;
    
    // 选项
    if (result.options && result.options.length > 0) {
      text += `选项:\n`;
      result.options.forEach(option => {
        text += `${option.key}. ${option.value}\n`;
      });
    }
    
    copyToClipboard(text, "全部内容");
  };

  return (
    <Card className="w-full max-w-2xl animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <span>分析结果</span>
            <div className="flex items-center gap-2">
              {result.subject && result.subject !== '未知' && (
                <Badge variant="outline" className="text-xs">
                  <Book className="mr-1 h-3 w-3" /> {result.subject}
                </Badge>
              )}
              {result.questionType && (
                <Badge variant="secondary" className="text-xs">
                  <Type className="mr-1 h-3 w-3" /> {result.questionType}
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyAll}
          >
            <Copy className="mr-1 h-4 w-4" />
            复制全部
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center text-sm">
              <Hash className="mr-2 h-4 w-4 text-primary" />
              题干 {result.questionNumber && `(题号: ${result.questionNumber})`}
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyQuestionBody}
              className="text-xs"
            >
              <Copy className="mr-1 h-3 w-3" />
              复制
            </Button>
          </div>
          <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 p-3 rounded-md border leading-relaxed">
            {result.body}
          </div>
        </div>
        {result.options && result.options.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center text-sm">
                <ListChecks className="mr-2 h-4 w-4 text-primary" />
                选项
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyOptions}
                className="text-xs"
              >
                <Copy className="mr-1 h-3 w-3" />
                复制
              </Button>
            </div>
            <ul className="space-y-2">
              {result.options.map((option) => (
                <li key={option.key} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline" className="mt-0.5 text-xs min-w-[24px] justify-center">
                    {option.key}
                  </Badge>
                  <span className="text-muted-foreground leading-relaxed flex-1">
                    {option.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
