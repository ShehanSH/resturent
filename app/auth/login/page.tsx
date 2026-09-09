import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/public/brand-logo";

export default function LoginPage() {
  return (
    <div className="admin-app flex min-h-full items-center justify-center bg-[#f6f4f1] px-4 py-16">
      <div className="admin-card w-full max-w-sm p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo restaurantName="Hot Bread Beruwala" size="lg" surface="light" showName={false} />
        </div>
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">Staff sign in</h1>
        <p className="text-muted-foreground mt-1 text-center text-sm">
          Use the account created for you by an administrator.
        </p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
