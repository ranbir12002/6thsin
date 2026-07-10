import { useState } from 'react';
import { useSiteData } from '../store/SiteDataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import { KeyRound, Mail, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useSiteData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Successfully logged in');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-crimson/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-crimson/5 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md bg-[#0a0a0a]/80 border-[#1a1a1a] backdrop-blur-md relative z-10">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-crimson/10 flex items-center justify-center border border-crimson/20">
              <KeyRound className="h-6 w-6 text-crimson" />
            </div>
          </div>
          <CardTitle className="font-anton text-3xl tracking-wider text-[#F6F6F6] uppercase">
            6TH SIN ADMIN
          </CardTitle>
          <CardDescription className="text-xs text-[rgba(246,246,246,0.4)] uppercase tracking-[0.1em]">
            Enter your credentials to access the console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[rgba(246,246,246,0.7)] text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[rgba(246,246,246,0.3)]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@6thsin.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0f0f0f] border-[#222] text-[#F6F6F6] pl-10 focus-visible:ring-crimson focus-visible:border-crimson"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[rgba(246,246,246,0.7)] text-sm font-medium">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[rgba(246,246,246,0.3)]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0f0f0f] border-[#222] text-[#F6F6F6] pl-10 focus-visible:ring-crimson focus-visible:border-crimson"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-crimson hover:bg-crimson/90 text-white font-medium py-2 mt-2 uppercase tracking-wider transition-all duration-300"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
