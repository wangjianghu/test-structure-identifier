
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ParsedQuestion } from "@/lib/parser";
import { ListChecks, Hash, Type, Book } from "lucide-react";

interface AnalysisResultProps {
  result: ParsedQuestion;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <Card className="w-full max-w-2xl animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span>分析结果</span>
          <div className="flex items-center gap-2">
            {result.subject && result.subject !== '未知' && (
              <Badge variant="outline">
                <Book className="mr-1 h-4 w-4" /> {result.subject}
              </Badge>
            )}
            {result.questionType && (
              <Badge variant="secondary">
                <Type className="mr-1 h-4 w-4" /> {result.questionType}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center">
            <Hash className="mr-2 h-5 w-5 text-primary" />
            题干 {result.questionNumber && `(题号: ${result.questionNumber})`}
          </h3>
          <p className="text-muted-foreground bg-slate-50 dark:bg-slate-800 p-4 rounded-md border">
            {result.body}
          </p>
        </div>
        {result.options && result.options.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center">
              <ListChecks className="mr-2 h-5 w-5 text-primary" />
              选项
            </h3>
            <ul className="space-y-2">
              {result.options.map((option) => (
                <li key={option.key} className="flex items-start gap-2">
                  <Badge className="mt-1">{option.key}</Badge>
                  <span className="text-muted-foreground">{option.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
