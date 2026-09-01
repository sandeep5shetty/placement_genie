import { timingSafeEqual } from "node:crypto";

export const PLACEMENT_CELL_USER_ID = "placement-cell-system";
export const PLACEMENT_CELL_EMAIL = "placement-cell@internal";

export function verifyPlacementCellCode(code: string): boolean {
  const expected = process.env.PLACEMENT_CELL_CODE?.trim();
  if (!(expected && code.trim())) {
    return false;
  }

  const provided = Buffer.from(code.trim());
  const secret = Buffer.from(expected);

  if (provided.length !== secret.length) {
    return false;
  }

  return timingSafeEqual(provided, secret);
}

export function isPlacementCellCodeConfigured() {
  return Boolean(process.env.PLACEMENT_CELL_CODE?.trim());
}
