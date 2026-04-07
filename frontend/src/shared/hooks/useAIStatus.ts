import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/features/settings/api/settings";

/**
 * Hook to check if AI features should be enabled in the UI.
 * This depends on the 'ai_enabled' flag fetched from the backend settings,
 * which in turn depends on whether AI_API_KEY is configured.
 */
export const useAIStatus = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 1000 * 60 * 30, // Settings don't change often, cache for 30 mins
    refetchOnWindowFocus: false,
  });

  return {
    isAIEnabled: !!data?.ai_enabled,
    isLoading,
    isError,
  };
};
