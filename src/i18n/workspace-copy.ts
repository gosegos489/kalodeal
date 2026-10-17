import type messages from './messages/en.json'
import { workspaceCopyKeys } from './workspace-copy-keys'

export type WorkspaceKey = keyof typeof messages.Workspace
export type WorkspaceTranslator = (key: WorkspaceKey, values?: Record<string, string | number>) => string

const keys: Readonly<Record<string, WorkspaceKey>> = workspaceCopyKeys
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const patterns = Object.entries(keys).flatMap(([source, key]) => {
  const parameters = [...source.matchAll(/\{(value\d+)\}/g)].map((match) => match[1])
  if (!parameters.length) return []
  const expression = source
    .split(/\{value\d+\}/g)
    .map(escapePattern)
    .join('(.+?)')
  return [{ expression: new RegExp(`^${expression}$`), parameters, key }]
})

// Call only for application-owned labels and action/validation responses.
// User messages, listing text and staff feedback are displayed unchanged.
export function createWorkspaceCopy(t: WorkspaceTranslator) {
  return (source: string, fallback = false): string => {
    const key = Object.hasOwn(keys, source) ? keys[source] : undefined
    if (key) return t(key)
    for (const pattern of patterns) {
      const match = pattern.expression.exec(source)
      if (match) return t(pattern.key, Object.fromEntries(pattern.parameters.map((name, index) => [name, match[index + 1]])))
    }
    return fallback ? t('operationFailed') : source
  }
}
