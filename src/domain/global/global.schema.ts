import z from "zod";
import { GroupSchema } from "../group";
import { UserSchema } from "../user";

export const GlobalSchema = z
    .object({
        version: z.int().positive(),
        users: z.array(UserSchema),
        groups: z.array(GroupSchema),
    })
    .superRefine((data, ctx) => {
        const userIds = new Set(data.users.map((u) => u.id));

        if (userIds.size !== data.users.length) {
            ctx.addIssue({
                code: "custom",
                message: "Duplicate user IDs in global state",
                path: ["users"],
            });
        }

        const groupIds = data.groups.map((g) => g.id);
        if (new Set(groupIds).size !== groupIds.length) {
            ctx.addIssue({
                code: "custom",
                message: "Duplicate group IDs in global state",
                path: ["groups"],
            });
        }

        data.groups.forEach((group, gi) => {
            group.memberIds.forEach((memberId, mi) => {
                if (!userIds.has(memberId)) {
                    ctx.addIssue({
                        code: "custom",
                        message: `Group[${gi}]: memberId ${memberId} does not exist in global users`,
                        path: ["groups", gi, "memberIds", mi],
                    });
                }
            });
        });
    });

export type Global = z.infer<typeof GlobalSchema>;
