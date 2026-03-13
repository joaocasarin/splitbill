import type { Group } from "@domain/group";

export const baseGroup: Group = {
    id: 1,
    name: "Test Group",
    createdAt: 1000000,
    memberIds: [1, 2, 3],
    expenses: [],
    settlements: [],
};
