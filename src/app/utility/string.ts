export function getFilenameFromPath(path: string, includeExt: boolean = false): string | undefined {
  const parts: string[] = path.split(/[\\/]/);
  let filename: string | undefined = path.length > 0 ? parts[parts.length - 1] : undefined;

  if (filename && !includeExt) {
    const extStart: number = filename.lastIndexOf('.');

    /* In the unlikely event that the filename starts with a period, ignore it */
    if (extStart > 0) {
      filename = filename.substring(0, extStart);
    }
  }

  return filename;
}
