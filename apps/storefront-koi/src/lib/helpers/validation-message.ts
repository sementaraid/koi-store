
const PREFIX = 'Invalid request: ';

export function stripValidationPrefix(message: string): string {
  return message.startsWith(PREFIX) ? message.slice(PREFIX.length).trim() : message;
}
