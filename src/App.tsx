import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuthBootstrap } from '@/features/auth/application/useAuthBootstrap';
import { AppRoutes } from '@/routes';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

function AuthBootstrap() {
  useAuthBootstrap();
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
