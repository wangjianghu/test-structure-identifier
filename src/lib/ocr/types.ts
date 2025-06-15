
export interface EnhancedOCRv4Result {
  text: string;
  confidence: number;
  classification: any;
  preprocessingSteps: string[];
  processingTime: number;
  advancedMetrics: {
    textRegionsDetected: number;
    mathSymbolsDetected: number;
    fractionLinesDetected: number;
    bracketsDetected: number;
    chineseCharactersDetected: number;
    skewAngleCorrected: number;
    noiseReductionApplied: boolean;
    binarizationMethod: string;
    layoutAnalysisScore: number;
    transformerConfidence: number;
    multiModalScore: number;
  };
  algorithmUsed: string;
  detectionResults: {
    textBlocks: Array<{
      bbox: [number, number, number, number];
      text: string;
      confidence: number;
      type: 'text' | 'formula' | 'diagram';
    }>;
    layoutStructure: {
      questionNumber?: string;
      options?: string[];
      mainContent: string;
      formulas: string[];
    };
  };
}

export interface TesseractConfig {
  name: string;
  languages: string[];
  psm: any;
  oem: any;
  dpi: string;
  params: Record<string, string>;
}

export interface RecognitionResult {
  text: string;
  confidence: number;
  config: string;
}

export interface FusionResult {
  text: string;
  confidence: number;
  metrics: any;
  textBlocks: any[];
  layoutStructure: any;
}
