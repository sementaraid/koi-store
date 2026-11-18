/* What a customer sees after a refused request (D-055).

   Medusa wraps a validation failure's body as `Invalid request: <message>`.
   The backend writes `<message>` in Indonesian for the customer, so only the
   English wrapper is dropped and the sentence after it is shown as-is. */

const PREFIX = 'Invalid request: ';

/** Remove Medusa's `Invalid request: ` wrapper; leave anything else untouched. */
export function stripValidationPrefix(message: string): string {
  return message.startsWith(PREFIX) ? message.slice(PREFIX.length).trim() : message;
}
