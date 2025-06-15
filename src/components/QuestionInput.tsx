
import * as React from "react";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionInputProps extends Omit<TextareaProps, 'className'> {
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isOcrLoading: boolean;
  className?: string;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function QuestionInput({ 
  onImageUpload, 
  isOcrLoading, 
  className, 
  onAnalyze, 
  isAnalyzing,
  value,
  ...props 
}: QuestionInputProps) {
  return (
    <div className={cn(
      "flex flex-col rounded-md border border-input bg-background shadow-sm",
      "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      "transition-shadow",
      className
    )}>
      <Textarea
        placeholder="在此处粘贴试题文本或图片..."
        className="min-h-[150px] text-base w-full border-none bg-transparent rounded-t-md focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-y p-3"
        value={value}
        {...props}
      />
      <div className="flex items-center justify-between p-2 border-t bg-slate-50 dark:bg-slate-900/50 rounded-b-md">
        <Button asChild variant="ghost" size="icon" disabled={isOcrLoading} className="cursor-pointer rounded-md h-8 w-8">
          <label htmlFor="file-upload-input">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">从图片识别</span>
          </label>
        </Button>
        <input
          id="file-upload-input"
          type="file"
          className="sr-only"
          onChange={onImageUpload}
          accept="image/*"
          disabled={isOcrLoading}
        />
        <Button 
          onClick={onAnalyze} 
          disabled={isAnalyzing || isOcrLoading || !value} 
          size="sm"
          className="ml-auto"
        >
          <Zap className="mr-2 h-4 w-4" />
          {isAnalyzing ? "分析中..." : "开始分析"}
        </Button>
      </div>
    </div>
  );
}
