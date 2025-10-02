export const hasActiveVideoTrack = (stream?: MediaStream | null) =>
  Boolean(
    stream?.getVideoTracks().some((track) => track.readyState !== "ended")
  );