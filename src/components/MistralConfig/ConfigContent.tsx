
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PowerOff } from "lucide-react";
import { MistralTab } from './MistralTab';
import { AlicloudTab } from './AlicloudTab';

interface ConfigContentProps {
  ocrEnhancedEnabled: boolean;
  mistralApiKey: string;
  alicloudAccessKey: string;
  alicloudSecretKey: string;
  showMistralKey: boolean;
  showAlicloudAccess: boolean;
  showAlicloudSecret: boolean;
  onMistralApiKeyChange: (value: string) => void;
  onAlicloudAccessKeyChange: (value: string) => void;
  onAlicloudSecretKeyChange: (value: string) => void;
  onToggleMistralVisibility: () => void;
  onToggleAlicloudAccessVisibility: () => void;
  onToggleAlicloudSecretVisibility: () => void;
}

export function ConfigContent({
  ocrEnhancedEnabled,
  mistralApiKey,
  alicloudAccessKey,
  alicloudSecretKey,
  showMistralKey,
  showAlicloudAccess,
  showAlicloudSecret,
  onMistralApiKeyChange,
  onAlicloudAccessKeyChange,
  onAlicloudSecretKeyChange,
  onToggleMistralVisibility,
  onToggleAlicloudAccessVisibility,
  onToggleAlicloudSecretVisibility
}: ConfigContentProps) {
  if (!ocrEnhancedEnabled) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg text-center">
        <PowerOff className="h-8 w-8 text-gray-500 mx-auto mb-2" />
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OCR 增强已关闭</h4>
        <p className="text-xs text-muted-foreground">
          将使用内置OCR引擎进行图片识别，开启OCR增强可获得更高的识别精度。
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="mistral" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="mistral">Mistral.ai</TabsTrigger>
        <TabsTrigger value="alicloud">阿里云 OCR</TabsTrigger>
      </TabsList>
      
      <TabsContent value="mistral" className="space-y-4">
        <MistralTab
          mistralApiKey={mistralApiKey}
          showMistralKey={showMistralKey}
          onApiKeyChange={onMistralApiKeyChange}
          onToggleVisibility={onToggleMistralVisibility}
        />
      </TabsContent>
      
      <TabsContent value="alicloud" className="space-y-4">
        <AlicloudTab
          alicloudAccessKey={alicloudAccessKey}
          alicloudSecretKey={alicloudSecretKey}
          showAlicloudAccess={showAlicloudAccess}
          showAlicloudSecret={showAlicloudSecret}
          onAccessKeyChange={onAlicloudAccessKeyChange}
          onSecretKeyChange={onAlicloudSecretKeyChange}
          onToggleAccessVisibility={onToggleAlicloudAccessVisibility}
          onToggleSecretVisibility={onToggleAlicloudSecretVisibility}
        />
      </TabsContent>
    </Tabs>
  );
}
