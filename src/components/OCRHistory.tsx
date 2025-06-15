
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, FileText, Image, Type } from "lucide-react";
import { HistoryItem } from "@/types/ocrHistory";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface OCRHistoryProps {
  history: HistoryItem[];
  onRemoveItem: (id: string) => void;
  onExport: () => void;
  onClear: () => void;
}

export function OCRHistory({ history, onRemoveItem, onExport, onClear }: OCRHistoryProps) {
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
            <Button variant="outline" size="sm" onClick={onExport}>
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
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex items-start justify-between">
              <div className="flex gap-3 flex-1">
                {item.inputType === 'image' ? (
                  <img 
                    src={item.imageDataUrl} 
                    alt="识别图片" 
                    className="w-16 h-16 object-cover rounded border flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded border flex items-center justify-center flex-shrink-0">
                    <Type className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    
                    {item.inputType === 'image' && (
                      <>
                        <span className="text-sm font-medium truncate max-w-32">
                          {item.originalImage.name}
                        </span>
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
                  
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: zhCN })}
                  </p>
                  
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    {item.inputType === 'image' ? (
                      <>
                        <span>OCR: {item.ocrResult.confidence.toFixed(1)}%</span>
                        <span>分类: {(item.ocrResult.classification.confidence * 100).toFixed(1)}%</span>
                        <span>学科: {item.ocrResult.classification.subject}</span>
                      </>
                    ) : (
                      <>
                        <span>输入长度: {item.inputText.length}字符</span>
                        <span>学科: {item.analysisResult.subject}</span>
                        <span>题型: {item.analysisResult.questionType}</span>
                      </>
                    )}
                  </div>
                </div>
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
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
              <p className="text-sm font-medium mb-1">
                {item.inputType === 'image' ? 'OCR识别结果:' : '输入内容:'}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {item.inputType === 'image' ? 
                  (item.ocrResult.text || "无识别结果") : 
                  (item.inputText || "无输入内容")
                }
              </p>
            </div>
            
            {item.analysisResult && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                <p className="text-sm font-medium mb-1">分析结果:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>题型: {item.analysisResult.questionType}</div>
                  <div>学科: {item.analysisResult.subject}</div>
                  {item.analysisResult.hasOptions && (
                    <div>选项数量: {item.analysisResult.options.length}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
