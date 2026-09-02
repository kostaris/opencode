import type { useSDK } from "@/context/sdk"
import type { useNavigate } from "@solidjs/router"
import { legacySessionHref, requireServerKey, sessionHref } from "./session-route"
import { showToast } from "./toast"
import { createSessionMutation } from "./session-mutation"
import type { ServerSync } from "@/context/server-sync"

const inFlight = new Set<string>()

export function duplicateSession(input: {
  sdk: ReturnType<typeof useSDK>
  navigate: ReturnType<typeof useNavigate>
  sessionID: string
  errorTitle: string
  serverSync: ServerSync
  serverKey?: string
}) {
  if (inFlight.has(input.sessionID)) return
  inFlight.add(input.sessionID)

  const dir = input.sdk().directory
  const href = input.serverKey
    ? (id: string) => sessionHref(requireServerKey(input.serverKey!), id)
    : (id: string) => legacySessionHref(dir, id)

  return createSessionMutation({ client: input.sdk().client, serverSync: input.serverSync })
    .fork(input.sessionID)
    .then((forked) => input.navigate(href(forked.id)))
    .catch((err: unknown) => {
      showToast({
        variant: "error",
        title: input.errorTitle,
        description: err instanceof Error ? err.message : String(err),
      })
    })
    .finally(() => inFlight.delete(input.sessionID))
}
