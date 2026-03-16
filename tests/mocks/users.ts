import type { User } from "@domain/user";

export const testAlice: User = { id: 1, name: "Alice", createdAt: 1000000 };
export const testBob: User = { id: 2, name: "Bob", createdAt: 1000000 };
export const testUsers: User[] = [testAlice, testBob];
