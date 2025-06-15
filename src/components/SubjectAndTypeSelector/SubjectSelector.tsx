
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subjects } from "./SubjectData";

interface SubjectSelectorProps {
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
}

export function SubjectSelector({ selectedSubject, onSubjectChange }: SubjectSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="subject-select" className="text-sm whitespace-nowrap">选择学科：</Label>
      <Select value={selectedSubject} onValueChange={onSubjectChange}>
        <SelectTrigger id="subject-select" className="w-[116px]">
          <SelectValue placeholder="选择学科" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800">
          {subjects.map((subject) => (
            <SelectItem key={subject.value} value={subject.value}>
              {subject.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
