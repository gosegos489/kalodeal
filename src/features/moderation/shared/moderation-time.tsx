export function ModerationTime({ date }: { date: Date }) {
  const iso = date.toISOString()
  return <time dateTime={iso}>{iso.slice(0, 16).replace('T', ' ')} UTC</time>
}
