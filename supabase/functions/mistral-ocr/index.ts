
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MistralOCRRequest {
  imageBase64: string;
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MISTRAL_API_KEY');
    if (!apiKey) {
      console.error('MISTRAL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Mistral API not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { imageBase64, fileName }: MistralOCRRequest = await req.json();

    // Validate input
    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid image data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate file size (max 10MB)
    const imageSizeBytes = (imageBase64.length * 3) / 4;
    if (imageSizeBytes > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Image too large (max 10MB)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing OCR for file: ${fileName}`);

    const startTime = Date.now();
    
    // Call Mistral API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请准确识别这张图片中的所有文字内容，包括题目、选项、公式等。保持原有的格式和结构，特别注意数学符号和中文字符的准确性。如果有题号，请保留题号格式。如果有选项（A、B、C、D等），请按行分别列出。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mistral API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: 'OCR processing failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    if (!text.trim()) {
      return new Response(
        JSON.stringify({ error: 'No text detected in image' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const processingTime = Date.now() - startTime;
    
    // Basic confidence calculation
    let confidence = 50;
    if (text.length > 20) confidence += 20;
    if (text.length > 50) confidence += 10;
    
    const educationKeywords = ['题', '选择', '计算', '求解', '分析', '根据', '下列', '关于'];
    const foundKeywords = educationKeywords.filter(keyword => text.includes(keyword));
    confidence += foundKeywords.length * 2;
    
    if (/[A-D][.．]/g.test(text)) confidence += 10;
    if (/[×÷±≤≥∞∑∫√]/g.test(text)) confidence += 5;
    
    confidence = Math.min(confidence, 95);

    // Basic classification
    const isQuestion = foundKeywords.length > 0 || /[A-D][.．]/g.test(text);
    
    console.log(`OCR completed in ${processingTime}ms, confidence: ${confidence}%`);

    return new Response(
      JSON.stringify({
        text: text.trim(),
        confidence,
        classification: {
          isQuestion,
          questionType: isQuestion ? '问答题' : '文本',
          subject: '未分类',
          confidence: confidence / 100,
          features: foundKeywords
        },
        preprocessingSteps: [
          "接收图像数据",
          "调用 Mistral.ai 视觉模型",
          "文本识别完成",
          "内容分类完成"
        ],
        processingTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in mistral-ocr function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
