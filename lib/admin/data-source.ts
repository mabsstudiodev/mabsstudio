/**
 * Error presentation for the admin UI.
 *
 * Convex throws plain `Error`s from the role guards and validators. Those
 * messages are written for an admin to read, so they are shown as-is; anything
 * else (a network blip, an internal fault) falls back to a neutral sentence
 * rather than leaking a stack or a database error.
 */

/** Convex wraps thrown errors in its own framing — pull the message back out. */
function unwrap(message: string): string {
  const match = message.match(/Uncaught Error:\s*([^\n]+)/);
  return (match?.[1] ?? message).trim();
}

export function toUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback;

  const message = unwrap(error.message);

  // The guards in convex/lib/auth.ts throw this; say something actionable.
  if (message === "Not authorized") {
    return "Your account doesn't have permission to do that.";
  }

  // Anything long or multi-line is an internal fault, not advice for a user.
  if (message.length > 160 || message.includes("\n")) return fallback;

  return message;
}
