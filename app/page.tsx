import { redirect } from "next/navigation";

export default function RootPage() {
  // Clerk middleware already gates auth. This page is only reachable when the
  // user is authenticated; push them into the dashboard.
  redirect("/dashboard");
}
