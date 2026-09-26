import { toast } from "react-toastify";
import { ApiError } from "@/lib/apiClient";

// Surface an API failure as a toast, preferring the server's detail message.
export function toastError(err: unknown, fallback: string) {
  const detail = err instanceof ApiError ? err.message : fallback;
  toast.error(detail || fallback);
}
