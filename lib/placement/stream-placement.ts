import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { saveMessages, updateChatTitleById } from "@/lib/db/queries";
import { queryGenie } from "@/lib/placement/genie";
import { generateRoadmap } from "@/lib/placement/roadmap";
import type { StudentContext } from "@/lib/placement/types";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

export function streamPlacementResponse({
  chatId,
  question,
  studentContext,
  titlePromise,
}: {
  chatId: string;
  question: string;
  studentContext: StudentContext;
  titlePromise: Promise<string> | null;
}) {
  const stream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer }) => {
      const genie = await queryGenie(question, studentContext);
      const items = await generateRoadmap(genie, studentContext.skills);

      writer.write({ id: "placement-answer", type: "text-start" });
      writer.write({
        delta: genie.answer,
        id: "placement-answer",
        type: "text-delta",
      });
      writer.write({ id: "placement-answer", type: "text-end" });
      writer.write({
        data: {
          company: genie.company,
          role: genie.role,
          score: genie.readinessScore,
        },
        type: "data-readiness",
      });
      writer.write({
        data: { items },
        type: "data-roadmap",
      });

      if (titlePromise) {
        try {
          const title = await titlePromise;
          writer.write({ data: title, type: "data-chat-title" });
          updateChatTitleById({ chatId, title });
        } catch {
          /* non-fatal */
        }
      }
    },
    generateId: generateUUID,
    onEnd: async ({ messages: finishedMessages }) => {
      if (finishedMessages.length === 0) {
        return;
      }
      await saveMessages({
        messages: finishedMessages.map((currentMessage) => ({
          attachments: [],
          chatId,
          createdAt: new Date(),
          id: currentMessage.id,
          parts: currentMessage.parts,
          role: currentMessage.role,
        })),
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
