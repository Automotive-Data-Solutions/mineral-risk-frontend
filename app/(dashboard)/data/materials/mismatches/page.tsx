"use client";

// ---------------------------------------------------------------------------
// /data/materials/mismatches  →  retired 2026-05-11
// ---------------------------------------------------------------------------
//
// The HS-mismatch view was removed when the Materials page refactor dropped
// the suspect-mapping tracking from the analyst dashboard.  This file is
// retained only as a redirect target so any external bookmarks bounce to
// the new Materials list rather than 404.
//
// Once we're confident no one is linking to /mismatches/ (a release cycle
// or two after this lands), this redirect file can be deleted.

import { redirect } from "next/navigation";

export default function MismatchesRedirectPage() {
  redirect("/data/materials");
}
