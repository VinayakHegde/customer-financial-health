export function fieldPathToDomId(field: string): string {
  return `field-${field.replaceAll(".", "-")}`;
}
