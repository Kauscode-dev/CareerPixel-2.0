import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadFile = async (bucket: string, filePath: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  return data;
};

export const downloadFile = async (bucket: string, filePath: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (error) {
    throw error;
  }

  return data;
};

export const deleteFile = async (bucket: string, filePath: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw error;
  }

  return data;
};

export const listFiles = async (bucket: string, folder?: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder);

  if (error) {
    throw error;
  }

  return data;
};

export const getPublicUrl = (bucket: string, filePath: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
};