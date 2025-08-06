-- Adicionar coluna email_notifications na tabela notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;