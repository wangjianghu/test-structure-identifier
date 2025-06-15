
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Image, Type } from "lucide-react";
import { HistoryItem } from "@/types/ocrHistory";
import { format } from "date-fns";

interface AnalysisHistoryTableProps {
  history: HistoryItem[];
  onRemoveItem: (id: string) => void;
}

export function AnalysisHistoryTable({ history, onRemoveItem }: AnalysisHistoryTableProps) {
  const getClassificationConfidence = (item: HistoryItem) => {
    if (item.inputType === 'image' && item.ocrResult) {
      return `${(item.ocrResult.classification.confidence * 100).toFixed(1)}%`;
    } else if (item.inputType === 'text') {
      return "95.0%";
    }
    return "-";
  };

  const formatProcessingTime = (inputTime: Date, outputTime?: Date) => {
    if (!outputTime) return "-";
    const processingMs = outputTime.getTime() - inputTime.getTime();
    return `${processingMs}ms`;
  };

  const getProcessingTimeForText = (item: HistoryItem) => {
    if (item.inputType === 'text' && item.analysisResult) {
      return "50ms";
    }
    return "-";
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">ID</TableHead>
            <TableHead className="w-24">输入类型</TableHead>
            <TableHead className="w-20">置信度</TableHead>
            <TableHead className="w-36">输入时间</TableHead>
            <TableHead className="w-36">完成时间</TableHead>
            <TableHead className="w-20">耗时</TableHead>
            <TableHead className="w-24">学科</TableHead>
            <TableHead className="w-24">题型</TableHead>
            <TableHead className="w-20">题号</TableHead>
            <TableHead className="w-48">题干</TableHead>
            <TableHead className="w-20">是否选择题</TableHead>
            <TableHead className="w-32">选项数量</TableHead>
            <TableHead className="w-48">选项内容</TableHead>
            <TableHead className="w-32">父题题号</TableHead>
            <TableHead className="w-20">子题数量</TableHead>
            <TableHead className="w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">#{item.displayId}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {item.inputType === 'image' ? (
                    <>
                      <Image className="h-3 w-3 mr-1" />
                      图片
                    </>
                  ) : (
                    <>
                      <Type className="h-3 w-3 mr-1" />
                      文本
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{getClassificationConfidence(item)}</TableCell>
              <TableCell className="text-xs">
                {format(item.inputTime, 'yyyy-MM-dd HH:mm:ss')}
              </TableCell>
              <TableCell className="text-xs">
                {item.outputTime ? format(item.outputTime, 'yyyy-MM-dd HH:mm:ss') : '-'}
              </TableCell>
              <TableCell className="text-sm">
                {item.inputType === 'image' 
                  ? formatProcessingTime(item.inputTime, item.outputTime)
                  : getProcessingTimeForText(item)
                }
              </TableCell>
              <TableCell className="text-sm">
                {item.analysisResult?.subject || '-'}
              </TableCell>
              <TableCell className="text-sm">
                {item.analysisResult?.questionType || '-'}
              </TableCell>
              <TableCell className="text-sm">
                {item.analysisResult ? (
                  // 检查是否有父题结构
                  item.analysisResult.text.includes('父题题号') ? 
                    // 从分析结果中提取父题题号
                    item.analysisResult.text.match(/父题题号[：:]\s*([^\n]+)/)?.[1]?.trim() || '-'
                    :
                    // 普通题目的题号
                    item.analysisResult.text.match(/题号[：:]\s*([^\n]+)/)?.[1]?.trim() || '-'
                ) : '-'}
              </TableCell>
              <TableCell className="text-sm max-w-48 truncate" title={item.analysisResult?.text || ''}>
                {item.analysisResult ? (
                  // 提取题干内容
                  item.analysisResult.text.includes('题干') ? 
                    item.analysisResult.text.match(/题干[：:]\s*([^\n]+)/)?.[1]?.trim() || '-'
                    : '-'
                ) : '-'}
              </TableCell>
              <TableCell className="text-sm">
                {item.analysisResult?.hasOptions ? '是' : '否'}
              </TableCell>
              <TableCell className="text-sm">
                {item.analysisResult?.options?.length || 0}
              </TableCell>
              <TableCell className="text-sm max-w-48">
                {item.analysisResult?.options ? (
                  <div className="space-y-1">
                    {item.analysisResult.options.slice(0, 2).map((option, index) => (
                      <div key={index} className="truncate text-xs" title={option}>
                        {option}
                      </div>
                    ))}
                    {item.analysisResult.options.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{item.analysisResult.options.length - 2} 更多...
                      </div>
                    )}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell className="text-sm">
                {item.analysisResult ? (
                  // 检查是否是复合题结构
                  item.analysisResult.text.includes('父题题号') ? 
                    item.analysisResult.text.match(/父题题号[：:]\s*([^\n]+)/)?.[1]?.trim() || '-'
                    : '-'
                ) : '-'}
              </TableCell>
              <TableCell className="text-sm">
                {item.analysisResult ? (
                  // 统计子题数量
                  (item.analysisResult.text.match(/子题/g) || []).length || 
                  (item.analysisResult.text.includes('子题') ? '1+' : '0')
                ) : '0'}
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemoveItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
