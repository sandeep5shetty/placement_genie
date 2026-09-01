import { initBotId } from "botid/client/core";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

initBotId({
  protect: [
    {
      method: "POST",
      path: `${basePath}/api/chat`,
    },
    {
      method: "POST",
      path: "/api/chat",
    },
  ],
});
