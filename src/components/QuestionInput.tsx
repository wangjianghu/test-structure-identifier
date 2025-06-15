
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Search, Trash2, Loader2, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useOCR } from "@/hooks/useOCR";
import { useOCRHistory } from "@/hooks/useOCRHistory";
import { SubjectAndTypeSelector } from "./SubjectAndTypeSelector";
import { ImageViewDialog } from "./ImageViewDialog";

export function QuestionInput() {
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);
  const [structureExample, setStructureExample] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { analyzeText, analyzeImage } = useOCR();
  const { addTextToHistory, addImageToHistory } = useOCRHistory();

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      if (inputMode === 'text') {
        if (!inputText.trim()) {
          toast({
            title: "请输入试题内容",
            description: "请在文本框中输入您要分析的试题内容。",
          });
          return;
        }

        const analysisResult = await analyzeText(inputText);
        if (analysisResult) {
          addTextToHistory(inputText, analysisResult, selectedSubject, structureExample);
          toast({
            title: "文本分析完成",
            description: "我们已经成功分析了您输入的文本。",
          });
        } else {
          toast({
            title: "文本分析失败",
            description: "未能成功分析您输入的文本，请检查输入或稍后重试。",
            variant: "destructive",
          });
        }
      } else {
        if (selectedFiles.length === 0) {
          toast({
            title: "请选择图片",
            description: "请选择包含试题内容的图片文件。",
          });
          return;
        }

        for (const file of selectedFiles) {
          const historyItem = await addImageToHistory(file, {
            text: '正在识别...',
            confidence: 0,
            classification: {
              isQuestion: false,
              confidence: 0,
              questionType: 'unknown',
              subject: 'unknown',
              features: {
                hasQuestionNumber: false,
                hasOptions: false,
                hasMathSymbols: false,
                hasQuestionWords: false,
                textLength: 0,
              }
            },
            preprocessingSteps: [],
            processingTime: 0
          }, undefined, selectedSubject, structureExample);

          const analysisResult = await analyzeImage(file);
          if (analysisResult) {
            addImageToHistory(file, analysisResult.ocrResult, analysisResult.parsedQuestion, selectedSubject, structureExample);
            toast({
              title: `${file.name} 分析完成`,
              description: `我们已经成功分析了您选择的图片 ${file.name}。`,
            });
          } else {
            toast({
              title: `${file.name} 分析失败`,
              description: `未能成功分析您选择的图片 ${file.name}，请检查图片或稍后重试。`,
              variant: "destructive",
            });
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>试题分析</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <SubjectAndTypeSelector
            selectedSubject={selectedSubject}
            onSubjectChange={setSelectedSubject}
            structureExample={structureExample}
            onStructureExampleChange={setStructureExample}
          />
          
          <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'text' | 'image')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">文本输入</TabsTrigger>
              <TabsTrigger value="image">图片输入</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              <Textarea
                placeholder="请输入试题内容..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[120px]"
              />
            </TabsContent>
            
            <TabsContent value="image" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  选择图片
                </Button>
                <p className="text-sm text-muted-foreground">
                  支持 JPG、PNG、WebP 格式，可选择多张图片
                </p>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">已选择 {selectedFiles.length} 张图片:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative w-20 h-20 group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`预览 ${index + 1}`}
                          className="w-full h-full object-cover rounded border"
                        />
                        
                        {/* 删除按钮 - 右上角 */}
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="删除图片"
                        >
                          ×
                        </button>
                        
                        {/* 预览按钮 - 中央 */}
                        <ImageViewDialog 
                          imageUrl={URL.createObjectURL(file)} 
                          fileName={file.name}
                        >
                          <button
                            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded opacity-0 group-hover:opacity-100"
                            title="查看大图"
                          >
                            <Eye className="h-4 w-4 text-white" />
                          </button>
                        </ImageViewDialog>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex gap-4">
          <Button 
            onClick={handleAnalyze} 
            disabled={isLoading || (!inputText.trim() && selectedFiles.length === 0)}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                开始分析
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            清空
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
