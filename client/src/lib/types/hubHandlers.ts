export type RegisteredHandler = {
  event: string;
  handler: (...args: unknown[]) => void;
};
