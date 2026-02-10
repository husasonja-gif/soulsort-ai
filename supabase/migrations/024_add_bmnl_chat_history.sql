-- Add chat_history column to bmnl_participants for full conversation context
-- This stores the complete chat history (questions + answers + commentary) for organizer review

ALTER TABLE public.bmnl_participants
ADD COLUMN IF NOT EXISTS chat_history JSONB;

CREATE INDEX IF NOT EXISTS idx_bmnl_participants_chat_history ON public.bmnl_participants USING GIN (chat_history);


