module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Gestión de Movimientos - API',
    version: '1.0.0',
    description: `
# Documentación de la API

Esta API permite gestionar movimientos financieros con un sistema completo de autenticación y roles.

## Autenticación

Todos los endpoints (excepto /api/docs) requieren autenticación mediante cookies.

## Roles

- **USER**: Puede gestionar sus propios movimientos
- **ADMIN**: Puede gestionar todos los movimientos y usuarios

## Códigos de Estado

- **200**: Éxito
- **201**: Recurso creado
- **400**: Datos inválidos
- **401**: No autenticado
- **403**: Sin permisos suficientes
- **404**: Recurso no encontrado
- **409**: Conflicto (ej. email duplicado)
- **500**: Error interno del servidor

## Ejemplos de Uso

### Crear un movimiento
\`\`\`bash
curl -X POST /api/movements \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 150.75,
    "description": "Compra de supermercado",
    "type": "EXPENSE"
  }'
\`\`\`

### Obtener reporte de movimientos
\`\`\`bash
curl -X GET "/api/reports/summary?period=month&userIds=all"
\`\`\`
    `,
  },
  servers: [
    {
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      description: 'Servidor de desarrollo',
    },
  ],
};
