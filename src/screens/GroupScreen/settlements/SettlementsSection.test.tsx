import type { Settlement } from "@domain/settlement";
import type { User } from "@domain/user";
import { render, screen } from "@testing-library/react";
import { testUsers } from "@tests/mocks";
import { describe, expect, test } from "vitest";
import { SettlementsSection } from "./SettlementsSection";

const users: User[] = testUsers;

const settlement: Settlement = {
    id: 1,
    fromMemberId: 2,
    toMemberId: 1,
    amount: 10000,
};

function renderSection(settlements: Settlement[], usersArg: User[] = users) {
    return render(
        <SettlementsSection settlements={settlements} users={usersArg} />,
    );
}

describe("SettlementsSection", () => {
    describe("initial state", () => {
        test("renders Settlements heading", () => {
            renderSection([]);
            expect(screen.getByText("Settlements")).toBeInTheDocument();
        });

        test("renders Add settlement button", () => {
            renderSection([]);
            expect(
                screen.getByRole("button", { name: /add settlement/i }),
            ).toBeInTheDocument();
        });

        test("shows empty state when settlements list is empty", () => {
            renderSection([]);
            expect(screen.getByText(/no settlements yet/i)).toBeInTheDocument();
        });

        test("does not show empty state when settlements exist", () => {
            renderSection([settlement]);
            expect(
                screen.queryByText(/no settlements yet/i),
            ).not.toBeInTheDocument();
        });
    });

    describe("settlement list", () => {
        test("renders from and to names", () => {
            renderSection([settlement]);
            expect(screen.getByText(/bob.*alice/i)).toBeInTheDocument();
        });

        test("renders formatted amount", () => {
            renderSection([settlement]);
            expect(screen.getByText(/100/)).toBeInTheDocument();
        });

        test("renders multiple settlements", () => {
            const settlement2: Settlement = {
                id: 2,
                fromMemberId: 1,
                toMemberId: 2,
                amount: 5000,
            };
            renderSection([settlement, settlement2]);
            const items = screen.getAllByRole("listitem");
            expect(items).toHaveLength(2);
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("falls back to User {id} when fromMemberId has no matching user", () => {
            renderSection([{ ...settlement, fromMemberId: 998 }]);
            expect(screen.getByText(/user 998/i)).toBeInTheDocument();
        });

        test("falls back to User {id} when toMemberId has no matching user", () => {
            renderSection([{ ...settlement, toMemberId: 999 }]);
            expect(screen.getByText(/user 999/i)).toBeInTheDocument();
        });
    });
});
