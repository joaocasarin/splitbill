import type { Member } from "@domain/member";

export const testAlice: Member = { id: 1, name: "Alice", createdAt: 1000000 };
export const testBob: Member = { id: 2, name: "Bob", createdAt: 1000000 };
export const testUsers: Member[] = [testAlice, testBob];
