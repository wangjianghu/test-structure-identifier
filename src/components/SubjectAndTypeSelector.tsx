
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface SubjectAndTypeSelectorProps {
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  questionTypeExample: string;
  onQuestionTypeExampleChange: (example: string) => void;
}

const subjects = [
  { value: "数学", label: "数学" },
  { value: "语文", label: "语文" },
  { value: "英语", label: "英语" },
  { value: "物理", label: "物理" },
  { value: "化学", label: "化学" },
  { value: "生物", label: "生物" },
  { value: "历史", label: "历史" },
  { value: "地理", label: "地理" },
  { value: "政治", label: "政治" },
];

export function SubjectAndTypeSelector({
  selectedSubject,
  onSubjectChange,
  questionTypeExample,
  onQuestionTypeExampleChange,
}: SubjectAndTypeSelectorProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject-select">学科选择（可选）</Label>
            <Select value={selectedSubject} onValueChange={onSubjectChange}>
              <SelectTrigger id="subject-select">
                <SelectValue placeholder="请选择学科以提高识别效果" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="question-type-example">题型结构示例（可选）</Label>
            <Input
              id="question-type-example"
              value={questionTypeExample}
              onChange={(e) => onQuestionTypeExampleChange(e.target.value)}
              placeholder="如：单选题、阅读理解、解答题等"
              className="w-full"
            />
          </div>
        </div>
        
        {(selectedSubject || questionTypeExample) && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
            <p>✨ 已设置识别优化参数，将提高OCR和分析准确性</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
