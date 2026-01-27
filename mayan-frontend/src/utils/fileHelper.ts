// ✅ CORRECTO: Helpers genéricos para archivos
export const validateFile = (file: File, maxSizeMB = 10): string | null => {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Archivo demasiado grande (máx: ${maxSizeMB}MB)`;
  }
  
  const allowedTypes = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return 'Tipo de archivo no permitido';
  }
  
  return null;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
export const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return '📄';
  if (['jpg', 'png', 'gif'].includes(ext)) return '🖼️';
  if (['doc', 'docx'].includes(ext)) return '📝';
  return '📎';
};
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};