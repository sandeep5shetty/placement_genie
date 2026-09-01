import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";

export default async function PlacementCellDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.type !== "placement_cell") {
    redirect("/placement-cell/login");
  }

  return children;
}
