
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSearchableCghsSurgery = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ['cghs-surgery', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('cghs_surgery')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching CGHS surgeries:', error);
        throw error;
      }
      
      return data;
    }
  });

  return {
    surgeries,
    isLoading,
    searchTerm,
    setSearchTerm
  };
};
