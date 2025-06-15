
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlicloudOCRRequest {
  imageBase64: string;
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessKeyId = Deno.env.get('ALICLOUD_ACCESS_KEY');
    const accessKeySecret = Deno.env.get('ALICLOUD_SECRET_KEY');
    
    if (!accessKeyId || !accessKeySecret) {
      console.error('Alicloud credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Alicloud OCR not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { imageBase64, fileName }: AlicloudOCRRequest = await req.json();

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
    
    // Note: This is a simplified implementation
    // In production, you would implement proper Alicloud API signing and calls
    // For now, we'll return a mock response indicating the service needs backend implementation
    
    const processingTime = Date.now() - startTime;
    
    // Mock OCR result with security message
    const mockText = "注意：阿里云OCR需要在后端实现完整的API签名机制。当前为安全演示版本。";
    
    console.log(`OCR completed in ${processingTime}ms (mock implementation)`);

    return new Response(
      JSON.stringify({
        text: mockText,
        confidence: 75,
        classification: {
          isQuestion: false,
          questionType: '文本',
          subject: '系统',
          confidence: 0.75,
          features: ['系统', '安全']
        },
        preprocessingSteps: [
          "接收图像数据",
          "验证阿里云凭据",
          "安全处理完成（需要完整后端实现）"
        ],
        processingTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in alicloud-ocr function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
