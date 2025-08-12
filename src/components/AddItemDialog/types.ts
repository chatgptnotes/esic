
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (formData: Record<string, string>) => void;
  title: string;
  fields: FormField[];
}
