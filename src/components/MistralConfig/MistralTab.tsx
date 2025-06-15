
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface MistralTabProps {
  mistralApiKey: string;
  showMistralKey: boolean;
  onApiKeyChange: (value: string) => void;
  onToggleVisibility: () => void;
}

export function MistralTab({ 
  mistralApiKey, 
  showMistralKey, 
  onApiKeyChange, 
  onToggleVisibility 
}: MistralTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mistralApiKey">Mistral.ai API Key</Label>
        <div className="relative">
          <Input
            id="mistralApiKey"
            type={showMistralKey ? "text" : "password"}
            placeholder="输入您的 Mistral.ai API Key"
            value={mistralApiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={onToggleVisibility}
          >
            {showMistralKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          在 <a 
            href="https://console.mistral.ai/api-keys/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Mistral.ai 控制台
          </a> 获取您的 API Key
        </p>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
        <h4 className="text-sm font-medium mb-1">Mistral.ai 优势：</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• 高精度识别中文和数学公式</li>
          <li>• 支持复杂的表格和图表识别</li>
          <li>• 优化的教育内容处理能力</li>
          <li>• 更好的手写文字识别效果</li>
        </ul>
      </div>
    </div>
  );
}
