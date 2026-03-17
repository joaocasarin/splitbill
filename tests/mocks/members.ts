import type { Member } from "@domain/member";

export const testMemberAlice: Member = {
    id: 1,
    name: "Alice",
    createdAt: 1000000,
};
export const testMemberBob: Member = { id: 2, name: "Bob", createdAt: 1000000 };
export const testMembers: Member[] = [testMemberAlice, testMemberBob];
