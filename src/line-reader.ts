export function createLineReader(input: string) {
  let newLineIndex = input.indexOf('\n');
  let lastIndex = 0;

  return () => {
    if (newLineIndex !== -1) {
      const line = input.slice(lastIndex, newLineIndex).trimEnd();
      lastIndex = newLineIndex + 1;
      newLineIndex = input.indexOf('\n', lastIndex);
      return line;
    }
    return null;
  };
}
