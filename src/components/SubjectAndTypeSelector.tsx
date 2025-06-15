
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempExample, setTempExample] = useState(questionTypeExample);

  const sendToEmail = async (content: string) => {
    try {
      // 创建邮件链接，用户可以直接点击发送
      const subject = encodeURIComponent("题型结构示例提交");
      const body = encodeURIComponent(`题型结构示例：\n\n${content}\n\n提交时间：${new Date().toLocaleString()}`);
      const mailtoLink = `mailto:dijiuxiaoshi@foxmail.com?subject=${subject}&body=${body}`;
      
      // 尝试打开邮件客户端
      window.location.href = mailtoLink;
      
      console.log('题型示例已准备发送到邮箱:', content);
      
      toast.success("题型示例已记录", {
        description: "邮件客户端已打开，请确认发送题型结构示例"
      });
    } catch (error) {
      console.error('打开邮件客户端失败:', error);
      
      // 如果无法打开邮件客户端，提供复制功能
      try {
        await navigator.clipboard.writeText(`题型结构示例：\n\n${content}\n\n请发送至：dijiuxiaoshi@foxmail.com`);
        toast.success("内容已复制到剪贴板", {
          description: "请手动发送至 dijiuxiaoshi@foxmail.com"
        });
      } catch (clipboardError) {
        toast.error("保存失败", {
          description: "无法自动发送邮件，请手动将内容发送至 dijiuxiaoshi@foxmail.com"
        });
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    onQuestionTypeExampleChange(tempExample);
    
    // 如果有内容变化，发送到邮箱
    if (tempExample && tempExample !== questionTypeExample) {
      sendToEmail(tempExample);
    }
  };

  const handleInputClick = () => {
    setTempExample(questionTypeExample);
    setIsDialogOpen(true);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 学科选择行 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="subject-select" className="text-sm whitespace-nowrap">学科选择：</Label>
            <Select value={selectedSubject} onValueChange={onSubjectChange}>
              <SelectTrigger id="subject-select" className="flex-1 min-w-[120px]">
                <SelectValue placeholder="请选择学科" />
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
          
          {/* 题型示例行 - 修复溢出问题 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="question-type-example" className="text-sm whitespace-nowrap">题型示例：</Label>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Input
                  id="question-type-example"
                  value={questionTypeExample}
                  onClick={handleInputClick}
                  readOnly
                  placeholder="点击输入题型结构示例"
                  className="flex-1 cursor-pointer overflow-hidden text-ellipsis"
                />
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogTitle>题型及结构示例</DialogTitle>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="example-textarea">请输入题型及题型结构示例</Label>
                    <Textarea
                      id="example-textarea"
                      value={tempExample}
                      onChange={(e) => setTempExample(e.target.value)}
                      placeholder="例如：单选题、阅读理解、解答题等&#10;&#10;可以包含题型特征描述：&#10;- 单选题：A、B、C、D四个选项&#10;- 阅读理解：包含文章和若干问题&#10;- 解答题：需要详细解答过程"
                      className="min-h-[120px] resize-none"
                      autoFocus
                      onBlur={handleDialogClose}
                    />
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
