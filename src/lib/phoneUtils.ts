import { COUNTRIES } from "@/config/countries";

export const parsePhone = (raw: string | undefined) => {
  if (!raw) return { code: "+1", number: "" };
  // Basic regex to find leading + and digits
  const match = raw.match(/^(\+\d+)(.*)$/);
  if (match) {
    const code = match[1];
    const number = match[2].trim();
    // Verify if the code exists in our list
    if (COUNTRIES.find((c) => c.code === code)) {
      return { code, number };
    }
  }

  // Fallback: Check if it starts with any code from our list
  const found = COUNTRIES.find((c) => raw.startsWith(c.code));
  if (found) {
    return { code: found.code, number: raw.replace(found.code, "").trim() };
  }

  return { code: "+1", number: raw };
};
