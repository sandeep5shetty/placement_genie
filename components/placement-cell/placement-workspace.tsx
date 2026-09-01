"use client";

import {
  ArrowUpIcon,
  CircleAlertIcon,
  FileBarChartIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { GenieMark } from "@/components/placement/genie-mark";
import { placementCellWelcomePrompts } from "@/lib/placement-cell/prompts";
import type { QueryResult } from "@/lib/placement-cell/types";
import { AnalyticsResult } from "./analytics-result";
import { MarkdownAnswer } from "./markdown-answer";
import { PlacementSidebar } from "./placement-sidebar";

type PlacementMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  queryResults?: QueryResult[];
  suggestedQuestions?: string[];
};

const loadingMessages = [
  "Connecting to Placement Intelligence...",
  "Analyzing campus data...",
  "Identifying patterns...",
  "Evaluating recruitment trends...",
  "Generating evidence-based insights...",
];

function WelcomePromptButton({
  content,
  disabled,
  onRun,
  title,
}: {
  content: string;
  disabled: boolean;
  onRun: (message: string) => void;
  title: string;
}) {
  const handleClick = useCallback(() => {
    onRun(content);
  }, [content, onRun]);

  return (
    <button
      className="rounded-xl border border-border/50 bg-card/40 p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-border hover:bg-card/70"
      disabled={disabled}
      onClick={handleClick}
      type="button"
    >
      <p className="font-medium text-sm">{title}</p>
      <p className="mt-2 line-clamp-3 text-[12px] text-muted-foreground">
        {content}
      </p>
    </button>
  );
}

function SuggestedQuestionButton({
  onRun,
  question,
}: {
  onRun: (message: string) => void;
  question: string;
}) {
  const handleClick = useCallback(() => {
    onRun(question);
  }, [onRun, question]);

  return (
    <button
      className="rounded-full border border-border/50 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
      onClick={handleClick}
      type="button"
    >
      {question}
    </button>
  );
}

