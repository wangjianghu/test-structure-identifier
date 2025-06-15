
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('邮箱或密码错误，请检查后重试');
        } else if (error.message.includes('Email not confirmed')) {
          setError('请先验证您的邮箱地址');
        } else {
          setError(error.message);
        }
        return;
      }

      toast.success('登录成功');
      onAuthSuccess();
    } catch (error) {
      console.error('Login error:', error);
      setError('登录过程中发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupData.fullName,
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('该邮箱已被注册，请使用其他邮箱或尝试登录');
        } else if (error.message.includes('Password should be at least')) {
          setError('密码长度至少为6位');
        } else {
          setError(error.message);
        }
        return;
      }

      toast.success('注册成功！请检查您的邮箱进行验证');
      setActiveTab('login');
    } catch (error) {
      console.error('Signup error:', error);
      setError('注册过程中发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">OCR 分析系统</CardTitle>
          <CardDescription>登录或注册以开始使用</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="请输入密码"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  登录
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">姓名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="请输入姓名"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="密码至少6位"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  注册
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
