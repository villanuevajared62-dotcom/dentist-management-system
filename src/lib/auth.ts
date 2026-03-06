import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validations';

// Get the base URL for the application
const getBaseUrl = () => {
  // If explicitly set, use it
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  
  // For Vercel deployments
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  
  // Development: detect from request headers or use default
  // This handles different ports (3000, 3001, etc.)
  return process.env.NODE_ENV === 'production' 
    ? 'http://localhost:3000' 
    : `http://localhost:${process.env.PORT || 3000}`;
};

// Get the cookie domain for production
const getCookieDomain = () => {
  if (process.env.NODE_ENV !== 'production') return undefined;
  
  // If explicitly set, use it
  if (process.env.NEXTAUTH_COOKIE_DOMAIN) return process.env.NEXTAUTH_COOKIE_DOMAIN;
  
  // For Vercel deployments, extract domain from VERCEL_URL
  if (process.env.VERCEL_URL) {
    // e.g., dentist-management-system.vercel.app -> .vercel.app
    const vercelUrl = process.env.VERCEL_URL;
    const domainParts = vercelUrl.split('.');
    // Get the last two parts (e.g., .vercel.app)
    if (domainParts.length >= 2) {
      return `.${domainParts.slice(-2).join('.')}`;
    }
    return `.${vercelUrl}`;
  }
  
  return undefined;
};

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 }, // 24h

  pages: {
    signIn: '/login',
    error: '/login',
  },

// Cookie configuration - use defaults for Vercel
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60,
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60,
      },
    },
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate input
          if (!credentials?.email || !credentials?.password) {
            console.error('[Auth] Missing email or password');
            return null;
          }

          const parsed = LoginSchema.safeParse(credentials);
          if (!parsed.success) {
            console.error('[Auth] Validation failed:', parsed.error.flatten());
            return null;
          }

          await connectDB();

          const user = await User.findOne({ email: parsed.data.email });
          if (!user) {
            console.error('[Auth] User not found:', parsed.data.email);
            return null;
          }

          if (!user.isActive) {
            console.error('[Auth] User inactive:', parsed.data.email);
            return null;
          }

          if (user.lockUntil && user.lockUntil > new Date()) {
            console.error('[Auth] Account locked:', parsed.data.email);
            throw new Error('Account locked. Try again in 15 minutes');
          }

          const isValid = await user.comparePassword(parsed.data.password);
          
          if (!isValid) {
            console.error('[Auth] Invalid password for:', parsed.data.email);
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
              user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            await user.save();
            return null;
          }

          // Reset failed attempts on successful login
          user.loginAttempts = 0;
          user.lockUntil = undefined;
          await user.save();

          console.log('[Auth] Login successful:', parsed.data.email, 'Role:', user.role);

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            branchId: user.branchId?.toString(),
          };
        } catch (error) {
          console.error('[Auth] Authorize error:', error);
          // Re-throw errors so NextAuth can handle them
          if (error instanceof Error) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as 'admin' | 'staff' | 'dentist';
        token.branchId = user.branchId;
      }
      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'staff' | 'dentist';
        session.user.branchId = token.branchId as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
