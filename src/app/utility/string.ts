export function getFilenameFromPath(path: string): string | undefined {
  const parts: string[] = path.split(/[\\/]/);
  return path.length > 0 ? parts[parts.length - 1] : undefined;
}
