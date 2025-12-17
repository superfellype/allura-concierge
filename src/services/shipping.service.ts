export interface ShippingOption {
  service: 'PAC' | 'SEDEX';
  name: string;
  price: number;
  days: number;
}

export interface ProductDimensions {
  weight_grams: number;
  height_cm: number;
  width_cm: number;
  length_cm: number;
}

// Tabela de preços base por região (simplificado)
const SHIPPING_BASE_PRICES = {
  PAC: {
    local: 15.90,   // Mesmo estado
    regional: 22.90, // Estados vizinhos
    nacional: 32.90  // Outros estados
  },
  SEDEX: {
    local: 25.90,
    regional: 38.90,
    nacional: 52.90
  }
};

// Tempo de entrega em dias úteis
const DELIVERY_DAYS = {
  PAC: {
    local: 5,
    regional: 8,
    nacional: 12
  },
  SEDEX: {
    local: 2,
    regional: 4,
    nacional: 6
  }
};

// UFs por região para cálculo de distância
const REGIONS: Record<string, string[]> = {
  sudeste: ['SP', 'RJ', 'MG', 'ES'],
  sul: ['PR', 'SC', 'RS'],
  centro_oeste: ['GO', 'MT', 'MS', 'DF'],
  nordeste: ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'],
  norte: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO']
};

// Estado de origem (Uberlândia - MG)
const ORIGIN_STATE = 'MG';
const ORIGIN_REGION = 'sudeste';

class ShippingService {
  private getRegionByState(state: string): string {
    for (const [region, states] of Object.entries(REGIONS)) {
      if (states.includes(state.toUpperCase())) {
        return region;
      }
    }
    return 'nacional';
  }

  private getDistanceType(destinationState: string): 'local' | 'regional' | 'nacional' {
    const destState = destinationState.toUpperCase();
    
    // Mesmo estado
    if (destState === ORIGIN_STATE) {
      return 'local';
    }
    
    // Mesma região
    const destRegion = this.getRegionByState(destState);
    if (destRegion === ORIGIN_REGION) {
      return 'regional';
    }
    
    // Regiões vizinhas ao Sudeste
    if (['sul', 'centro_oeste'].includes(destRegion)) {
      return 'regional';
    }
    
    return 'nacional';
  }

  private calculateWeightMultiplier(totalWeightGrams: number): number {
    const weightKg = totalWeightGrams / 1000;
    
    if (weightKg <= 0.5) return 1;
    if (weightKg <= 1) return 1.2;
    if (weightKg <= 2) return 1.5;
    if (weightKg <= 5) return 2;
    if (weightKg <= 10) return 2.8;
    return 3.5;
  }

  private calculateVolumetricWeight(dimensions: ProductDimensions[]): number {
    // Peso volumétrico = (C x L x A) / 6000 (em kg)
    let totalVolume = 0;
    
    for (const dim of dimensions) {
      const volume = dim.height_cm * dim.width_cm * dim.length_cm;
      totalVolume += volume;
    }
    
    return (totalVolume / 6000) * 1000; // Retorna em gramas
  }

  async calculateShipping(
    destinationCep: string,
    products: ProductDimensions[]
  ): Promise<{ data: ShippingOption[] | null; error: Error | null }> {
    try {
      // Busca o estado pelo CEP
      const cleanCep = destinationCep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        return { data: null, error: new Error('CEP inválido') };
      }

      // Determina o estado pelo prefixo do CEP
      const state = this.getStateFromCep(cleanCep);
      const distanceType = this.getDistanceType(state);

      // Calcula peso real e volumétrico
      const totalWeight = products.reduce((sum, p) => sum + (p.weight_grams || 300), 0);
      const volumetricWeight = this.calculateVolumetricWeight(products);
      const chargeableWeight = Math.max(totalWeight, volumetricWeight);
      
      const weightMultiplier = this.calculateWeightMultiplier(chargeableWeight);

      // Calcula opções de frete
      const options: ShippingOption[] = [
        {
          service: 'PAC',
          name: 'PAC - Correios',
          price: Math.round(SHIPPING_BASE_PRICES.PAC[distanceType] * weightMultiplier * 100) / 100,
          days: DELIVERY_DAYS.PAC[distanceType]
        },
        {
          service: 'SEDEX',
          name: 'SEDEX - Correios',
          price: Math.round(SHIPPING_BASE_PRICES.SEDEX[distanceType] * weightMultiplier * 100) / 100,
          days: DELIVERY_DAYS.SEDEX[distanceType]
        }
      ];

      return { data: options, error: null };
    } catch (error) {
      console.error('Error calculating shipping:', error);
      return { 
        data: this.getFallbackOptions(), 
        error: null 
      };
    }
  }

  private getStateFromCep(cep: string): string {
    const prefix = parseInt(cep.substring(0, 2));
    
    // Mapeamento de faixas de CEP para estados
    if (prefix >= 1 && prefix <= 19) return 'SP';
    if (prefix >= 20 && prefix <= 28) return 'RJ';
    if (prefix >= 29 && prefix <= 29) return 'ES';
    if (prefix >= 30 && prefix <= 39) return 'MG';
    if (prefix >= 40 && prefix <= 48) return 'BA';
    if (prefix >= 49 && prefix <= 49) return 'SE';
    if (prefix >= 50 && prefix <= 56) return 'PE';
    if (prefix >= 57 && prefix <= 57) return 'AL';
    if (prefix >= 58 && prefix <= 58) return 'PB';
    if (prefix >= 59 && prefix <= 59) return 'RN';
    if (prefix >= 60 && prefix <= 63) return 'CE';
    if (prefix >= 64 && prefix <= 64) return 'PI';
    if (prefix >= 65 && prefix <= 65) return 'MA';
    if (prefix >= 66 && prefix <= 68) return 'PA';
    if (prefix >= 69 && prefix <= 69) return 'AM';
    if (prefix >= 70 && prefix <= 73) return 'DF';
    if (prefix >= 74 && prefix <= 76) return 'GO';
    if (prefix >= 77 && prefix <= 77) return 'TO';
    if (prefix >= 78 && prefix <= 78) return 'MT';
    if (prefix >= 79 && prefix <= 79) return 'MS';
    if (prefix >= 80 && prefix <= 87) return 'PR';
    if (prefix >= 88 && prefix <= 89) return 'SC';
    if (prefix >= 90 && prefix <= 99) return 'RS';
    
    return 'SP'; // Default
  }

  private getFallbackOptions(): ShippingOption[] {
    return [
      {
        service: 'PAC',
        name: 'PAC - Correios',
        price: 25.90,
        days: 10
      },
      {
        service: 'SEDEX',
        name: 'SEDEX - Correios',
        price: 45.90,
        days: 5
      }
    ];
  }

  // Verifica se o frete é grátis
  checkFreeShipping(subtotal: number, threshold: number = 299): boolean {
    return subtotal >= threshold;
  }
}

export const shippingService = new ShippingService();
