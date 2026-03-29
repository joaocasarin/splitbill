import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ImportDropZone } from "./ImportDropZone";

const mockImportGlobal = vi.fn();

vi.mock("@store", () => ({
    useAppStore: () => ({ importGlobal: mockImportGlobal }),
}));

class MockFileReader {
    onload: ((e: { target: { result: string } }) => void) | null = null;
    onerror: (() => void) | null = null;
    readAsText(_file: File) {
        lastReaderInstance = this;
    }
}

let lastReaderInstance: MockFileReader | null = null;

vi.stubGlobal("FileReader", MockFileReader);

beforeEach(() => {
    vi.clearAllMocks();
    lastReaderInstance = null;
});

describe("ImportDropZone", () => {
    describe("initial state", () => {
        test("renders upload icon and instructions text", () => {
            render(<ImportDropZone />);
            expect(
                screen.getByText(/drop a splitbill json file here/i),
            ).toBeInTheDocument();
        });

        test("does not render spinner initially", () => {
            render(<ImportDropZone />);
            expect(
                screen.queryByRole("status", { name: /loading/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("drag and drop", () => {
        test("onDragOver sets dragging state", () => {
            render(<ImportDropZone />);
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            fireEvent.dragOver(zone);
            expect(zone).toHaveAttribute("data-dragging", "true");
        });

        test("onDragLeave clears dragging state", () => {
            render(<ImportDropZone />);
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            fireEvent.dragOver(zone);
            fireEvent.dragLeave(zone);
            expect(zone).toHaveAttribute("data-dragging", "false");
        });

        test("dropping a file reads it and calls importGlobal with contents", () => {
            render(<ImportDropZone />);
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            const file = new File(["file content"], "test.json");
            fireEvent.drop(zone, { dataTransfer: { files: [file] } });
            (lastReaderInstance as MockFileReader).onload?.({
                target: { result: "file content" },
            });
            expect(mockImportGlobal).toHaveBeenCalledWith("file content");
        });

        test("dropping with no file is a no-op", () => {
            render(<ImportDropZone />);
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            fireEvent.drop(zone, { dataTransfer: { files: [] } });
            expect(mockImportGlobal).not.toHaveBeenCalled();
            expect(lastReaderInstance).toBeNull();
        });
    });

    describe("click to browse", () => {
        test("clicking zone triggers file input click", async () => {
            render(<ImportDropZone />);
            const input = document.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
            const clickSpy = vi
                .spyOn(input, "click")
                .mockImplementation(() => {});
            await userEvent.click(
                screen.getByRole("button", { name: /import json file/i }),
            );
            expect(clickSpy).toHaveBeenCalledOnce();
        });

        test("pressing Enter on zone triggers file input click", async () => {
            render(<ImportDropZone />);
            const input = document.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
            const clickSpy = vi
                .spyOn(input, "click")
                .mockImplementation(() => {});
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            fireEvent.keyDown(zone, { key: "Enter" });
            expect(clickSpy).toHaveBeenCalledOnce();
        });

        test("pressing Space on zone triggers file input click", async () => {
            render(<ImportDropZone />);
            const input = document.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
            const clickSpy = vi
                .spyOn(input, "click")
                .mockImplementation(() => {});
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            fireEvent.keyDown(zone, { key: " " });
            expect(clickSpy).toHaveBeenCalledOnce();
        });

        test("pressing other keys on zone does not trigger file input click", () => {
            render(<ImportDropZone />);
            const input = document.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
            const clickSpy = vi
                .spyOn(input, "click")
                .mockImplementation(() => {});
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            fireEvent.keyDown(zone, { key: "Tab" });
            expect(clickSpy).not.toHaveBeenCalled();
        });

        test("input click stops propagation to prevent zone re-trigger", () => {
            render(<ImportDropZone />);
            const input = document.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
            const event = new MouseEvent("click", { bubbles: true });
            const stopPropagationSpy = vi.spyOn(event, "stopPropagation");
            input.dispatchEvent(event);
            expect(stopPropagationSpy).toHaveBeenCalledOnce();
        });

        test("selecting a file calls importGlobal with file contents", () => {
            render(<ImportDropZone />);
            const input = document.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
            const file = new File(["file content"], "test.json");
            fireEvent.change(input, { target: { files: [file] } });
            (lastReaderInstance as MockFileReader).onload?.({
                target: { result: "file content" },
            });
            expect(mockImportGlobal).toHaveBeenCalledWith("file content");
        });
    });

    describe("loading", () => {
        test("shows spinner and disables zone while FileReader is running", () => {
            render(<ImportDropZone />);
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            const file = new File(["content"], "test.json");
            fireEvent.drop(zone, { dataTransfer: { files: [file] } });
            expect(
                screen.getByRole("status", { name: /loading/i }),
            ).toBeInTheDocument();
            expect(zone).toHaveClass("pointer-events-none");
        });

        test("clears spinner after FileReader onload completes", () => {
            render(<ImportDropZone />);
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            const file = new File(["content"], "test.json");
            fireEvent.drop(zone, { dataTransfer: { files: [file] } });
            act(() => {
                (lastReaderInstance as MockFileReader).onload?.({
                    target: { result: "content" },
                });
            });
            expect(
                screen.queryByRole("status", { name: /loading/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("reader error", () => {
        test("calls importGlobal with empty string on reader error", () => {
            render(<ImportDropZone />);
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            const file = new File(["content"], "test.json");
            fireEvent.drop(zone, { dataTransfer: { files: [file] } });
            (lastReaderInstance as MockFileReader).onerror?.();
            expect(mockImportGlobal).toHaveBeenCalledWith("");
        });

        test("clears spinner after FileReader onerror", () => {
            render(<ImportDropZone />);
            const zone = screen.getByRole("button", {
                name: /import json file/i,
            });
            const file = new File(["content"], "test.json");
            fireEvent.drop(zone, { dataTransfer: { files: [file] } });
            act(() => {
                (lastReaderInstance as MockFileReader).onerror?.();
            });
            expect(
                screen.queryByRole("status", { name: /loading/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("selecting with no file from input is a no-op", () => {
            render(<ImportDropZone />);
            const input = document.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
            fireEvent.change(input, { target: { files: [] } });
            expect(mockImportGlobal).not.toHaveBeenCalled();
            expect(lastReaderInstance).toBeNull();
        });
    });
});
