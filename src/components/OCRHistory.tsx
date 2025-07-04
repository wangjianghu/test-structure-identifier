
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Download, FileText, Image, Type, ChevronLeft, ChevronRight, Clock, Target, Zap, Copy } from "lucide-react";
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

export function OCRHistory({
  history,
  onRemoveItem,
  onExport,
  onClear
}: OCRHistoryProps) {
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

      const { error } = await supabase
        .from('analysis_history')
        .insert(exportData);

      if (error) {
        console.error('同步到 Supabase 失败:', error);
        toast.error("同步到云端失败", {
          description: "数据已导出到本地，但云端同步失败。"
        });
      } else {
        toast.success("导出并同步成功", {
          description: `已导出 ${history.length} 条记录并同步到云端。`
        });
      }
    } catch (error) {
      console.error('导出过程出错:', error);
      toast.error("导出失败", {
        description: "导出过程中发生错误，请稍后重试。"
      });
    }
  };

  const formatProcessingTime = (inputTime: Date, outputTime?: Date) => {
    if (!outputTime) return "-";
    const processingMs = outputTime.getTime() - inputTime.getTime();
    return `${processingMs}ms`;
  };

  const getClassificationConfidence = (item: HistoryItem) => {
    if (item.inputType === 'image' && item.ocrResult) {
      return `${(item.ocrResult.classification.confidence * 100).toFixed(1)}%`;
    } else if (item.inputType === 'text') {
      return "95.0%";
    }
    return "-";
  };

  const handleCopyId = async (displayId: number) => {
    try {
      await navigator.clipboard.writeText(displayId.toString());
      toast.success("ID已复制到粘贴板", {
        description: `记录ID: ${displayId}`
      });
    } catch (error) {
      console.error('复制失败:', error);
      toast.error("复制失败", {
        description: "无法访问粘贴板，请手动复制。"
      });
    }
  };

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            历史记录
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
            历史记录 ({history.length})
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
          <div className="space-y-4">
            {currentItems.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm font-mono text-muted-foreground hover:text-primary p-1 h-auto"
                      onClick={() => handleCopyId(item.displayId)}
                      title="点击复制ID"
                    >
                      #{item.displayId}
                      <Copy className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 调整时间和置信度信息显示为两行 */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {/* 第一行：输入时间和完成时间 */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>输入：{format(item.inputTime, 'HH:mm:ss')}</span>
                    </div>
                    {item.outputTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>完成：{format(item.outputTime, 'HH:mm:ss')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 第二行：耗时和置信度 */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>耗时：{formatProcessingTime(item.inputTime, item.outputTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>置信度：{getClassificationConfidence(item)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">输入内容</h4>
                    {item.inputType === 'image' ? (
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
                    ) : (
                      <div className="p-3 bg-muted rounded text-sm">
                        {item.inputText || "无输入内容"}
                      </div>
                    )}
                  </div>

                  {item.inputType === 'image' && item.ocrResult && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">OCR 识别结果</h4>
                      <div className="p-3 bg-muted rounded text-sm">
                        {item.ocrResult.text || "无识别结果"}
                      </div>
                    </div>
                  )}

                  {item.analysisResult && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">分析结果</h4>
                      <div className="p-3 bg-muted rounded text-sm space-y-1">
                        <div><span className="font-medium">学科:</span> {item.analysisResult.subject}</div>
                        <div><span className="font-medium">题型:</span> {item.analysisResult.questionType}</div>
                        <div><span className="font-medium">结构:</span> {item.analysisResult.hasOptions ? `${item.analysisResult.options.length}个选项` : '主观题'}</div>
                        {item.analysisResult.hasOptions && item.analysisResult.options.length > 0 && (
                          <div>
                            <span className="font-medium">选项:</span>
                            <div className="mt-1 space-y-1">
                              {item.analysisResult.options.map((option, index) => (
                                <div key={index} className="text-xs pl-2 border-l-2 border-muted-foreground/20">
                                  {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

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
