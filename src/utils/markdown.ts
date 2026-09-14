/** Extract the first ATX level-1 heading (`# Title`) from markdown source. */
export function extractMarkdownH1(content: string): string | null {
  const match = content.match(/^\s*#\s+(.+?)\s*$/m)
  if (!match) return null
  const title = match[1].trim()
  return title.length ? title : null
}
