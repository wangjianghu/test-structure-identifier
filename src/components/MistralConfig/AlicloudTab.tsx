
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface AlicloudTabProps {
  alicloudAccessKey: string;
  alicloudSecretKey: string;
  showAlicloudAccess: boolean;
  showAlicloudSecret: boolean;
  onAccessKeyChange: (value: string) => void;
  onSecretKeyChange: (value: string) => void;
  onToggleAccessVisibility: () => void;
  onToggleSecretVisibility: () => void;
}

export function AlicloudTab({
  alicloudAccessKey,
  alicloudSecretKey,
  showAlicloudAccess,
  showAlicloudSecret,
  onAccessKeyChange,
  onSecretKeyChange,
  onToggleAccessVisibility,
  onToggleSecretVisibility
}: AlicloudTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="alicloudAccessKey">AccessKey ID</Label>
          <div className="relative">
            <Input
              id="alicloudAccessKey"
              type={showAlicloudAccess ? "text" : "password"}
              placeholder="输入阿里云 AccessKey ID"
              value={alicloudAccessKey}
              onChange={(e) => onAccessKeyChange(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={onToggleAccessVisibility}
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
              onChange={(e) => onSecretKeyChange(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={onToggleSecretVisibility}
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
    </div>
  );
}
