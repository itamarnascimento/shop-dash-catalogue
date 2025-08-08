import { supabase } from "@/integrations/supabase/client"

interface UploadFileProps {
  bucketName: string;
  filePath: string;
  file: File
}

export const UploadFile = async (props: UploadFileProps) => {
  const { bucketName, file, filePath } = props
  const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    upsert: true,    
  })

  if (error) throw error

  return data
}