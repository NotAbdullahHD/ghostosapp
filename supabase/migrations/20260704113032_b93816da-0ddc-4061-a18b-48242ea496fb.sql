
CREATE POLICY "GhostDrop: users manage own files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'ghostdrop' AND owner = auth.uid())
WITH CHECK (bucket_id = 'ghostdrop' AND owner = auth.uid());
