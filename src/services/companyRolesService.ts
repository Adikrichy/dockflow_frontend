import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

export interface Role {
  id: number;
  name: string;
  level: number;
  isSystem: boolean;
}

export const useCompanyRoles = () => {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.companyId;

  return useQuery({
    queryKey: ['companyRoles', companyId],
    queryFn: async (): Promise<Role[]> => {
      const response = await fetch(`/api/workflow/company/${companyId}/roles`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch company roles');
      }

      return response.json();
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
