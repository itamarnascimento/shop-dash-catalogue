import { supabase } from "@/integrations/supabase/client"
import imageCompression from 'browser-image-compression';
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

  const urlPublic = supabase.storage
    .from('imagens')
    .getPublicUrl(filePath)

  return { ...data, urlImage: urlPublic.data.publicUrl }
}


export const imageCompressionProcess = (file: File, quality = 0.8, maxWidth = 1024): Promise<Blob> => {
  if (!file) return;

  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Redimensiona mantendo proporção
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Salva em WebP
          canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Falha ao gerar WebP')),
            'image/webp',
            quality // 0 a 1
          );
        };
      };

      reader.onerror = reject;
    });
  } catch (error) {
    console.error('Erro ao comprimir/enviar a imagem:', error);
  }
}
