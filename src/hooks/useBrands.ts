import { useState, useEffect, useCallback } from "react";
import { brandsService, Brand } from "@/services/brands.service";

export function useBrands(activeOnly = true) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = activeOnly 
      ? await brandsService.getActive()
      : await brandsService.getAll();

    if (fetchError) {
      setError(fetchError);
    } else {
      setBrands(data || []);
    }
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return { brands, loading, error, refetch: fetchBrands };
}
