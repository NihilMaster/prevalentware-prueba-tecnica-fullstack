module.exports = {
  apiFolder: 'pages/api',
  schemaFolders: ['pages/api'],
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestión de Movimientos - API',
      version: '1.0.0',
      description: 'API completa para gestión de movimientos financieros con autenticación y sistema de roles',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
  },
};