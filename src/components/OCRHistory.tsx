
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Download, FileText, Image, Type, ChevronLeft, ChevronRight } from "lucide-react";
import { HistoryItem } from "@/types/ocrHistory";
import { format } from "date-fns";
import { ImageViewDialog } from "./ImageViewDialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OCRHistoryProps {
  history: HistoryItem[];
  onRemoveItem: (id: string) => void;
  onExport: () => void;
  onClear: () => void;
}

const ITEMS_PER_PAGE = 10;

export function OCRHistory({ history, onRemoveItem, onExport, onClear }: OCRHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = history.slice(startIndex, endIndex);

  const handleExportWithSync = async () => {
    try {
      // 导出本地数据
      onExport();
      
      // 同步数据到 Supabase
      const exportData = history.map(item => ({
        id: item.id,
        timestamp: item.timestamp.toISOString(),
        input_time: item.inputTime.toISOString(),
        output_time: item.outputTime?.toISOString(),
        input_type: item.inputType,
        selected_subject: item.selectedSubject,
        question_type_example: item.questionTypeExample,
        input_text: item.inputType === 'text' ? item.inputText : item.inputText,
        analysis_result: item.analysisResult ? JSON.stringify(item.analysisResult) : null,
        ocr_result: item.inputType === 'image' ? JSON.stringify(item.ocrResult) : null,
        file_name: item.inputType === 'image' ? item.originalImage.name : null,
        file_size: item.inputType === 'image' ? item.originalImage.size : null,
        file_type: item.inputType === 'image' ? item.originalImage.type : null
      }));

      // 批量插入到 Supabase (使用 upsert 避免重复)
      const { error } = await supabase
        .from('analysis_history')
        .upsert(exportData, { onConflict: 'id' });

      if (error) {
        console.error('同步到 Supabase 失败:', error);
        toast.error("同步到云端失败", {
          description: "数据已导出到本地，但云端同步失败。",
        });
      } else {
        toast.success("导出并同步成功", {
          description: `已导出 ${history.length} 条记录并同步到云端。`,
        });
      }
    } catch (error) {
      console.error('导出过程出错:', error);
      toast.error("导出失败", {
        description: "导出过程中发生错误，请稍后重试。",
      });
    }
  };

  const getStructuralOverview = (analysisResult: any) => {
    if (!analysisResult) return '';
    
    // 根据题型返回结构概况
    if (analysisResult.questionType === '选择题' && analysisResult.hasOptions) {
      return `${analysisResult.options.length}个选项`;
    } else if (analysisResult.questionType === '填空题') {
      // 假设通过题干中的空格数量判断
      const blanks = (analysisResult.text.match(/____+/g) || []).length;
      return blanks > 0 ? `${blanks}个空` : '填空题';
    } else if (analysisResult.questionType === '复合题') {
      // 假设有子题信息
      return '复合题结构';
    } else if (analysisResult.questionType === '解答题' || analysisResult.questionType === '计算题') {
      return '主观题';
    }
    
    return analysisResult.questionType;
  };

  const formatProcessingTime = (inputTime: Date, outputTime?: Date) => {
    if (!outputTime) return "处理中...";
    const processingMs = outputTime.getTime() - inputTime.getTime();
    return `${processingMs}ms`;
  };

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            分析历史记录
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center">暂无分析记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            分析历史记录 ({history.length})
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportWithSync}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              清空
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
          <div className="space-y-4 pr-4">
            {currentItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {item.inputType === 'image' ? (
                          <>
                            <Image className="h-3 w-3 mr-1" />
                            图片输入
                          </>
                        ) : (
                          <>
                            <Type className="h-3 w-3 mr-1" />
                            文本输入
                          </>
                        )}
                      </Badge>
                      
                      {item.selectedSubject && (
                        <Badge variant="secondary" className="text-xs">
                          {item.selectedSubject}
                        </Badge>
                      )}
                      
                      {item.inputType === 'image' && item.ocrResult && (
                        <>
                          <Badge variant={item.ocrResult.classification.isQuestion ? "default" : "secondary"}>
                            {item.ocrResult.classification.isQuestion ? "试题" : "非试题"}
                          </Badge>
                        </>
                      )}
                      
                      {item.analysisResult && (
                        <Badge variant="default">
                          已分析
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>输入: {format(item.inputTime, 'HH:mm:ss')}</span>
                      {item.outputTime && (
                        <>
                          <span>•</span>
                          <span>完成: {format(item.outputTime, 'HH:mm:ss')}</span>
                          <span>•</span>
                          <span>耗时: {formatProcessingTime(item.inputTime, item.outputTime)}</span>
                        </>
                      )}
                      {item.inputType === 'image' && item.ocrResult && (
                        <>
                          <span>•</span>
                          <span>置信度: {(item.ocrResult.classification.confidence * 100).toFixed(1)}%</span>
                        </>
                      )}
                      {item.inputType === 'text' && (
                        <>
                          <span>•</span>
                          <span>置信度: 95.0%</span>
                        </>
                      )}
                    </div>

                    {item.questionTypeExample && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
                        <span className="font-medium">题型示例:</span> {item.questionTypeExample}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveItem(item.id)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* 图片输入时：独立一行显示正方形缩略图 */}
                {item.inputType === 'image' && (
                  <div className="flex justify-center">
                    <ImageViewDialog 
                      imageUrl={item.imageDataUrl} 
                      fileName={item.originalImage.name}
                    >
                      <img 
                        src={item.imageDataUrl} 
                        alt="分析图片" 
                        className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        title="点击查看大图"
                      />
                    </ImageViewDialog>
                  </div>
                )}
                
                {/* 图片输入时：显示OCR结果 */}
                {item.inputType === 'image' && item.ocrResult && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
                    <p className="text-sm font-medium mb-1">OCR识别结果:</p>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words h-20 overflow-y-auto border rounded p-2 bg-background">
                      {item.ocrResult.text || "无识别结果"}
                    </div>
                  </div>
                )}
                
                {/* 文本输入时：显示输入内容 */}
                {item.inputType === 'text' && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
                    <p className="text-sm font-medium mb-1">输入内容:</p>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words h-20 overflow-y-auto border rounded p-2 bg-background">
                      {item.inputText || "无输入内容"}
                    </div>
                  </div>
                )}
                
                {/* 显示分析结果（图片和文本输入都显示） */}
                {item.analysisResult && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                    <p className="text-sm font-medium mb-1">分析结果:</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>学科: {item.analysisResult.subject}</div>
                      <div>题型: {item.analysisResult.questionType}</div>
                      <div>结构概况: {getStructuralOverview(item.analysisResult)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              第 {startIndex + 1}-{Math.min(endIndex, history.length)} 条，共 {history.length} 条记录
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
