
import { OCRResult } from "@/lib/enhancedOCR";
import { MistralOCRResult } from "@/lib/mistralOCR";
import { AlicloudOCRResult } from "@/lib/alicloudOCR";

interface OCRResultsDisplayProps {
  ocrResults: (OCRResult | MistralOCRResult | AlicloudOCRResult)[];
}

export function OCRResultsDisplay({ ocrResults }: OCRResultsDisplayProps) {
  if (ocrResults.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
      <h3 className="font-semibold mb-2 text-sm">图片 OCR 处理详情</h3>
      <div className="space-y-3">
        {ocrResults.map((result, index) => {
          const isOCREnhanced = localStorage.getItem('ocr_enhanced_enabled') === 'true';
          
          let engineName = '内置OCR';
          
          if (isOCREnhanced) {
            const isMistral = 'classification' in result && 
              result.classification && 
              typeof result.classification === 'object' && 
              !('features' in result.classification);
            
            const isAlicloud = 'classification' in result && 
              result.classification && 
              typeof result.classification === 'object' && 
              'processingTime' in result && 
              !isMistral;
            
            engineName = isMistral ? 'Mistral.ai' : 
                        isAlicloud ? '阿里云 OCR' : 
                        '内置OCR';
          }
          
          return (
            <div key={index} className="text-xs space-y-1 text-muted-foreground border-l-2 border-blue-200 pl-3">
              <div className="font-medium">图片 {index + 1} ({engineName}):</div>
              <div>OCR 置信度: {result.confidence.toFixed(1)}%</div>
              <div>处理时间: {result.processingTime}ms</div>
              <div>检测学科: {result.classification?.subject || 'unknown'}</div>
              <div>题型: {result.classification?.questionType || 'unknown'}</div>
              <div>分类置信度: {result.classification ? (result.classification.confidence * 100).toFixed(1) : 0}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
