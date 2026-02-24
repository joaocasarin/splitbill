import { useAppStore } from "@store";
import { beforeEach, describe, test } from "vitest";

beforeEach(() => {
    useAppStore.getState().initEmpty();
});

describe("hydrateFromUrl", () => {
    test("sets status to empty when no ?state= param");
    test("sets status to loaded with parsed global when valid state");
    test("sets status to error when state is invalid JSON");
    test("sets status to error when state fails schema validation");
    test("initializes createId counters from loaded state");
});

describe("initEmpty", () => {
    test("resets status to empty");
    test("resets global to empty state");
});

describe("addUser", () => {
    test("adds user to global.users");
    test("assigns sequential IDs");
    test("sets status to loaded");
});

describe("addGroup", () => {
    test("adds group to global.groups");
    test("assigns sequential IDs");
    test("preserves memberIds order");
});

describe("addExpense", () => {
    test("adds expense to correct group");
    test("does not affect other groups");
    test("assigns sequential IDs");
});

describe("addSettlement", () => {
    test("adds settlement to correct group");
    test("does not affect other groups");
    test("assigns sequential IDs");
});
