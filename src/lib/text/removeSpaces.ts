export function removeSpaces(text: string): string {
  return text.replace(/[ \u3000\t]/g, '')
}
