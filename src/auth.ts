import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

if (!process.env.AUTH_SECRET) {
  throw new Error(
    'AUTH_SECRET environment variable is required. ' +
      'Generate one with `openssl rand -base64 32` and set it before starting the server.'
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Instant Demo Credentials Provider for friction-free login
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@railgaadi.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Accept demo login or any valid email
        if (credentials?.email && typeof credentials.email === 'string') {
          const emailStr = credentials.email;
          return {
            id: 'usr_demo_123',
            name: emailStr.split('@')[0] || 'Rail Passenger',
            email: emailStr,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emailStr)}`,
          };
        }
        return null;
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