export function PlacementWorkspace() {
  const [messages, setMessages] = useState<PlacementMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Placement Overview");
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
    },
    []
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when messages or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setLoadingTextIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingTextIndex((index) => (index + 1) % loadingMessages.length);
    }, 2300);

    return () => window.clearInterval(timer);
  }, [loading]);

  const sendMessage = useCallback(
    async (
      preset?: string,
      targetConversationId: string | null = conversationId
    ) => {
      const message = (preset ?? input).trim();
      if (!message || loading) {
        return;
      }

      setMessages((items) => [
        ...items,
        { content: message, id: crypto.randomUUID(), role: "user" },
      ]);
      setInput("");
      setError("");
      setLoading(true);
      setSidebarOpen(false);

      try {
        const response = await fetch("/placement-cell/api/genie", {
          body: JSON.stringify({
            conversationId: targetConversationId,
            message,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        const data = (await response.json()) as {
          answer?: string;
          conversationId?: string;
          error?: string;
          queryResults?: QueryResult[];
          status?: string;
          suggestedQuestions?: string[];
        };

        if (!response.ok || data.status !== "completed") {
          throw new Error(data.error ?? "Placement Cell Genie request failed.");
        }

        setConversationId(data.conversationId ?? null);
        setMessages((items) => [
          ...items,
          {
            content: data.answer ?? "Analysis completed.",
            id: crypto.randomUUID(),
            queryResults: data.queryResults ?? [],
            role: "assistant",
            suggestedQuestions: data.suggestedQuestions ?? [],
          },
        ]);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to connect to Placement Intelligence."
        );
      } finally {
        setLoading(false);
      }
    },
    [conversationId, input, loading]
  );

  const runMessage = useCallback(
    (message: string, targetConversationId: string | null = conversationId) => {
      sendMessage(message, targetConversationId).catch(() => undefined);
    },
    [conversationId, sendMessage]
  );

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      runMessage(input);
    },
    [input, runMessage]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        runMessage(input);
      }
    },
    [input, runMessage]
  );

  const handleNewAnalysis = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setError("");
    setActiveSection("Placement Overview");
    setSidebarOpen(false);
  }, []);

  const handleSelectSection = useCallback(
    (label: string, question: string) => {
      setActiveSection(label);
      setMessages([]);
      setConversationId(null);
      setError("");
      runMessage(question, null);
    },
    [runMessage]
  );

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  return (
    <div className="flex min-h-dvh bg-background">
      <PlacementSidebar
        activeSection={activeSection}
        loading={loading}
        onNewAnalysis={handleNewAnalysis}
        onSelectSection={handleSelectSection}
        onToggleMobile={handleToggleSidebar}
        open={sidebarOpen}
      />

      <div className="flex min-h-dvh flex-1 flex-col md:ml-[270px]">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-background/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4 pl-12 md:pl-0">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
                Placement command center
              </p>
              <h1 className="font-semibold text-xl tracking-tight md:text-2xl">
                Intelligence workspace
              </h1>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-[12px] text-muted-foreground sm:inline-flex">
              <ShieldCheckIcon className="size-4" />
              {conversationId ? "Conversation active" : "Read-only analytics"}
            </div>
          </div>
        </header>

        <div
          className={`flex-1 overflow-y-auto px-4 py-8 md:px-8 ${
            messages.length ? "pb-44" : "pb-36"
          }`}
        >
          {messages.length ? (
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
              {messages.map((message) =>
                message.role === "user" ? (
                  <article
                    className="ml-auto max-w-[min(760px,82%)] rounded-2xl rounded-br-lg bg-primary px-4 py-3 text-[13px] text-primary-foreground"
                    key={message.id}
                  >
                    {message.content}
                  </article>
                ) : (
                  <article className="flex items-start gap-3" key={message.id}>
                    <div className="mt-0.5 shrink-0">
                      <GenieMark size={28} />
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl border border-border/50 bg-card/50 p-5 shadow-[var(--shadow-card)]">
                      <p className="mb-3 text-[10px] font-semibold tracking-[0.13em] text-primary uppercase">
                        Placement intelligence
                      </p>
                      <MarkdownAnswer content={message.content} />
                      {message.queryResults?.map((result) => (
                        <div className="mt-5" key={result.id}>
                          <AnalyticsResult result={result} />
                        </div>
                      ))}
                      {message.suggestedQuestions?.length ? (
                        <div className="mt-5 border-t border-border/40 pt-4">
                          <p className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                            Explore further
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestedQuestions.map((question) => (
                              <SuggestedQuestionButton
                                key={question}
                                onRun={runMessage}
                                question={question}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              )}

              {loading ? (
                <article className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <GenieMark size={28} />
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-card/50 px-4 py-3 text-[13px] text-muted-foreground">
                    {loadingMessages[loadingTextIndex]}
                  </div>
                </article>
              ) : null}

              {error ? (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
                  <CircleAlertIcon className="size-4 shrink-0" />
                  {error}
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-card/50">
                  <GraduationCapIcon className="size-8 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
                    Your AI placement partner
                  </p>
                  <h2 className="font-semibold text-3xl tracking-tight">
                    Placement Intelligence
                  </h2>
                  <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">
                    Transform campus placement data into actionable insights.
                    Analyze recruitment performance, student readiness, skill
                    gaps, bottlenecks, and intervention opportunities.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {placementCellWelcomePrompts.map(({ content, title }) => (
                  <WelcomePromptButton
                    content={content}
                    disabled={loading}
                    key={title}
                    onRun={runMessage}
                    title={title}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <form
          className="sticky bottom-0 border-t border-border/40 bg-background/95 px-4 py-4 backdrop-blur md:px-8"
          onSubmit={handleSubmit}
        >
          <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-2xl border border-border/50 bg-card/50 p-2 shadow-[var(--shadow-composer)]">
            <textarea
              className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] outline-none"
              disabled={loading}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about placement performance, skill gaps, student readiness..."
              rows={1}
              value={input}
            />
            <button
              aria-label="Send message"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!input.trim() || loading}
              type="submit"
            >
              <ArrowUpIcon className="size-4" />
            </button>
          </div>
          <p className="mx-auto mt-2 flex max-w-5xl items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <FileBarChartIcon className="size-3.5" />
            Placement Cell analyzes campus data using Databricks Genie
          </p>
        </form>
      </div>
    </div>
  );
}
