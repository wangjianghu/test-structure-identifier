
import * as React from "react";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Zap, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageViewDialog } from "./ImageViewDialog";

interface QuestionInputProps extends Omit<TextareaProps, 'className'> {
  onImagesUpload: (files: File[]) => void;
  uploadedImages: File[];
  onRemoveImage: (index: number) => void;
  isOcrLoading: boolean;
  className?: string;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function QuestionInput({ 
  onImagesUpload,
  uploadedImages,
  onRemoveImage,
  isOcrLoading, 
  className, 
  onAnalyze, 
  isAnalyzing,
  value,
  ...props 
}: QuestionInputProps) {
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);

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
      onImagesUpload([...uploadedImages, ...files]);
    }
    event.target.value = ''; // 清空文件输入
  };

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
                  
                  {/* 悬停时显示的操作按钮 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                    <ImageViewDialog 
                      imageUrl={preview} 
                      fileName={uploadedImages[index]?.name || `图片 ${index + 1}`}
                    >
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-white hover:text-blue-200">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </ImageViewDialog>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemoveImage(index)}
                      className="h-4 w-4 p-0 text-white hover:text-red-200"
                      disabled={isOcrLoading || isAnalyzing}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={onAnalyze} 
          disabled={isAnalyzing || isOcrLoading || (!value && uploadedImages.length === 0)} 
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
