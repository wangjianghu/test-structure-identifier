
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MistralConfigProps {
  className?: string;
}

export function MistralConfig({ className }: MistralConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mistralApiKey, setMistralApiKey] = useState(() => localStorage.getItem('mistral_api_key') || '');
  const [alicloudAccessKey, setAlicloudAccessKey] = useState(() => localStorage.getItem('alicloud_access_key') || '');
  const [alicloudSecretKey, setAlicloudSecretKey] = useState(() => localStorage.getItem('alicloud_secret_key') || '');
  const [showMistralKey, setShowMistralKey] = useState(false);
  const [showAlicloudAccess, setShowAlicloudAccess] = useState(false);
  const [showAlicloudSecret, setShowAlicloudSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!mistralApiKey.trim() && (!alicloudAccessKey.trim() || !alicloudSecretKey.trim())) {
      toast.error("请至少配置一种 OCR 服务");
      return;
    }

    setIsLoading(true);
    
    try {
      // 验证 Mistral API Key 格式
      if (mistralApiKey.trim() && !mistralApiKey.startsWith('mistral-') && !mistralApiKey.startsWith('ms-')) {
        toast.error("Mistral API Key 格式可能不正确，请检查");
        setIsLoading(false);
        return;
      }

      // 保存配置
      if (mistralApiKey.trim()) {
        localStorage.setItem('mistral_api_key', mistralApiKey);
      }
      
      if (alicloudAccessKey.trim() && alicloudSecretKey.trim()) {
        localStorage.setItem('alicloud_access_key', alicloudAccessKey);
        localStorage.setItem('alicloud_secret_key', alicloudSecretKey);
      }

      toast.success("OCR 增强服务配置成功！", {
        description: "现在可以使用高精度图片识别功能了。"
      });
      setIsOpen(false);
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error("保存失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigured = !!localStorage.getItem('mistral_api_key') || 
                      (!!localStorage.getItem('alicloud_access_key') && !!localStorage.getItem('alicloud_secret_key'));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={isConfigured ? "default" : "outline"} 
          size="sm" 
          className={className}
        >
          <Settings className="mr-2 h-4 w-4" />
          OCR 增强
          {isConfigured && (
            <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
              已配置
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            配置 OCR 增强服务
          </DialogTitle>
          <DialogDescription>
            配置高精度的图像识别服务，提升试题识别准确率。支持 Mistral.ai 和阿里云 OCR。
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="mistral" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mistral">Mistral.ai</TabsTrigger>
            <TabsTrigger value="alicloud">阿里云 OCR</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mistral" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mistralApiKey">Mistral.ai API Key</Label>
              <div className="relative">
                <Input
                  id="mistralApiKey"
                  type={showMistralKey ? "text" : "password"}
                  placeholder="输入您的 Mistral.ai API Key"
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowMistralKey(!showMistralKey)}
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
          </TabsContent>
          
          <TabsContent value="alicloud" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alicloudAccessKey">AccessKey ID</Label>
                <div className="relative">
                  <Input
                    id="alicloudAccessKey"
                    type={showAlicloudAccess ? "text" : "password"}
                    placeholder="输入阿里云 AccessKey ID"
                    value={alicloudAccessKey}
                    onChange={(e) => setAlicloudAccessKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowAlicloudAccess(!showAlicloudAccess)}
                  >
                    {showAlicloudAccess ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alicloudSecretKey">AccessKey Secret</Label>
                <div className="relative">
                  <Input
                    id="alicloudSecretKey"
                    type={showAlicloudSecret ? "text" : "password"}
                    placeholder="输入阿里云 AccessKey Secret"
                    value={alicloudSecretKey}
                    onChange={(e) => setAlicloudSecretKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowAlicloudSecret(!showAlicloudSecret)}
                  >
                    {showAlicloudSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                在 <a 
                  href="https://ram.console.aliyun.com/manage/ak" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  阿里云访问控制台
                </a> 获取您的 AccessKey
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-1">阿里云 OCR 优势：</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 专业的中文文字识别能力</li>
                <li>• 支持印刷体和手写体识别</li>
                <li>• 高准确率的表格和版面分析</li>
                <li>• 稳定可靠的云端服务</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || (!mistralApiKey.trim() && (!alicloudAccessKey.trim() || !alicloudSecretKey.trim()))}
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
