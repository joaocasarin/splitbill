type Position =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";

export const TOAST_POSITION: Position = "top-right";
export const ERROR_TOAST_DURATION_SECONDS: number = 30 * 1000;
export const SUCCESS_TOAST_DURATION_SECONDS: number = 10 * 1000;
