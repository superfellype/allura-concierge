// CEP Auto-fill utility - ViaCEP API integration

export interface CepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Formats a CEP string to the standard format: 00000-000
 */
export function formatCep(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
}

/**
 * Removes formatting from CEP
 */
export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Validates if a CEP has the correct format (8 digits)
 */
export function isValidCep(cep: string): boolean {
  return cleanCep(cep).length === 8;
}

/**
 * Fetches address data from ViaCEP API
 */
export async function fetchAddressByCep(cep: string): Promise<AddressData | null> {
  const cleanedCep = cleanCep(cep);
  
  if (cleanedCep.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    const data: CepResult = await response.json();
    
    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch (error) {
    console.error('Error fetching CEP:', error);
    return null;
  }
}
