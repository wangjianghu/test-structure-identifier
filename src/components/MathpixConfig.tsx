
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MathpixConfigProps {
  isConfigured: boolean;
  onConfigUpdate: (appId: string, appKey: string) => void;
}

export function MathpixConfig({ isConfigured, onConfigUpdate }: MathpixConfigProps) {
  const [appId, setAppId] = useState("");
  const [appKey, setAppKey] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = () => {
    if (!appId.trim() || !appKey.trim()) {
      toast.error("请填写完整的 Mathpix 配置信息");
      return;
    }

    // 保存到 localStorage
    localStorage.setItem('mathpix_app_id', appId.trim());
    localStorage.setItem('mathpix_app_key', appKey.trim());
    
    onConfigUpdate(appId.trim(), appKey.trim());
    setIsExpanded(false);
    
    toast.success("Mathpix 配置已保存", {
      description: "现在可以使用 Mathpix 进行高精度数学公式识别"
    });
  };

  const handleClear = () => {
    localStorage.removeItem('mathpix_app_id');
    localStorage.removeItem('mathpix_app_key');
    setAppId("");
    setAppKey("");
    onConfigUpdate("", "");
    
    toast.success("Mathpix 配置已清除");
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <CardTitle className="text-sm">Mathpix OCR 配置</CardTitle>
            {isConfigured ? (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                已配置
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                未配置
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "收起" : "配置"}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Mathpix 提供更精确的数学公式和科学符号识别能力。
              <a 
                href="https://mathpix.com/ocr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                获取 API 密钥 →
              </a>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">App ID</label>
                <Input
                  placeholder="输入 Mathpix App ID"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">App Key</label>
                <Input
                  type="password"
                  placeholder="输入 Mathpix App Key"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                <Key className="h-4 w-4 mr-2" />
                保存配置
              </Button>
              {isConfigured && (
                <Button variant="outline" onClick={handleClear} size="sm">
                  清除配置
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
