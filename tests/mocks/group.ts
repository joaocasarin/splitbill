import type { Group } from "@domain/group";

export const baseGroup: Group = {
    id: 1,
    name: "Test Group",
    createdAt: 1000000,
    members: [
        { id: 1, name: "Alice", createdAt: 1000000 },
        { id: 2, name: "Bob", createdAt: 1000000 },
        { id: 3, name: "Carol", createdAt: 1000000 },
    ],
    expenses: [],
    settlements: [],
};
