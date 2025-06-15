
import { QuestionTypeExample } from "@/types/ocrHistory";

interface QuestionTypeStatsProps {
  questionTypeExamples: QuestionTypeExample[];
}

export function QuestionTypeStats({ questionTypeExamples }: QuestionTypeStatsProps) {
  if (questionTypeExamples.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border">
      <h3 className="font-semibold mb-2 text-sm">题型结构收集统计</h3>
      <div className="text-xs text-muted-foreground">
        已收集 {questionTypeExamples.length} 种题型结构示例，将用于提升识别准确性
      </div>
    </div>
  );
}
