/** The customer fields the account sidebar reads (structural, so a Medusa customer fits). */
type CustomerInput = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  addresses?: {
    city?: string | null;
    is_default_shipping?: boolean | null;
  }[] | null;
};

export type AccountIdentity = {
  name: string;
  city?: string;
  isFarmer?: boolean;
};

/**
 * What the account sidebar shows under the avatar (US-103 AC10): the name, the
 * city of the default shipping address, and whether this person also farms.
 * A customer with no address gets no city, so the line reads just `Pembeli`.
 */
export function accountIdentity(customer: CustomerInput, isFarmer = false): AccountIdentity {
  const address =
    customer.addresses?.find((a) => a.is_default_shipping) ?? customer.addresses?.[0];
  const city = address?.city?.trim();

  return {
    name:
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      customer.email ||
      '',
    city: city || undefined,
    isFarmer
  };
}
