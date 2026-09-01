import { OpenTelemetry } from "@ai-sdk/otel";
import { registerOTel } from "@vercel/otel";
import { registerTelemetry } from "ai";

export function register() {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  registerOTel({ serviceName: "chatbot" });
  registerTelemetry(new OpenTelemetry());
}
