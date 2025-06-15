
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SubjectSelector } from "./SubjectSelector";
import { QuestionTypeSelector } from "./QuestionTypeSelector";
import { StructureExampleInput } from "./StructureExampleInput";
import { MistralConfig } from "@/components/MistralConfig";

interface SubjectAndTypeSelectorProps {
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  questionTypeExample: string;
  onQuestionTypeExampleChange: (example: string) => void;
}

export function SubjectAndTypeSelector({
  selectedSubject,
  onSubjectChange,
  questionTypeExample,
  onQuestionTypeExampleChange,
}: SubjectAndTypeSelectorProps) {
  const [selectedQuestionType, setSelectedQuestionType] = useState("");

  // 当学科改变时重置题型
  useEffect(() => {
    setSelectedQuestionType("");
    onQuestionTypeExampleChange("");
  }, [selectedSubject, onQuestionTypeExampleChange]);

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

  const handleQuestionTypeChange = (value: string) => {
    setSelectedQuestionType(value);
    onQuestionTypeExampleChange("");
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <SubjectSelector
            selectedSubject={selectedSubject}
            onSubjectChange={onSubjectChange}
          />
          
          <QuestionTypeSelector
            selectedSubject={selectedSubject}
            selectedQuestionType={selectedQuestionType}
            onQuestionTypeChange={handleQuestionTypeChange}
          />
          
          <StructureExampleInput
            selectedSubject={selectedSubject}
            selectedQuestionType={selectedQuestionType}
            questionTypeExample={questionTypeExample}
            onQuestionTypeExampleChange={onQuestionTypeExampleChange}
            onSave={saveToDatabase}
          />
          
          <div className="flex justify-start lg:justify-end">
            <MistralConfig />
          </div>
        </div>
        
        {(selectedSubject || questionTypeExample) && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <p>✨ 已设置识别优化参数，数据将自动保存到云端数据库</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
