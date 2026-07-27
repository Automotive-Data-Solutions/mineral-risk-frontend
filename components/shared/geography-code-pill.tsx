import { CountrySharePill } from "@/components/shared/country-share-pill";

/** Geography code pill — delegates to CountrySharePill. */
export function GeographyCodePill({ code }: { code: string }) {
  return <CountrySharePill code={code} />;
}
