import { LostItem } from "../types";

const DEFAULT_API_BASE_URL = "http://localhost:8000";

const apiBaseUrl =
  ((import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

interface ApiLostItem {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  dateFound: string;
  status: LostItem["status"];
  imageUrl?: string;
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
    claims: [],
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

export async function getLostItems(): Promise<LostItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/lost-items/`);
  const payload = await parseResponse(response);
  return (payload.items as ApiLostItem[]).map(fromApiLostItem);
}

export async function createLostItem(input: CreateLostItemInput): Promise<LostItem> {
  const requestInit: RequestInit = input.image
    ? {
        method: "POST",
        body: toFormData(input),
      }
    : {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      };

  const response = await fetch(`${apiBaseUrl}/api/lost-items/`, requestInit);
  const payload = await parseResponse(response);
  return fromApiLostItem(payload as ApiLostItem);
}

export async function updateLostItem(
  input: UpdateLostItemInput,
  adminPassword: string
): Promise<LostItem> {
  const response = await fetch(`${apiBaseUrl}/api/lost-items/${input.id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-DUST-ADMIN-PASSWORD": adminPassword,
    },
    body: JSON.stringify(input),
  });
  const payload = await parseResponse(response);
  return fromApiLostItem(payload as ApiLostItem);
}

export async function deleteLostItem(itemId: string, adminPassword: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/lost-items/${itemId}/`, {
    method: "DELETE",
    headers: {
      "X-DUST-ADMIN-PASSWORD": adminPassword,
    },
  });

  await parseResponse(response);
}

function toFormData(input: CreateLostItemInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("category", input.category);
  formData.append("description", input.description);
  formData.append("location", input.location);

  if (input.dateFound) {
    formData.append("dateFound", input.dateFound);
  }

  if (input.status) {
    formData.append("status", input.status);
  }

  if (input.imageUrl) {
    formData.append("imageUrl", input.imageUrl);
  }

  if (input.image) {
    formData.append("image", input.image);
  }

  return formData;
}
