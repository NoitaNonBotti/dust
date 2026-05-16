import { AuthUser, Claim, ItemTemplate, LostItem } from "../types";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const AUTH_STORAGE_KEY = "dust-auth-user";

const env = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string; DEV?: boolean } }).env;

/** In dev, use same-origin `/api` via Vite proxy so any port (5173, 5174, …) works. */
const apiBaseUrl = (env?.VITE_API_BASE_URL ?? (env?.DEV ? "" : DEFAULT_API_BASE_URL)).replace(
  /\/$/,
  ""
);

interface ApiLostItem {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  dateFound: string;
  status: LostItem["status"];
  imageUrl?: string;
  claims?: Claim[];
}

export function sortClaims(claims: Claim[]): Claim[] {
  return [...claims].sort((a, b) => {
    const priorityRank = (priority?: Claim["priority"]) => (priority === "low" ? 1 : 0);
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
    if (byPriority !== 0) return byPriority;
    return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
  });
}

export interface CreateLostItemInput {
  name: string;
  category: string;
  description: string;
  location: string;
  dateFound?: string;
  imageUrl?: string;
  image?: File;
  status?: LostItem["status"];
}

export interface UpdateLostItemInput extends CreateLostItemInput {
  id: string;
}

function fromApiLostItem(item: ApiLostItem): LostItem {
  return {
    id: item.id,
    name: item.name,
    categories: item.category ? [item.category] : ["Other"],
    description: item.description,
    location: item.location,
    dateFound: item.dateFound,
    status: item.status,
    images: item.imageUrl ? [toAbsoluteMediaUrl(item.imageUrl)] : [],
    claims: sortClaims(item.claims || []),
  };
}

function toAbsoluteMediaUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }

  return `${apiBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

async function parseResponse(response: Response) {
  const responseText = await response.text();
  const payload = responseText ? safeParseJson(responseText) : null;

  if (!response.ok) {
    const detail =
      payload?.error ||
      payload?.detail ||
      responseText.slice(0, 120) ||
      response.statusText;
    throw new Error(`HTTP ${response.status}: ${detail}`);
  }

  return payload;
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function authHeaders() {
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawUser) return {};

  try {
    const user = JSON.parse(rawUser) as AuthUser;
    return user.token ? { "X-DUST-SESSION": user.token } : {};
  } catch {
    return {};
  }
}

export async function loginWithGbox(input: { credential: string }): Promise<AuthUser> {
  const response = await fetch(`${apiBaseUrl}/api/auth/gbox/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseResponse(response);
  return payload.user as AuthUser;
}

export async function loginAsAdmin(input: { username: string; password: string }): Promise<AuthUser> {
  const response = await fetch(`${apiBaseUrl}/api/auth/admin/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseResponse(response);
  return payload.user as AuthUser;
}

export async function getLostItems(): Promise<LostItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/lost-items/`);
  const payload = await parseResponse(response);
  return (payload.items as ApiLostItem[]).map(fromApiLostItem);
}

export async function createLostItem(input: CreateLostItemInput): Promise<LostItem> {
  const requestInit: RequestInit = input.image
    ? {
        method: "POST",
        headers: authHeaders(),
        body: toFormData(input),
      }
    : {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(input),
      };

  const response = await fetch(`${apiBaseUrl}/api/lost-items/`, requestInit);
  const payload = await parseResponse(response);
  return fromApiLostItem(payload as ApiLostItem);
}

export async function updateLostItem(input: UpdateLostItemInput): Promise<LostItem> {
  const response = await fetch(`${apiBaseUrl}/api/lost-items/${input.id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(input),
  });
  const payload = await parseResponse(response);
  return fromApiLostItem(payload as ApiLostItem);
}

export async function deleteLostItem(itemId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/lost-items/${itemId}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  await parseResponse(response);
}

export async function createClaim(input: {
  itemId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  description: string;
}): Promise<Claim> {
  const response = await fetch(`${apiBaseUrl}/api/claims/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(input),
  });
  return (await parseResponse(response)) as Claim;
}

export async function updateClaimStatus(claimId: string, status: Claim["status"]): Promise<Claim> {
  const response = await fetch(`${apiBaseUrl}/api/claims/${claimId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  return (await parseResponse(response)) as Claim;
}

/** Guest assistance requests are stored as low-priority claims. */
export async function createGuestInquiry(input: {
  itemId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  message: string;
}): Promise<Claim> {
  const response = await fetch(`${apiBaseUrl}/api/claims/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId: input.itemId,
      claimantName: input.contactName,
      claimantEmail: input.contactEmail,
      claimantPhone: input.contactPhone,
      description: input.message,
    }),
  });
  return (await parseResponse(response)) as Claim;
}

export async function getGlobalTemplates(): Promise<ItemTemplate[]> {
  const response = await fetch(`${apiBaseUrl}/api/templates/global/`);
  const payload = await parseResponse(response);
  return payload.templates as ItemTemplate[];
}

export async function createGlobalTemplate(input: Omit<ItemTemplate, "id">): Promise<ItemTemplate> {
  const response = await fetch(`${apiBaseUrl}/api/templates/global/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      name: input.name,
      category: input.categories[0],
      description: input.description,
      location: input.location,
    }),
  });
  return (await parseResponse(response)) as ItemTemplate;
}

export async function deleteGlobalTemplate(template: ItemTemplate): Promise<void> {
  if (!template.backendId) return;
  const response = await fetch(`${apiBaseUrl}/api/templates/global/${template.backendId}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await parseResponse(response);
}

function toFormData(input: CreateLostItemInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("category", input.category);
  formData.append("description", input.description);
  formData.append("location", input.location);

  if (input.dateFound) formData.append("dateFound", input.dateFound);
  if (input.status) formData.append("status", input.status);
  if (input.imageUrl) formData.append("imageUrl", input.imageUrl);
  if (input.image) formData.append("image", input.image);

  return formData;
}
