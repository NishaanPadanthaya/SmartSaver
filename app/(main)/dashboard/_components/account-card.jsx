"use client";

import { ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault(); // Prevent navigation

    if (isDefault) {
      toast.warning("You need atleast 1 default account");
      return; // Don't allow toggling off the default account
    }

    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  // Determine gradient based on account type
  const getAccountGradient = () => {
    if (type === "SAVINGS") return "gradient-green";
    if (type === "CURRENT") return "gradient-blue";
    return "gradient-purple";
  };

  const gradient = getAccountGradient();

  return (
    <Card className="hover:shadow-lg transition-all group relative overflow-hidden border-2 border-transparent hover:border-primary/20">
      <div className={cn("h-1", gradient)} />
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
            {type === "SAVINGS" ? (
              <Wallet className={cn("h-4 w-4", gradient === "gradient-green" ? "text-green-500" : "text-blue-500")} />
            ) : (
              <Building className={cn("h-4 w-4", gradient === "gradient-blue" ? "text-blue-500" : "text-purple-500")} />
            )}
            {name}
            {isDefault && (
              <Badge variant="outline" className="ml-2 bg-primary/10 text-xs">
                Default
              </Badge>
            )}
          </CardTitle>
          <Switch
            checked={isDefault}
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading}
          />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", {
            "text-green-500": parseFloat(balance) > 0,
            "text-red-500": parseFloat(balance) < 0,
          })}>
            ${parseFloat(balance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
