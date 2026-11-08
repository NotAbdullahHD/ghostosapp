import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface CallProfile {
  id: string;
  display_name: string;
  avatar_emoji: string;
  avatar_gradient: string;
}

type CallKind = "invite" | "accept" | "decline" | "offer" | "answer" | "ice" | "end";
type CallStatus = "ringing" | "connecting" | "connected" | "ended";

interface CallSignal {
  id: string;
  sender_id: string;
  recipient_id: string;
  call_id: string;
  kind: CallKind;
  payload: unknown;
}

interface CallOverlayProps {
  me: CallProfile;
  peer: CallProfile;
  video: boolean;
  callId: string;
  direction: "outgoing" | "incoming";
  onEnd: () => void;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function mediaErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return "Camera or microphone permission was denied. Allow access in your browser and try again.";
  if (name === "NotFoundError") return "No camera or microphone was found on this device.";
  if (name === "NotReadableError") return "Your camera or microphone is already being used by another app.";
  return "GhostChat could not access your camera or microphone on this device.";
}

export function CallOverlay({ me, peer, video, callId, direction, onEnd }: CallOverlayProps) {
  const [status, setStatus] = useState<CallStatus>(direction === "outgoing" ? "ringing" : "connecting");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const endedRef = useRef(false);

  const sendSignal = useCallback(async (kind: CallKind, payload: Record<string, unknown> = {}) => {
    const { error: signalError } = await supabase.from("call_signals").insert({
      sender_id: me.id,
      recipient_id: peer.id,
      call_id: callId,
      kind,
      payload: payload as Json,
    });
    if (signalError) throw signalError;
  }, [callId, me.id, peer.id]);

  const finish = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setStatus("ended");
    onEnd();
  }, [onEnd]);

  const hangUp = useCallback(async () => {
    if (!endedRef.current) {
      endedRef.current = true;
      try { await sendSignal("end"); } catch { /* the local call still closes */ }
    }
    onEnd();
  }, [onEnd, sendSignal]);

  useEffect(() => {
    let disposed = false;
    let channel: RealtimeChannel | null = null;
    const pendingCandidates: RTCIceCandidateInit[] = [];

    const closeWithError = (message: string) => {
      if (!disposed) setError(message);
    };

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
      ],
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      if (!disposed) setRemoteStream(stream);
    };
    pc.onconnectionstatechange = () => {
      if (disposed) return;
      if (pc.connectionState === "connected") {
        setStatus("connected");
        setError("");
      } else if (pc.connectionState === "failed") {
        closeWithError("The call could not connect on this network. Check both connections and try again.");
      } else if (pc.connectionState === "disconnected" && status === "connected") {
        closeWithError("The connection was interrupted. You can hang up and try again.");
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void sendSignal("ice", { candidate: event.candidate.toJSON() }).catch(() => {
          // A later candidate or the peer's reconnection may still establish the call.
        });
      }
    };

    const flushCandidates = async () => {
      if (!pc.remoteDescription) return;
      while (pendingCandidates.length) {
        const candidate = pendingCandidates.shift();
        if (candidate) await pc.addIceCandidate(candidate);
      }
    };

    const handleSignal = async (signal: CallSignal) => {
      if (disposed || signal.sender_id !== peer.id) return;
      try {
        const payload = asRecord(signal.payload);
        if (signal.kind === "end" || signal.kind === "decline") {
          if (signal.kind === "decline") setError("Call declined");
          window.setTimeout(() => { if (!disposed) finish(); }, signal.kind === "decline" ? 700 : 0);
        } else if (signal.kind === "accept" && direction === "outgoing") {
          if (!pc.localDescription) {
            setStatus("connecting");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal("offer", { sdp: offer });
          }
        } else if (signal.kind === "offer" && direction === "incoming") {
          setStatus("connecting");
          await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
          await flushCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal("answer", { sdp: answer });
        } else if (signal.kind === "answer" && direction === "outgoing") {
          await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
          await flushCandidates();
        } else if (signal.kind === "ice" && payload.candidate) {
          const candidate = payload.candidate as RTCIceCandidateInit;
          if (pc.remoteDescription) await pc.addIceCandidate(candidate);
          else pendingCandidates.push(candidate);
        }
        await supabase.from("call_signals").delete().eq("id", signal.id);
      } catch {
        closeWithError("The call connection failed. Hang up and try again.");
      }
    };

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Media devices are unavailable");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        channel = supabase.channel(`ghostcall-${callId}-${me.id}`)
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "call_signals",
            filter: `call_id=eq.${callId}`,
          }, (payload) => {
            const signal = payload.new as CallSignal;
            if (signal.recipient_id === me.id) void handleSignal(signal);
          })
          .subscribe((channelStatus) => {
            if (channelStatus !== "SUBSCRIBED" || disposed) return;
            void sendSignal(direction === "outgoing" ? "invite" : "accept", direction === "outgoing" ? { video } : {})
              .catch(() => closeWithError("The call invitation could not be sent. Check your connection and try again."));
          });
      } catch (mediaError) {
        closeWithError(mediaError instanceof Error && mediaError.message === "Media devices are unavailable"
          ? "Calls need a browser with camera and microphone support."
          : mediaErrorMessage(mediaError));
      }
    };

    void start();
    return () => {
      disposed = true;
      if (channel) void supabase.removeChannel(channel);
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      displayStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      pcRef.current = null;
    };
  }, [callId, direction, finish, me.id, peer.id, sendSignal, video]);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream, cameraOff]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      void remoteAudioRef.current.play().catch(() => { /* browser autoplay policy */ });
    }
  }, [remoteStream]);

  useEffect(() => {
    if (status !== "connected") return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "ringing") return;
    const timer = window.setTimeout(() => {
      setError("No answer. Try calling again later.");
      window.setTimeout(finish, 900);
    }, 45_000);
    return () => window.clearTimeout(timer);
  }, [finish, status]);

  const toggleMute = () => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setMuted(next);
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !next; });
    setCameraOff(next);
  };

  const toggleShare = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    if (sharing) {
      displayStreamRef.current?.getTracks().forEach((track) => track.stop());
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      const sender = pc.getSenders().find((item) => item.track?.kind === "video");
      if (!screenTrack || !sender) {
        display.getTracks().forEach((track) => track.stop());
        return;
      }
      displayStreamRef.current = display;
      await sender.replaceTrack(screenTrack);
      setSharing(true);
      screenTrack.onended = () => {
        void sender.replaceTrack(cameraTrack ?? null);
        displayStreamRef.current = null;
        setSharing(false);
      };
    } catch {
      // Cancelling the browser's screen picker leaves the call unchanged.
    }
  };

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  const statusText = error
    ? error
    : status === "connected"
      ? `${minutes}:${seconds}`
      : status === "ringing"
        ? "Ringing…"
        : "Connecting…";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] flex flex-col bg-chat-bg text-chat-text">
      <div className="relative flex-1 overflow-hidden bg-chat-bg">
        {remoteStream && video && (
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
        )}
        <audio ref={remoteAudioRef} autoPlay className="hidden" />
        {(!remoteStream || !video || status !== "connected") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br ${peer.avatar_gradient} text-7xl ring-2 ring-white/10 shadow-2xl`}>
              {peer.avatar_emoji}
            </div>
          </div>
        )}
        <div className="absolute inset-x-6 top-6 text-center">
          <div className="text-2xl font-semibold">{peer.display_name}</div>
          <div className="mt-1 text-xs text-chat-muted">{video ? "Video call" : "Voice call"}</div>
          <div className={`mx-auto mt-3 max-w-md text-sm leading-relaxed ${error ? "rounded-xl bg-destructive/15 px-4 py-3 text-destructive" : "text-chat-muted"}`}>
            {statusText}
          </div>
        </div>
        {video && localStream && (
          <motion.div drag dragMomentum={false} className="absolute right-5 top-5 h-32 w-24 cursor-move overflow-hidden rounded-xl bg-chat-panel ring-1 ring-white/15 shadow-xl">
            <video ref={localRef} autoPlay playsInline muted className={`h-full w-full object-cover ${cameraOff ? "hidden" : ""}`} />
            {cameraOff && <div className="flex h-full items-center justify-center text-3xl">{me.avatar_emoji}</div>}
          </motion.div>
        )}
        {error && (
          <button onClick={hangUp} className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs text-secondary-foreground hover:bg-chat-input">
            <X className="h-3.5 w-3.5" /> Close call
          </button>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 bg-chat-panel p-5">
        <CallButton label={muted ? "Unmute microphone" : "Mute microphone"} active={muted} onClick={toggleMute}
          icon={muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />} />
        {video && <CallButton label={cameraOff ? "Turn camera on" : "Turn camera off"} active={cameraOff} onClick={toggleCamera}
          icon={cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />} />}
        {video && <CallButton label={sharing ? "Stop sharing screen" : "Share screen"} active={sharing} onClick={() => void toggleShare()}
          icon={<MonitorUp className="h-5 w-5" />} />}
        <button onClick={() => void hangUp()} aria-label="Hang up" title="Hang up"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-destructive p-4 text-destructive-foreground transition hover:opacity-85">
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
}

function CallButton({ icon, active, onClick, label }: { icon: React.ReactNode; active?: boolean; onClick?: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition ${active ? "bg-chat-text text-chat-bg" : "bg-secondary text-secondary-foreground hover:bg-chat-input"}`}>
      {icon}
    </button>
  );
}
