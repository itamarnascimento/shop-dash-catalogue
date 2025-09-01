-- Add stripe_session_id column to orders table for payment tracking
ALTER TABLE public.orders 
ADD COLUMN stripe_session_id TEXT UNIQUE;