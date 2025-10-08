import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { signIn } from '@/lib/auth/client';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleGitHubLogin = async () => {
    await signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    });
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <button onClick={handleGitHubLogin}>Login con GitHub</button>
    </div>
  );
}

// const Home = () => <main className=''>Home</main>;
// export default Home;
