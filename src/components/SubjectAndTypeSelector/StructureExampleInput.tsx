
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { questionStructureTemplates } from "./SubjectData";

interface StructureExampleInputProps {
  selectedSubject: string;
  selectedQuestionType: string;
  questionTypeExample: string;
  onQuestionTypeExampleChange: (example: string) => void;
  onSave: (content: string, subject: string, questionType: string) => Promise<void>;
}

export function StructureExampleInput({
  selectedSubject,
  selectedQuestionType,
  questionTypeExample,
  onQuestionTypeExampleChange,
  onSave,
}: StructureExampleInputProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempExample, setTempExample] = useState(questionTypeExample);

  const getTemplate = () => {
    if (selectedSubject && selectedQuestionType) {
      const templateKey = `${selectedSubject}-${selectedQuestionType}` as keyof typeof questionStructureTemplates;
      return questionStructureTemplates[templateKey] || `题目：${selectedQuestionType}题干内容\n答案：参考答案\n解析：解题思路`;
    }
    return "";
  };

  const handleInputClick = () => {
    const template = getTemplate();
    setTempExample(questionTypeExample || template);
    setIsDialogOpen(true);
  };

  const handleDialogClose = async () => {
    setIsDialogOpen(false);
    onQuestionTypeExampleChange(tempExample);
    
    if (tempExample && tempExample !== questionTypeExample && selectedSubject && selectedQuestionType) {
      await onSave(tempExample, selectedSubject, selectedQuestionType);
    }
  };

  const displayValue = questionTypeExample || (selectedSubject && selectedQuestionType ? "点击设置题型结构示例" : "请先选择学科和题型");

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="question-type-example" className="text-sm whitespace-nowrap">题型结构示例：</Label>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Input
            id="question-type-example"
            value={displayValue}
            onClick={handleInputClick}
            readOnly
            placeholder="请先选择学科和题型"
            className="flex-1 cursor-pointer overflow-hidden text-ellipsis"
            disabled={!selectedSubject || !selectedQuestionType}
          />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogTitle>设置 {selectedSubject} - {selectedQuestionType} 结构示例</DialogTitle>
          <div className="space-y-4">
            <div>
              <Label htmlFor="example-textarea">题型结构示例（每行一个要素）</Label>
              <Textarea
                id="example-textarea"
                value={tempExample}
                onChange={(e) => setTempExample(e.target.value)}
                placeholder={getTemplate() || "请输入题型结构，建议每个要素独立一行..."}
                className="min-h-[120px] resize-none font-mono"
                autoFocus
              />
            </div>
            <div className="text-xs text-muted-foreground">
              💡 提示：系统已根据选择的学科和题型预填充常见结构，您可以修改或添加更多细节
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleDialogClose}>
                确定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
