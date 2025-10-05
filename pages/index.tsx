import { signIn } from '@/lib/auth/client';

export default function LoginPage() {
  const handleGitHubLogin = async () => {
    await signIn.social({
      provider: 'github',
      callbackURL: '/dashboard', // Redirige aquí después del login
    });
  };

  return (
    <div>
      <button onClick={handleGitHubLogin}>
        Login con GitHub
      </button>
    </div>
  );
}

// const Home = () => <main className=''>Home</main>;
// export default Home;
