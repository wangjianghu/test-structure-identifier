
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface MistralConfigProps {
  className?: string;
}

export function MistralConfig({ className }: MistralConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mistral_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("请输入 Mistral.ai API Key");
      return;
    }

    setIsLoading(true);
    
    try {
      // 简单验证 API Key 格式
      if (!apiKey.startsWith('mistral-') && !apiKey.startsWith('ms-')) {
        toast.error("API Key 格式可能不正确，请检查");
        setIsLoading(false);
        return;
      }

      localStorage.setItem('mistral_api_key', apiKey);
      toast.success("Mistral.ai API Key 保存成功！", {
        description: "现在可以使用 Mistral.ai 进行高精度图片识别了。"
      });
      setIsOpen(false);
    } catch (error) {
      console.error('保存 API Key 失败:', error);
      toast.error("保存失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigured = !!localStorage.getItem('mistral_api_key');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={isConfigured ? "default" : "outline"} 
          size="sm" 
          className={className}
        >
          <Settings className="mr-2 h-4 w-4" />
          配置 Mistral.ai OCR
          {isConfigured && (
            <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
              已配置
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            配置 Mistral.ai OCR 服务
          </DialogTitle>
          <DialogDescription>
            Mistral.ai 提供高精度的图像识别能力，特别适合识别教育材料中的文字和公式。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Mistral.ai API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="输入您的 Mistral.ai API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
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
            <h4 className="text-sm font-medium mb-1">Mistral.ai OCR 优势：</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 高精度识别中文和数学公式</li>
              <li>• 支持复杂的表格和图表识别</li>
              <li>• 优化的教育内容处理能力</li>
              <li>• 更好的手写文字识别效果</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !apiKey.trim()}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "保存中..." : "保存配置"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
