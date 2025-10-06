import { withSwagger } from 'next-swagger-doc';

const swaggerHandler = withSwagger({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestión de Movimientos - API',
      version: '1.0.0',
      description: 'API para gestión de movimientos financieros con autenticación y roles',
      contact: {
        name: 'Soporte API',
        email: 'soporte@ejemplo.com'
      },
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth-token', // Ajusta según tu configuración de Better Auth
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Tipo de error',
            },
            message: {
              type: 'string',
              description: 'Descripción del error',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Movement: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cmgdaap1c0003uemky68p2rs6',
            },
            amount: {
              type: 'number',
              format: 'float',
              example: 100.50,
            },
            description: {
              type: 'string',
              example: 'Compra de insumos',
            },
            type: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
              example: 'EXPENSE',
            },
            date: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
            },
            userId: {
              type: 'string',
              example: 'user123',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'user123',
            },
            name: {
              type: 'string',
              example: 'Juan Pérez',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@ejemplo.com',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              example: 'USER',
            },
            emailVerified: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T00:00:00.000Z',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 10,
            },
            total: {
              type: 'integer',
              example: 45,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apiFolder: 'pages/api',
});

export default swaggerHandler();