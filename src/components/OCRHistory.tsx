
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, FileText } from "lucide-react";
import { OCRHistoryItem } from "@/types/ocrHistory";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface OCRHistoryProps {
  history: OCRHistoryItem[];
  onRemoveItem: (id: string) => void;
  onExport: () => void;
  onClear: () => void;
}

export function OCRHistory({ history, onRemoveItem, onExport, onClear }: OCRHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            OCR 历史记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">暂无识别记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            OCR 历史记录 ({history.length})
          </CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {history.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <img 
                  src={item.imageDataUrl} 
                  alt="识别图片" 
                  className="w-16 h-16 object-cover rounded border"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{item.originalImage.name}</span>
                    <Badge variant={item.ocrResult.classification.isQuestion ? "default" : "secondary"}>
                      {item.ocrResult.classification.isQuestion ? "试题" : "非试题"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: zhCN })}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>OCR: {item.ocrResult.confidence.toFixed(1)}%</span>
                    <span>分类: {(item.ocrResult.classification.confidence * 100).toFixed(1)}%</span>
                    <span>学科: {item.ocrResult.classification.subject}</span>
                  </div>
                </div>
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
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
              <p className="text-sm font-medium mb-1">识别结果:</p>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {item.ocrResult.text || "无识别结果"}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
