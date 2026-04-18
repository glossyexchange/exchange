export const appendFormData = (
  formData: FormData,
  key: string,
  value: string | number | Blob | boolean | Date | null | undefined
) => {
  if (value == null) return;
  
  if (value instanceof Blob) {
    formData.append(key, value);
  } else if (value instanceof Date) {
    formData.append(key, value.toISOString());
  } else {
    formData.append(key, String(value));
  }
};