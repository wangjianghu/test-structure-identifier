
import { useAuth } from '@/hooks/useAuth';
import { Auth } from '@/components/Auth';
import { QuestionInput } from '@/components/QuestionInput';
import { AnalysisResult } from '@/components/AnalysisResult';
import { OCRHistory } from '@/components/OCRHistory';
import { UserProfile } from '@/components/UserProfile';
import { MistralConfig } from '@/components/MistralConfig';
import { SubjectAndTypeSelector } from '@/components/SubjectAndTypeSelector';
import { useOCRHistory } from '@/hooks/useOCRHistory';
import { useState } from 'react';
import { ParsedQuestion } from '@/lib/parser';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<ParsedQuestion | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [questionTypeExample, setQuestionTypeExample] = useState<string>('');
  const {
    history,
    addTextToHistory,
    addImageToHistory,
    updateHistoryItemAnalysis,
    clearHistory,
    removeItem,
    exportHistory
  } = useOCRHistory();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show auth component if user is not authenticated
  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  // Main application for authenticated users
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">OCR 题目分析系统</h1>
          </div>
          <div className="flex items-center space-x-4">
            <MistralConfig />
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="container py-6">
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-8rem)]">
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="pr-4 space-y-6">
              <SubjectAndTypeSelector
                selectedSubject={selectedSubject}
                onSubjectChange={setSelectedSubject}
                questionTypeExample={questionTypeExample}
                onQuestionTypeExampleChange={setQuestionTypeExample}
              />
              
              <QuestionInput
                onAnalysisComplete={setAnalysisResult}
                onTextSubmit={(text, result) => 
                  addTextToHistory(text, result, selectedSubject, questionTypeExample)
                }
                onImageSubmit={(file, ocrResult, analysisResult) => 
                  addImageToHistory(file, ocrResult, analysisResult, selectedSubject, questionTypeExample)
                }
                onImageAnalysisUpdate={updateHistoryItemAnalysis}
                selectedSubject={selectedSubject}
                questionTypeExample={questionTypeExample}
              />
              
              {analysisResult && (
                <AnalysisResult result={analysisResult} />
              )}
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="pl-4">
              <OCRHistory
                history={history}
                onRemoveItem={removeItem}
                onExport={exportHistory}
                onClear={clearHistory}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
