import type { Group } from "@domain/group";

export const baseGroup: Group = {
    id: 1,
    name: "Test Group",
    memberIds: [1, 2, 3],
    expenses: [],
    settlements: [],
};
