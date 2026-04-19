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
  status: "pending" | "approved" | "rejected";
}

export interface ItemTemplate {
  id: string;
  name: string;
  categories: string[]; // Changed to array
  description: string;
  location: string;
}