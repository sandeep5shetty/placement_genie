"use server";

import { signIn } from "@/app/(auth)/auth";
import { isPlacementCellCodeConfigured } from "@/lib/placement-cell/auth";

export type PlacementCellLoginState = {
  status: "idle" | "in_progress" | "success" | "failed" | "not_configured";
};

export const loginPlacementCell = async (
  _: PlacementCellLoginState,
  formData: FormData
): Promise<PlacementCellLoginState> => {
  if (!isPlacementCellCodeConfigured()) {
    return { status: "not_configured" };
  }

  const code = String(formData.get("code") ?? "");

  try {
    await signIn("placement-cell", {
      code,
      redirect: false,
    });

    return { status: "success" };
  } catch {
    return { status: "failed" };
  }
};
