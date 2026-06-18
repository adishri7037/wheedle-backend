// Utility helpers for ChatSession creation/association.
// (Kept as separate file to avoid clutter in chat.service.ts)

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

