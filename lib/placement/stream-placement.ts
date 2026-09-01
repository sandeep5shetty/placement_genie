import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { saveMessages, updateChatTitleById } from "@/lib/db/queries";
import { queryGenie } from "@/lib/placement/genie";
import { evaluatePlacementQuestion } from "@/lib/placement/question-scope";
import { runRoadmapAgent } from "@/lib/placement/roadmap-agent";
import type { StudentContext } from "@/lib/placement/types";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

export function streamPlacementResponse({
  chatId,
  question,
  studentContext,
}: {
  chatId: string;
  question: string;
  studentContext: StudentContext;
}) {
  const stream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer }) => {
      const writeAnswer = (id: string, text: string) => {
        writer.write({ id, type: "text-start" });
        writer.write({
          delta: text,
          id,
          type: "text-delta",
        });
        writer.write({ id, type: "text-end" });
      };

      writer.write({
        data: {
          message: "Checking whether this is a placement question…",
          modelId: "genie-agent",
          modelName: "Genie Agent",
          phase: "waiting",
        },
        type: "data-waiting-status",
      });

      const evaluation = await evaluatePlacementQuestion(question);
      if (evaluation.scope !== "in_scope") {
        writeAnswer("placement-answer", evaluation.reply);
        const title =
          question.trim().slice(0, 72) || "Placement readiness question";
        writer.write({ data: title, type: "data-chat-title" });
        updateChatTitleById({ chatId, title });
        return;
      }

      writer.write({
        data: {
          message: "Querying Databricks Genie Agent…",
          modelId: "genie-agent",
          modelName: "Genie Agent",
          phase: "waiting",
        },
        type: "data-waiting-status",
      });

      const hasProfile = Boolean(
        studentContext.usn ||
          studentContext.cgpa ||
          studentContext.name ||
          studentContext.skills.length > 0
      );

      if (hasProfile) {
        try {
          const conversationKey = [
            chatId,
            studentContext.usn ?? "",
            studentContext.name ?? "",
          ].join(":");
          const genie = await queryGenie(
            question,
            studentContext,
            conversationKey
          );
          const roadmap = await runRoadmapAgent({
            company: genie.company,
            missingSkills: genie.missingSkills,
            role: genie.role,
            studentContext,
          });

          writer.write({
            data: {
              company: genie.company,
              role: genie.role,
              score: genie.readinessScore,
            },
            type: "data-readiness",
          });
          writer.write({
            data: { tables: genie.tables },
            type: "data-genie-tables",
          });

          if (genie.prose) {
            writeAnswer("placement-answer", genie.prose);
          }

          writer.write({
            data: roadmap,
            type: "data-roadmap",
          });
        } catch (error) {
          const detail =
            error instanceof Error
              ? error.message
              : "Genie Agent request failed.";
          writeAnswer(
            "placement-error",
            `Genie Agent could not answer this question. ${detail}`
          );
        }
      } else {
        writeAnswer(
          "placement-answer",
          "Open Profile and add your USN, name, CGPA, and skills (or upload a resume). I answer from your profile, not a shared demo student."
        );
      }

      const title =
        question.trim().slice(0, 72) || "Placement readiness question";
      writer.write({ data: title, type: "data-chat-title" });
      updateChatTitleById({ chatId, title });
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
