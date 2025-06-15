
import { OCRResult } from "@/lib/enhancedOCR";
import { EnhancedOCRResult } from "@/lib/enhancedOCRv2";
import { MistralOCRResult } from "@/lib/mistralOCR";
import { AlicloudOCRResult } from "@/lib/alicloudOCR";

interface OCRResultsDisplayProps {
  ocrResults: (OCRResult | EnhancedOCRResult | MistralOCRResult | AlicloudOCRResult)[];
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
          let isEnhancedV2 = false;
          
          if (isOCREnhanced) {
            // 检测是否为增强OCR v2结果
            isEnhancedV2 = 'advancedMetrics' in result;
            
            if (isEnhancedV2) {
              engineName = '增强OCR v2';
            } else {
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
          }
          
          return (
            <div key={index} className="text-xs space-y-1 text-muted-foreground border-l-2 border-blue-200 pl-3">
              <div className="font-medium">图片 {index + 1} ({engineName}):</div>
              <div>OCR 置信度: {result.confidence.toFixed(1)}%</div>
              <div>处理时间: {result.processingTime}ms</div>
              <div>检测学科: {result.classification?.subject || 'unknown'}</div>
              <div>题型: {result.classification?.questionType || 'unknown'}</div>
              <div>分类置信度: {result.classification ? (result.classification.confidence * 100).toFixed(1) : 0}%</div>
              
              {/* 显示增强OCR v2的特殊指标 */}
              {isEnhancedV2 && 'advancedMetrics' in result && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="font-medium text-blue-600">增强算法指标:</div>
                  <div>文字区域检测: {result.advancedMetrics.textRegionsDetected} 个</div>
                  <div>倾斜角度矫正: {result.advancedMetrics.skewAngleCorrected.toFixed(2)}°</div>
                  <div>降噪处理: {result.advancedMetrics.noiseReductionApplied ? '已应用' : '未应用'}</div>
                  <div>二值化方法: {result.advancedMetrics.binarizationMethod}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* 增强算法说明 */}
      {ocrResults.some(result => 'advancedMetrics' in result) && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
          <div className="font-medium text-blue-600 mb-1">增强OCR v2算法优势:</div>
          <ul className="text-blue-600 space-y-0.5">
            <li>• 智能图像预处理：双边滤波、倾斜矫正、Sauvola二值化</li>
            <li>• 多配置并行识别：高精度中文、数学公式优化、混合语言</li>
            <li>• 连通域分析：自动去噪和字符分割优化</li>
            <li>• 智能结果融合：综合置信度和文本质量评分</li>
          </ul>
        </div>
      )}
    </div>
  );
}
