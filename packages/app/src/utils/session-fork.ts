import type { useSDK } from "@/context/sdk"
import type { useNavigate } from "@solidjs/router"
import type { useLanguage } from "@/context/language"
import type { usePrompt } from "@/context/prompt"
import type { Part } from "@opencode-ai/sdk/v2"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { legacySessionHref, requireServerKey, sessionHref } from "./session-route"
import { extractPromptFromParts } from "./prompt"
import { showToast } from "./toast"
import { createSessionMutation } from "./session-mutation"
import type { ServerSync } from "@/context/server-sync"

export function forkSession(input: {
  sdk: ReturnType<typeof useSDK>
  navigate: ReturnType<typeof useNavigate>
  language: ReturnType<typeof useLanguage>
  prompt: ReturnType<typeof usePrompt>
  parts: Record<string, Part[] | undefined>
  sessionID: string
  messageID: string
  serverSync: ServerSync
  serverKey?: string
}) {
  const dir = input.sdk().directory
  const href = input.serverKey
    ? (id: string) => sessionHref(requireServerKey(input.serverKey!), id)
    : (id: string) => legacySessionHref(dir, id)

  const restored = extractPromptFromParts(input.parts[input.messageID] ?? [], {
    directory: dir,
    attachmentName: input.language.t("common.attachment"),
  })
  return createSessionMutation({ client: input.sdk().client, serverSync: input.serverSync })
    .fork(input.sessionID, input.messageID)
    .then((forked) => {
      input.prompt.set(restored, undefined, { dir: base64Encode(dir), id: forked.id })
      input.navigate(href(forked.id))
    })
    .catch((err: unknown) => {
      showToast({
        title: input.language.t("common.requestFailed"),
        description: err instanceof Error ? err.message : String(err),
      })
    })
}
