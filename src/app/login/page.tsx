'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Train, ArrowRight, ShieldCheck, Mail, Lock, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  AuroraBackground,
  Button,
  Eyebrow,
  GridPattern,
  NoiseOverlay,
  ScrollProgress,
} from '@/components/ui';
import { SPRING } from '@/lib/motion';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('demo@railgaadi.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid credentials. Try using the Instant Demo button below.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await signIn('credentials', {
        email: 'passenger@railgaadi.com',
        password: 'demopassword',
        callbackUrl,
      });
    } catch {
      setError('Demo authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative">
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 relative overflow-hidden flex items-center justify-center px-4 py-12 sm:py-16">
        <AuroraBackground intensity={0.7} />
        <GridPattern className="opacity-[0.4]" />
        <NoiseOverlay />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={SPRING.soft}
          className="card-premium relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              transition={SPRING.snappy}
              className="accent-gradient mx-auto grid h-13 w-13 place-items-center rounded-2xl text-white shadow-[0_10px_30px_var(--accent-glow)]"
            >
              <Train className="h-6 w-6" strokeWidth={2.4} />
            </motion.div>

            <Eyebrow icon={<Sparkles className="h-3 w-3" />}>Access Portal</Eyebrow>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
              Welcome to <span className="text-gradient">RailGaadi</span>
            </h1>
            <p className="text-xs text-text-secondary">
              Sign in to unlock full GPS live tracking, route geometry & personal alerts
            </p>
          </div>

          {/* Quick Demo Access Box */}
          <div className="rounded-2xl border border-accent/30 bg-accent-light/60 p-4 space-y-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-accent">
              <ShieldCheck className="w-4 h-4" />
              <span>Instant Access Demo</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
              Explore all live features with 1-click test credentials (no setup required).
            </p>
            <Button
              variant="ghost"
              size="md"
              onClick={handleDemoLogin}
              disabled={loading}
              aria-label="Launch 1-Click Demo Journey"
              className="w-full bg-accent hover:bg-accent-hover hover:text-white text-white shadow-md"
            >
              <span>Launch 1-Click Demo Journey</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <span className="relative px-3 bg-surface text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Or credentials sign in
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="demo@railgaadi.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-xs outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-xs outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              type="submit"
              disabled={loading}
              className="w-full mt-2 text-text-inverse"
            >
              {loading ? 'Authenticating…' : 'Sign In with Credentials'}
            </Button>
          </form>

          {/* Social OAuth Buttons */}
          <div className="pt-3 border-t border-border-light space-y-2">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              aria-label="Sign in with Google"
              className="w-full border-border hover:bg-surface-alt hover:text-text-primary"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.32 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.68 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => signIn('github', { callbackUrl })}
              aria-label="Sign in with GitHub"
              className="w-full border-border hover:bg-surface-alt hover:text-text-primary"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
