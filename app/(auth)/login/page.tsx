import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Battery Supply Chain Risk Intelligence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access the admin dashboard.
          </p>
        </div>
        <SignIn routing="hash" />
      </div>
    </main>
  );
}
