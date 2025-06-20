import { useStatusRealtime } from "../../../lib/hooks/useStatusRealtime";

export default function StatusRealtimeProvider() {
  useStatusRealtime();
  return null;
}
