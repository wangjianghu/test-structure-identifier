
import { useState, useEffect } from "react";
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

const questionTypes = {
  "数学": ["单选题", "填空题", "解答题", "证明题", "应用题"],
  "语文": ["选择题", "阅读理解", "作文题", "文言文翻译", "诗词鉴赏"],
  "英语": ["单选题", "完形填空", "阅读理解", "翻译题", "写作题"],
  "物理": ["选择题", "填空题", "实验题", "计算题", "论述题"],
  "化学": ["选择题", "填空题", "实验题", "计算题", "推断题"],
  "生物": ["选择题", "填空题", "实验题", "分析题", "简答题"],
  "历史": ["选择题", "材料题", "论述题", "分析题", "简答题"],
  "地理": ["选择题", "填空题", "读图题", "分析题", "简答题"],
  "政治": ["选择题", "材料题", "论述题", "分析题", "简答题"],
};

const questionStructureTemplates = {
  "数学-单选题": `题目：数学计算或概念理解
选项：A. 选项内容
选项：B. 选项内容  
选项：C. 选项内容
选项：D. 选项内容`,
  "数学-填空题": `题目：数学计算题干
空白：______(答案位置)
提示：可能包含单位要求`,
  "数学-解答题": `题目：问题描述
要求：解答过程
步骤：(1) 第一步分析
步骤：(2) 第二步计算
步骤：(3) 得出结论`,
  "语文-阅读理解": `文章：阅读材料内容
问题1：理解类问题
问题2：分析类问题
问题3：概括类问题`,
  "英语-完形填空": `文章：英语短文
空白1：_____ (选择题)
空白2：_____ (选择题)
选项：每个空白对应4个选项`,
  "物理-实验题": `实验目的：明确实验目标
实验器材：列出所需器材
实验步骤：详细操作过程
数据处理：计算和分析
结论：实验结果`,
  "化学-推断题": `信息：已知条件
推断：物质A是_____
推断：物质B是_____
验证：实验验证方法`,
};

export function SubjectAndTypeSelector({
  selectedSubject,
  onSubjectChange,
  questionTypeExample,
  onQuestionTypeExampleChange,
}: SubjectAndTypeSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempExample, setTempExample] = useState(questionTypeExample);
  const [selectedQuestionType, setSelectedQuestionType] = useState("");

  const availableQuestionTypes = selectedSubject ? questionTypes[selectedSubject as keyof typeof questionTypes] || [] : [];

  // 当学科或题型改变时，自动设置模板
  useEffect(() => {
    if (selectedSubject && selectedQuestionType) {
      const templateKey = `${selectedSubject}-${selectedQuestionType}` as keyof typeof questionStructureTemplates;
      const template = questionStructureTemplates[templateKey];
      if (template && !questionTypeExample) {
        setTempExample(template);
      }
    }
  }, [selectedSubject, selectedQuestionType, questionTypeExample]);

  // 当学科改变时重置题型
  useEffect(() => {
    setSelectedQuestionType("");
  }, [selectedSubject]);

  const saveToDatabase = async (content: string, subject: string, questionType: string) => {
    try {
      console.log('保存题型示例到数据库:', { content, subject, questionType });
      
      const { data: existingData, error: checkError } = await supabase
        .from('question_type_examples')
        .select('*')
        .eq('subject', subject)
        .eq('question_type', questionType)
        .eq('structure_example', content)
        .maybeSingle();

      if (checkError) {
        console.error('检查现有记录时出错:', checkError);
        throw checkError;
      }

      if (existingData) {
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
    
    if (tempExample && tempExample !== questionTypeExample && selectedSubject && selectedQuestionType) {
      await saveToDatabase(tempExample, selectedSubject, selectedQuestionType);
    }
  };

  const handleInputClick = () => {
    // 如果有模板且当前为空，使用模板
    if (selectedSubject && selectedQuestionType && !questionTypeExample) {
      const templateKey = `${selectedSubject}-${selectedQuestionType}` as keyof typeof questionStructureTemplates;
      const template = questionStructureTemplates[templateKey];
      if (template) {
        setTempExample(template);
      } else {
        setTempExample(questionTypeExample);
      }
    } else {
      setTempExample(questionTypeExample);
    }
    setIsDialogOpen(true);
  };

  const handleQuestionTypeChange = (value: string) => {
    setSelectedQuestionType(value);
    // 清空当前示例，让用户重新选择
    onQuestionTypeExampleChange("");
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 学科选择 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="subject-select" className="text-sm whitespace-nowrap">选择学科：</Label>
            <Select value={selectedSubject} onValueChange={onSubjectChange}>
              <SelectTrigger id="subject-select" className="w-32">
                <SelectValue placeholder="选择学科" />
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
          
          {/* 题型选择 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="question-type-select" className="text-sm whitespace-nowrap">选择题型：</Label>
            <Select 
              value={selectedQuestionType} 
              onValueChange={handleQuestionTypeChange}
              disabled={!selectedSubject}
            >
              <SelectTrigger id="question-type-select" className="w-32">
                <SelectValue placeholder="选择题型" />
              </SelectTrigger>
              <SelectContent>
                {availableQuestionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 题型示例 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="question-type-example" className="text-sm whitespace-nowrap">结构示例：</Label>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Input
                  id="question-type-example"
                  value={questionTypeExample}
                  onClick={handleInputClick}
                  readOnly
                  placeholder={selectedSubject && selectedQuestionType ? "点击设置题型结构" : "请先选择学科和题型"}
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
                      placeholder="请输入题型结构，建议每个要素独立一行..."
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
