export function formData(record: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(record)) {
    fd.set(key, value);
  }
  return fd;
}
