import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validations';

export const authOptions: NextAuthOptions = {
  // ✅ ADDED: Required for production on Vercel
  trustHost: true,

  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 }, // 24h

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // ✅ ADDED: Secure cookies for production
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.branchId = token.branchId;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};