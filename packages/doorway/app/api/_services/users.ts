import { eq } from 'drizzle-orm';

import { db } from '../_db';
import { users, type User, type NewUser } from '../_db/schema';

export async function storeUser({
  email,
  subOrganizationId,
}: NewUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ email, subOrganizationId })
    .returning();

  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

export type { User, NewUser };
