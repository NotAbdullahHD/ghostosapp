CREATE TABLE public.call_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('invite', 'accept', 'decline', 'offer', 'answer', 'ice', 'end')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT call_signals_no_self CHECK (sender_id <> recipient_id),
  CONSTRAINT call_signals_payload_size CHECK (octet_length(payload::text) <= 65536)
);
GRANT SELECT, INSERT, DELETE ON public.call_signals TO authenticated;
GRANT ALL ON public.call_signals TO service_role;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE INDEX call_signals_recipient_idx ON public.call_signals (recipient_id, created_at DESC);
CREATE INDEX call_signals_call_idx ON public.call_signals (call_id, created_at);

CREATE POLICY "View own call signals" ON public.call_signals
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Send call signals to accepted friend" ON public.call_signals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = auth.uid() AND f.addressee_id = recipient_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = recipient_id))
    )
  );

CREATE POLICY "Delete own call signals" ON public.call_signals
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

ALTER TABLE public.call_signals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;