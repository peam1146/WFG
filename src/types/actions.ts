// Server Actions result types for WFG Git Log Viewer

export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export interface FormState {
  message?: string;
  errors?: Record<string, string[]>;
}

// Form data types for Server Actions
export interface GitFilterFormData {
  author: string;
  since: string; // Date string from form input
}

export interface SummaryGenerationFormData {
  author: string;
  since: string;
  refresh?: boolean;
}
