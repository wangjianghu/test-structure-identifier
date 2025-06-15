
import { useState, useCallback } from "react";
import { QuestionInput } from "@/components/QuestionInput";
import { OCRHistory } from "@/components/OCRHistory";
import { UserProfile } from "@/components/UserProfile";
import { ParsedQuestion } from "@/lib/parser";
import { useOCRHistory } from "@/hooks/useOCRHistory";
import { SecureOCRConfig } from "@/components/SecureOCRConfig";

export default function Index() {
  const [analysisResult, setAnalysisResult] = useState<ParsedQuestion | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('数学');
  const [questionTypeExample, setQuestionTypeExample] = useState<string>('');
  const { 
    history, 
    questionTypeExamples,
    addTextToHistory, 
    addImageToHistory, 
    updateHistoryItemAnalysis,
    clearHistory, 
    removeItem,
    exportHistory,
    addToHistory // Legacy method for backward compatibility
  } = useOCRHistory();

  const handleAnalysisComplete = useCallback((result: ParsedQuestion | null) => {
    setAnalysisResult(result);
  }, []);

  const handleTextSubmit = useCallback((text: string, result: ParsedQuestion) => {
    return addTextToHistory(text, result, selectedSubject, questionTypeExample);
  }, [addTextToHistory, selectedSubject, questionTypeExample]);

  const handleImageSubmit = useCallback(async (file: File, ocrResult: any, analysisResult?: ParsedQuestion) => {
    return await addImageToHistory(file, ocrResult, analysisResult, selectedSubject, questionTypeExample);
  }, [addImageToHistory, selectedSubject, questionTypeExample]);

  const handleImageAnalysisUpdate = useCallback((id: string, analysisResult: ParsedQuestion) => {
    updateHistoryItemAnalysis(id, analysisResult);
  }, [updateHistoryItemAnalysis]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  const handleRemoveItem = useCallback((id: string) => {
    removeItem(id);
  }, [removeItem]);

  const handleExportHistory = useCallback(() => {
    exportHistory();
  }, [exportHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              试题智能分析系统
            </h1>
            <nav className="hidden md:flex items-center gap-4">
              <SecureOCRConfig />
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container relative py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Question Input */}
          <div className="flex flex-col gap-4">
            <QuestionInput 
              onAnalysisComplete={handleAnalysisComplete}
              onTextSubmit={handleTextSubmit}
              onImageSubmit={handleImageSubmit}
              onImageAnalysisUpdate={handleImageAnalysisUpdate}
              selectedSubject={selectedSubject}
              questionTypeExample={questionTypeExample}
            />

            {/* Subject and Question Type Selection */}
            <div className="flex items-center gap-4">
              <select
                className="flex h-10 w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="数学">数学</option>
                <option value="物理">物理</option>
                <option value="化学">化学</option>
                <option value="语文">语文</option>
                <option value="英语">英语</option>
                <option value="历史">历史</option>
                <option value="地理">地理</option>
                <option value="政治">政治</option>
                <option value="生物">生物</option>
                <option value="艺术">艺术</option>
                <option value="体育">体育</option>
              </select>

              <input
                type="text"
                placeholder="题型结构示例 (例如: 1. ... A. ... B. ...)"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={questionTypeExample}
                onChange={(e) => setQuestionTypeExample(e.target.value)}
              />
            </div>

            {/* Analysis Result Display */}
            {analysisResult && (
              <div className="rounded-md border border-input bg-background p-4 shadow-sm">
                <h3 className="text-lg font-semibold">分析结果</h3>
                <div className="mt-2 space-y-1">
                  <p>
                    <strong>题目类型:</strong> {analysisResult.questionType}
                  </p>
                  <p>
                    <strong>科目:</strong> {analysisResult.subject}
                  </p>
                  <p>
                    <strong>题目内容:</strong>
                    <br />
                    {analysisResult.body}
                  </p>
                  {analysisResult.options && analysisResult.options.length > 0 && (
                    <>
                      <p>
                        <strong>选项:</strong>
                      </p>
                      <ul className="list-disc pl-5">
                        {analysisResult.options.map((option, index) => (
                          <li key={index}>{option}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* OCR History */}
          <div>
            <OCRHistory 
              history={history} 
              onClearHistory={handleClearHistory}
              onRemoveItem={handleRemoveItem}
              onExportHistory={handleExportHistory}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
