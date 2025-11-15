/**
 * Virtual Try-On Types
 * 
 * TypeScript interfaces and types for the Virtual Try-On feature
 */

export interface GenerateTryOnResponse {
  success: boolean;
  data?: any;
  imageUrl?: string | null;
  fileName?: string;
  filePath?: string;
  error?: string;
}

export interface TaskResponse {
  code: number;
  data: {
    task_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    output?: {
      image_urls?: string[];
    };
    error?: {
      message?: string;
    };
  };
  message: string;
}
