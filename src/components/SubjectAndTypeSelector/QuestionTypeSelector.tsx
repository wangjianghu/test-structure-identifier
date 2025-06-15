
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questionTypes } from "./SubjectData";

interface QuestionTypeSelectorProps {
  selectedSubject: string;
  selectedQuestionType: string;
  onQuestionTypeChange: (type: string) => void;
}

export function QuestionTypeSelector({ 
  selectedSubject, 
  selectedQuestionType, 
  onQuestionTypeChange 
}: QuestionTypeSelectorProps) {
  const availableQuestionTypes = selectedSubject ? questionTypes[selectedSubject as keyof typeof questionTypes] || [] : [];

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="question-type-select" className="text-sm whitespace-nowrap">题型：</Label>
      <Select 
        value={selectedQuestionType} 
        onValueChange={onQuestionTypeChange}
        disabled={!selectedSubject}
      >
        <SelectTrigger id="question-type-select" className="w-[116px]">
          <SelectValue placeholder="选择题型" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800">
          {availableQuestionTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
