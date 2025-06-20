import { useStatusRealtime } from "../../../lib/hooks/useStatusRealtime";
import { useEffect } from "react";

export default function StatusRealtimeProvider() {
  const { statusStore } = useStatusRealtime();
  useEffect(() => {}, [statusStore.hubConnection]);
  return null;
}
