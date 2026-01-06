import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

export interface Role {
  id: number;
  name: string;
  level: number;
  isSystem: boolean;
}

export const useCompanyRoles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['companyRoles'],
    queryFn: async (): Promise<Role[]> => {
      const response = await fetch('/api/company/getAllRoles', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch company roles');
      }

      return response.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
