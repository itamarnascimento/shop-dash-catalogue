-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create a function to update profile email when user data changes
CREATE OR REPLACE FUNCTION public.update_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update profile email when user email changes
  UPDATE public.profiles 
  SET email = NEW.email 
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update profile email
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_email();

-- Update existing profiles with user emails
UPDATE public.profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.user_id = auth.users.id 
AND profiles.email IS NULL;