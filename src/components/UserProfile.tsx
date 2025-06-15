
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

export function UserProfile() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已退出登录');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error('退出登录失败');
    }
  };

  if (!user) return null;

  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt="用户头像" />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || '用户'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
