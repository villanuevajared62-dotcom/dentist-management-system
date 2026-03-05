import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validations';

export const authOptions: NextAuthOptions = {
  // Use JWT sessions (no DB session table needed)
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 }, // 24h

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input shape
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();

        const user = await User.findOne({ email: parsed.data.email, isActive: true });
        if (!user) return null;

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > new Date()) {
          throw new Error('Account locked. Try again in 15 minutes');
        }

        const isValid = await user.comparePassword(parsed.data.password);
        
        if (!isValid) {
          // Increment login attempts
          user.loginAttempts += 1;
          
          // Lock account after 5 failed attempts
          if (user.loginAttempts >= 5) {
            user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          }
          
          await user.save();
          return null;
        }

        // Successful login - reset login attempts and clear lock
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
    // Persist role and id into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
      }
      return token;
    },
    // Expose token fields on the session object
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
