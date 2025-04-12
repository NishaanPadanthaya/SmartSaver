import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold gradient-title">SmartSaver</CardTitle>
          <p className="text-muted-foreground">Your intelligent finance management platform</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center">
            <p>Take control of your finances with AI-powered insights</p>
            <div className="flex flex-col space-y-3 mt-6">
              <SignInButton forceRedirectUrl="/dashboard">
                <Button size="lg" className="w-full rounded-lg">
                  Sign In
                </Button>
              </SignInButton>
              <Link href="/sign-up" className="text-sm text-muted-foreground hover:underline">
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPage;
