const USN_LABEL =
  /(?:u\.?s\.?n\.?|s\.?r\.?n\.?|university\s+seat\s+number|student\s+id|student\s+usn)\s*[:\-#]?\s*([0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3})/i;
const USN_BARE = /\b([0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3})\b/;

export function extractUsnFromText(text: string) {
  const labeled = USN_LABEL.exec(text);
  if (labeled?.[1]) {
    return labeled[1].toUpperCase();
  }
  const bare = USN_BARE.exec(text);
  if (bare?.[1]) {
    return bare[1].toUpperCase();
  }
}
