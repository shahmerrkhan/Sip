import { auth, clerkClient } from '@clerk/nextjs/server';

export async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  return email === process.env.ADMIN_EMAIL;
}