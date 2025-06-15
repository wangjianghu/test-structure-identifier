
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const saveToDatabase = async (content: string, subject: string, questionType: string) => {
    try {
      console.log('保存题型示例到数据库:', { content, subject, questionType });
      
      // 首先检查是否已存在相同的示例
      const { data: existingData, error: checkError } = await supabase
        .from('question_type_examples')
        .select('*')
        .eq('subject', subject)
        .eq('question_type', questionType)
        .eq('structure_example', content)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 表示没有找到记录
        console.error('检查现有记录时出错:', checkError);
        throw checkError;
      }

      if (existingData) {
        // 如果记录已存在，更新使用次数和最后使用时间
        const { error: updateError } = await supabase
          .from('question_type_examples')
          .update({
            usage_count: existingData.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) {
          console.error('更新使用次数时出错:', updateError);
          throw updateError;
        }

        console.log('已更新现有记录的使用次数');
        toast.success("题型示例已更新", {
          description: "使用次数已增加，数据已保存到云端"
        });
      } else {
        // 如果记录不存在，创建新记录
        const { error: insertError } = await supabase
          .from('question_type_examples')
          .insert({
            subject,
            question_type: questionType,
            structure_example: content,
            usage_count: 1,
            last_used_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('插入新记录时出错:', insertError);
          throw insertError;
        }

        console.log('已保存新的题型示例');
        toast.success("题型示例已保存", {
          description: "新的题型结构示例已保存到云端数据库"
        });
      }
    } catch (error) {
      console.error('保存题型示例失败:', error);
      toast.error("保存失败", {
        description: "无法保存题型示例到数据库，请稍后重试"
      });
    }
  };

  const handleDialogClose = async () => {
    setIsDialogOpen(false);
    onQuestionTypeExampleChange(tempExample);
    
    // 如果有内容变化且选择了学科，保存到数据库
    if (tempExample && tempExample !== questionTypeExample && selectedSubject) {
      // 假设题型从分析结果中获取，这里先用默认值
      const questionType = "通用题型";
      await saveToDatabase(tempExample, selectedSubject, questionType);
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
          
          {/* 题型示例行 */}
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
            <p>✨ 已设置识别优化参数，数据将自动保存到云端数据库</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
