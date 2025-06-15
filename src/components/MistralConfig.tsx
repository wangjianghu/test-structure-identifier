
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { ConfigHeader } from './MistralConfig/ConfigHeader';
import { ConfigContent } from './MistralConfig/ConfigContent';

interface MistralConfigProps {
  className?: string;
}

export function MistralConfig({ className }: MistralConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mistralApiKey, setMistralApiKey] = useState('');
  const [alicloudAccessKey, setAlicloudAccessKey] = useState('');
  const [alicloudSecretKey, setAlicloudSecretKey] = useState('');
  const [showMistralKey, setShowMistralKey] = useState(false);
  const [showAlicloudAccess, setShowAlicloudAccess] = useState(false);
  const [showAlicloudSecret, setShowAlicloudSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrEnhancedEnabled, setOcrEnhancedEnabled] = useState(false);

  // 从 localStorage 加载配置
  useEffect(() => {
    setMistralApiKey(localStorage.getItem('mistral_api_key') || '');
    setAlicloudAccessKey(localStorage.getItem('alicloud_access_key') || '');
    setAlicloudSecretKey(localStorage.getItem('alicloud_secret_key') || '');
    setOcrEnhancedEnabled(localStorage.getItem('ocr_enhanced_enabled') === 'true');
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // 保存OCR增强开关状态
      localStorage.setItem('ocr_enhanced_enabled', ocrEnhancedEnabled.toString());

      if (ocrEnhancedEnabled) {
        // 如果开启了OCR增强，检查是否至少配置了一种服务
        if (!mistralApiKey.trim() && (!alicloudAccessKey.trim() || !alicloudSecretKey.trim())) {
          toast.error("开启OCR增强后，请至少配置一种OCR服务");
          setIsLoading(false);
          return;
        }

        // 简化 Mistral API Key 格式验证 - 只检查最基本的长度要求
        if (mistralApiKey.trim() && mistralApiKey.trim().length < 10) {
          toast.error("Mistral API Key 长度过短，请检查");
          setIsLoading(false);
          return;
        }

        // 保存配置到 localStorage
        if (mistralApiKey.trim()) {
          localStorage.setItem('mistral_api_key', mistralApiKey);
        } else {
          localStorage.removeItem('mistral_api_key');
        }
        
        if (alicloudAccessKey.trim() && alicloudSecretKey.trim()) {
          localStorage.setItem('alicloud_access_key', alicloudAccessKey);
          localStorage.setItem('alicloud_secret_key', alicloudSecretKey);
        } else {
          localStorage.removeItem('alicloud_access_key');
          localStorage.removeItem('alicloud_secret_key');
        }

        toast.success("OCR 增强服务配置成功！", {
          description: "配置已保存，现在可以使用高精度图片识别功能了。"
        });
      } else {
        // 如果关闭了OCR增强，清除相关配置（可选）
        toast.success("OCR 增强已关闭", {
          description: "将使用内置OCR引擎进行图片识别。"
        });
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error("保存失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigured = ocrEnhancedEnabled && (
    !!localStorage.getItem('mistral_api_key') || 
    (!!localStorage.getItem('alicloud_access_key') && !!localStorage.getItem('alicloud_secret_key'))
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={isConfigured ? "default" : "outline"} 
          size="sm" 
          className={className}
        >
          <Settings className="mr-2 h-4 w-4" />
          OCR 增强
          {ocrEnhancedEnabled ? (
            isConfigured ? (
              <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                已配置
              </span>
            ) : (
              <span className="ml-2 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                已开启
              </span>
            )
          ) : (
            <span className="ml-2 text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded-full">
              已关闭
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[500px] p-0" 
        side="bottom" 
        align="start"
        sideOffset={4}
      >
        <div className="p-6">
          <ConfigHeader 
            ocrEnhancedEnabled={ocrEnhancedEnabled}
            onToggle={setOcrEnhancedEnabled}
          />
          
          <ConfigContent
            ocrEnhancedEnabled={ocrEnhancedEnabled}
            mistralApiKey={mistralApiKey}
            alicloudAccessKey={alicloudAccessKey}
            alicloudSecretKey={alicloudSecretKey}
            showMistralKey={showMistralKey}
            showAlicloudAccess={showAlicloudAccess}
            showAlicloudSecret={showAlicloudSecret}
            onMistralApiKeyChange={setMistralApiKey}
            onAlicloudAccessKeyChange={setAlicloudAccessKey}
            onAlicloudSecretKeyChange={setAlicloudSecretKey}
            onToggleMistralVisibility={() => setShowMistralKey(!showMistralKey)}
            onToggleAlicloudAccessVisibility={() => setShowAlicloudAccess(!showAlicloudAccess)}
            onToggleAlicloudSecretVisibility={() => setShowAlicloudSecret(!showAlicloudSecret)}
          />
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
