import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: 'identify' } }
    })
  ],
  callbacks: {
    async session(data) {
      console.log('session', data )
      return data
    },
    async jwt(data) {
      console.log('jwt', data)
      const { profile, token, account } = data
      return profile && { ...profile, ...account } || token
    }
  }
});