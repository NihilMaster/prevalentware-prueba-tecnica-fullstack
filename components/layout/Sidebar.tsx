import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const router = useRouter();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', roles: ['USER', 'ADMIN'] },
    { name: 'Movimientos', href: '/movements', roles: ['USER', 'ADMIN'] },
  ];

  const adminNavigation = [
    { name: 'Usuarios', href: '/admin/users', roles: ['ADMIN'] },
    { name: 'Reportes', href: '/admin/reports', roles: ['ADMIN'] },
  ];

  const isActive = (path: string) => router.pathname === path;

  // Si no hay usuario, no mostrar sidebar
  if (!user) {
    return null;
  }

  return (
    <aside className='w-64 bg-white shadow-sm min-h-screen'>
      <nav className='mt-8'>
        <div className='px-4 space-y-2'>
          {navigation.map((item) => {
            if (!item.roles.includes(user?.role || '')) return null;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          {user?.role === 'ADMIN' && (
            <>
              <div className='pt-4 border-t'>
                <p className='px-4 text-xs font-semibold text-gray-500 uppercase'>
                  Admin
                </p>
              </div>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </div>
      </nav>
    </aside>
  );
}
