
import React from 'react';
import { Settings } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

interface ConfigHeaderProps {
  ocrEnhancedEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ConfigHeader({ ocrEnhancedEnabled, onToggle }: ConfigHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          配置 OCR 增强服务
        </h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          配置高精度的图像识别服务，提升试题识别准确率。支持 Mistral.ai 和阿里云 OCR。
        </p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        <Switch
          checked={ocrEnhancedEnabled}
          onCheckedChange={onToggle}
        />
      </div>
    </div>
  );
}
