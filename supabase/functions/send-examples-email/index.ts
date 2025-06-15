
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  recipient?: string;
  includeLastDays?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { recipient = "dijiuxiaoshi@foxmail.com", includeLastDays = 7 }: EmailRequest = 
      req.method === "POST" ? await req.json() : {};

    console.log(`获取最近 ${includeLastDays} 天的题型示例数据`);

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - includeLastDays);

    // 从数据库获取题型示例数据
    const { data: examples, error } = await supabase
      .from('question_type_examples')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取数据时出错:', error);
      throw error;
    }

    console.log(`找到 ${examples?.length || 0} 条题型示例记录`);

    if (!examples || examples.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `最近 ${includeLastDays} 天没有新的题型示例数据` 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 生成邮件内容
    const emailContent = generateEmailContent(examples, includeLastDays);
    
    // 这里可以集成实际的邮件服务，比如 Resend
    // 目前返回生成的邮件内容用于测试
    console.log('生成的邮件内容:', emailContent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `已准备发送 ${examples.length} 条题型示例记录的邮件`,
        emailContent,
        recipient,
        examplesCount: examples.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("发送邮件时出错:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailContent(examples: any[], days: number): string {
  const now = new Date();
  const summary = examples.reduce((acc, example) => {
    const key = `${example.subject}-${example.question_type}`;
    if (!acc[key]) {
      acc[key] = {
        subject: example.subject,
        questionType: example.question_type,
        count: 0,
        totalUsage: 0,
        examples: []
      };
    }
    acc[key].count += 1;
    acc[key].totalUsage += example.usage_count;
    acc[key].examples.push(example.structure_example);
    return acc;
  }, {} as any);

  let emailBody = `题型结构示例收集报告\n`;
  emailBody += `报告时间：${now.toLocaleString('zh-CN')}\n`;
  emailBody += `统计周期：最近 ${days} 天\n`;
  emailBody += `总计记录：${examples.length} 条\n\n`;

  emailBody += `=== 按学科和题型分类统计 ===\n\n`;

  Object.values(summary).forEach((item: any) => {
    emailBody += `【${item.subject} - ${item.questionType}】\n`;
    emailBody += `记录数量：${item.count} 条\n`;
    emailBody += `总使用次数：${item.totalUsage} 次\n`;
    emailBody += `示例内容：\n`;
    item.examples.forEach((example: string, index: number) => {
      emailBody += `  ${index + 1}. ${example}\n`;
    });
    emailBody += `\n`;
  });

  emailBody += `=== 详细记录 ===\n\n`;

  examples.forEach((example, index) => {
    emailBody += `记录 ${index + 1}：\n`;
    emailBody += `学科：${example.subject}\n`;
    emailBody += `题型：${example.question_type}\n`;
    emailBody += `示例：${example.structure_example}\n`;
    emailBody += `使用次数：${example.usage_count}\n`;
    emailBody += `创建时间：${new Date(example.created_at).toLocaleString('zh-CN')}\n`;
    emailBody += `最后使用：${new Date(example.last_used_at).toLocaleString('zh-CN')}\n`;
    emailBody += `---\n\n`;
  });

  return emailBody;
}

serve(handler);
