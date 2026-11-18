export function parseVariantIdsFromError(errorMessage: string): string[] {
  if (!errorMessage) {
    return []
  }

  const variantIdPattern = /variant_[A-Z0-9]+/g
  const matches = errorMessage.match(variantIdPattern)

  return matches || []
}

