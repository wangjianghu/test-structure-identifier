
import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings, Shield, Server } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SecureOCRConfigProps {
  className?: string;
}

export function SecureOCRConfig({ className }: SecureOCRConfigProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className={className}
        >
          <Shield className="mr-2 h-4 w-4" />
          安全 OCR
          <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
            已启用
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[400px] p-0" 
        side="bottom" 
        align="start"
        sideOffset={4}
      >
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                安全 OCR 服务
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                API 密钥安全存储在服务器端，确保您的凭据不会暴露在客户端。
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Server className="h-4 w-4" />
                安全优势：
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• API 密钥安全存储在服务器环境变量中</li>
                <li>• 客户端不再存储或传输敏感凭据</li>
                <li>• 内置文件类型和大小验证</li>
                <li>• 服务器端错误处理和日志记录</li>
                <li>• 防止 API 密钥泄露和滥用</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-1">配置说明：</h4>
              <p className="text-xs text-muted-foreground">
                OCR 服务现在通过安全的服务器端点处理。管理员需要在 Supabase 项目设置中配置相应的环境变量：
                <br />
                • <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">MISTRAL_API_KEY</code>
                <br />
                • <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">ALICLOUD_ACCESS_KEY</code>
                <br />
                • <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">ALICLOUD_SECRET_KEY</code>
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
