
import * as React from "react";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Zap, X, Eye, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageViewDialog } from "./ImageViewDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ParsedQuestion } from "@/lib/parser";
import { OCRResult } from "@/lib/enhancedOCR";
import { TextHistoryItem, ImageHistoryItem } from "@/types/ocrHistory";

interface QuestionInputProps extends Omit<TextareaProps, 'className'> {
  onAnalysisComplete?: (result: ParsedQuestion | null) => void;
  onTextSubmit?: (text: string, result: ParsedQuestion) => TextHistoryItem;
  onImageSubmit?: (file: File, ocrResult: OCRResult, analysisResult?: ParsedQuestion) => Promise<ImageHistoryItem>;
  onImageAnalysisUpdate?: (id: string, analysisResult: ParsedQuestion) => void;
  selectedSubject?: string;
  questionTypeExample?: string;
  className?: string;
}

export function QuestionInput({ 
  onAnalysisComplete,
  onTextSubmit,
  onImageSubmit,
  onImageAnalysisUpdate,
  selectedSubject,
  questionTypeExample,
  className, 
  value,
  ...props 
}: QuestionInputProps) {
  const [uploadedImages, setUploadedImages] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  const [isOcrLoading, setIsOcrLoading] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [clearOptimizationParams, setClearOptimizationParams] = React.useState(() => {
    // 从 localStorage 读取持久化状态
    const saved = localStorage.getItem('clearOptimizationParams');
    return saved ? JSON.parse(saved) : false;
  });

  // 持久化状态到 localStorage
  React.useEffect(() => {
    localStorage.setItem('clearOptimizationParams', JSON.stringify(clearOptimizationParams));
  }, [clearOptimizationParams]);

  React.useEffect(() => {
    // 创建图片预览URLs
    const previews = uploadedImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);

    // 清理旧的URLs
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [uploadedImages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setUploadedImages(prev => [...prev, ...files]);
    }
    event.target.value = ''; // 清空文件输入
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // 检测编程文本类型
  const detectProgrammingText = (text: string) => {
    const patterns = {
      json: /^\s*[\{\[]/,
      html: /^\s*<[^>]+>/,
      css: /[{}].*[;:]/,
      javascript: /function\s+\w+|var\s+\w+|let\s+\w+|const\s+\w+|=>/,
      python: /def\s+\w+|import\s+\w+|from\s+\w+\s+import/,
      sql: /SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+|CREATE\s+/i,
      xml: /^\s*<\?xml|<[^>]+>/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return type;
      }
    }
    return null;
  };

  const currentTextType = React.useMemo(() => {
    if (typeof value === 'string' && value.trim()) {
      return detectProgrammingText(value);
    }
    return null;
  }, [value]);

  const handleAnalyze = async () => {
    if (!value && uploadedImages.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      // This is a placeholder - in real implementation, this would call the OCR and analysis services
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock analysis result
      const mockResult: ParsedQuestion = {
        body: typeof value === 'string' ? value : '',
        questionType: '问答题',
        subject: selectedSubject || '数学',
        options: []
      };
      
      if (onAnalysisComplete) {
        onAnalysisComplete(mockResult);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = (clearOptimizationParams?: boolean) => {
    setUploadedImages([]);
    // Clear the textarea value by calling the parent's onChange
    if (props.onChange) {
      const mockEvent = { target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>;
      props.onChange(mockEvent);
    }
    
    if (clearOptimizationParams && onAnalysisComplete) {
      onAnalysisComplete(null);
    }
  };

  const hasContent = (typeof value === 'string' && value.trim()) || uploadedImages.length > 0;

  return (
    <div className={cn(
      "flex flex-col rounded-md border border-input bg-background shadow-sm",
      "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      "transition-shadow",
      className
    )}>
      <Textarea
        placeholder="在此处粘贴试题文本或上传图片..."
        className="min-h-[150px] text-base w-full border-none bg-transparent rounded-t-md focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-y p-3"
        value={value}
        {...props}
      />
      
      {/* 编程文本类型提示 */}
      {currentTextType && (
        <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            检测到 {currentTextType.toUpperCase()} 代码格式
          </span>
        </div>
      )}
      
      {/* 底部操作栏 */}
      <div className="flex items-center justify-between p-2 border-t bg-slate-50 dark:bg-slate-900/50 rounded-b-md">
        <div className="flex items-center gap-2">
          {/* 上传按钮 */}
          <Button asChild variant="ghost" size="icon" disabled={isOcrLoading || isAnalyzing} className="cursor-pointer rounded-md h-8 w-8">
            <label htmlFor="file-upload-input">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">上传图片</span>
            </label>
          </Button>
          <input
            id="file-upload-input"
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept="image/*"
            multiple
            disabled={isOcrLoading || isAnalyzing}
          />

          {/* 图片缩略图 */}
          {imagePreviews.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="w-8 h-8 rounded border overflow-hidden bg-gray-100">
                    <img 
                      src={preview} 
                      alt={`上传图片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 右上角删除按钮 */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-red-500 text-white hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isOcrLoading || isAnalyzing}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                  
                  {/* 中央预览按钮 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageViewDialog 
                      imageUrl={preview} 
                      fileName={uploadedImages[index]?.name || `图片 ${index + 1}`}
                    >
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-black/50 text-white hover:bg-black/70 rounded-full">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </ImageViewDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* 清空选项 */}
          <div className="flex items-center gap-2">
            <Checkbox 
              id="clear-optimization"
              checked={clearOptimizationParams}
              onCheckedChange={(checked) => setClearOptimizationParams(!!checked)}
              disabled={isAnalyzing || isOcrLoading}
            />
            <label 
              htmlFor="clear-optimization" 
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              同步清空识别优化参数
            </label>
          </div>

          {/* 清空按钮 */}
          <Button 
            onClick={() => handleClear(clearOptimizationParams)} 
            disabled={isAnalyzing || isOcrLoading || !hasContent} 
            size="sm"
            variant="outline"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            清空
          </Button>

          {/* 分析按钮 */}
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || isOcrLoading || (!value && uploadedImages.length === 0)} 
            size="sm"
          >
            <Zap className="mr-2 h-4 w-4" />
            {isAnalyzing ? "分析中..." : "开始分析"}
          </Button>
        </div>
      </div>
    </div>
  );
}
