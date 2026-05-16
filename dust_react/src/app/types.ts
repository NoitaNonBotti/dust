export type ItemStatus = "unclaimed" | "claimed" | "returned";

export interface LostItem {
  id: string;
  name: string;
  categories: string[]; // Changed from category to categories (array)
  description: string;
  location: string;
  dateFound: string;
  status: ItemStatus;
  images: string[]; // Array of image URLs (at least 1 required)
  claims: Claim[];
}

export interface Claim {
  id: string;
  itemId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  description: string;
  dateSubmitted: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  priority?: "high" | "low";
  createdByToken?: string;
}

export interface ItemTemplate {
  id: string;
  backendId?: string;
  scope?: "local" | "global";
  name: string;
  categories: string[]; // Changed to array
  description: string;
  location: string;
}

export type UserRole = "guest" | "student" | "admin";

export interface AuthUser {
  token: string;
  role: Exclude<UserRole, "guest">;
  name: string;
  email?: string;
}

/** True when users can still file a new claim on this item. */
export function canFileClaimOnItem(item: LostItem): boolean {
  if (item.status !== "unclaimed") {
    return false;
  }
  return !item.claims.some((claim) => claim.status === "approved");
}

export function claimClosedMessage(item: LostItem): string {
  if (item.status === "returned") {
    return "Item Already Returned";
  }
  if (item.status === "claimed" || item.claims.some((claim) => claim.status === "approved")) {
    return "Item Already Claimed";
  }
  return "";
}
