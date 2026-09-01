import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  askPlacementCellGenie,
  isPlacementCellGenieConfigured,
} from "@/lib/placement-cell/databricks-genie";

export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await auth();

  if (session?.user?.type !== "placement_cell") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPlacementCellGenieConfigured()) {
    return NextResponse.json(
      {
        code: "CONFIGURATION",
        error: "Placement Cell Genie is not configured on the server.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      conversationId?: unknown;
      message?: unknown;
    };

    if (typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", error: "Please enter a valid question." },
        { status: 400 }
      );
    }

    const conversationKey =
      typeof body.conversationId === "string" && body.conversationId.trim()
        ? body.conversationId.trim()
        : session.user.id;

    const result = await askPlacementCellGenie({
      conversationKey,
      question: body.message.trim(),
    });

    return NextResponse.json({
      answer: result.answer,
      conversationId: result.conversationId ?? conversationKey,
      queryResults: result.queryResults,
      status: result.status,
      suggestedQuestions: result.suggestedQuestions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: "GENIE_FAILURE",
        error:
          error instanceof Error
            ? error.message
            : "Unable to reach Placement Cell Genie.",
      },
      { status: 502 }
    );
  }
}
