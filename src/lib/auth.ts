import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validations';

// Get the base URL for the application
const getBaseUrl = () => {
  // Production: use NEXTAUTH_URL first, then fall back to VERCEL_URL
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Development fallback
  return 'http://localhost:3000';
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

  // ✅ FIXED: Proper cookie configuration for production domains (Vercel)
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Dynamically set domain for production Vercel deployments
        ...(process.env.NODE_ENV === 'production' && {
          domain: getCookieDomain(),
        }),
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        ...(process.env.NODE_ENV === 'production' && {
          domain: getCookieDomain(),
        }),
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        ...(process.env.NODE_ENV === 'production' && {
          domain: getCookieDomain(),
        }),
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
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();

        const user = await User.findOne({ email: parsed.data.email, isActive: true });
        if (!user) return null;

        if (user.lockUntil && user.lockUntil > new Date()) {
          throw new Error('Account locked. Try again in 15 minutes');
        }

        const isValid = await user.comparePassword(parsed.data.password);
        
        if (!isValid) {
          user.loginAttempts += 1;
          if (user.loginAttempts >= 5) {
            user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          }
          await user.save();
          return null;
        }

        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId?.toString(),
        };
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
