import { GetStaticProps } from 'next';
import { createSwaggerSpec } from 'next-swagger-doc';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import AuthGuard from '@/components/layout/AuthGuard';

interface ApiDocsProps {
  spec: any;
}

export default function ApiDocs({ spec }: ApiDocsProps) {
  return (
    <AuthGuard requiredRole='ADMIN'>
      <div>
        <style jsx global>{`
          .swagger-ui .information-container {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .swagger-ui .scheme-container {
            background: #e3f2fd;
            padding: 10px;
            border-radius: 4px;
          }
        `}</style>
        <SwaggerUI spec={spec} />
      </div>
    </AuthGuard>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Sistema de Gestión de Movimientos - API',
        version: '1.0.0',
        description:
          'Documentación interactiva de la API para gestión de movimientos financieros',
      },
      servers: [
        {
          url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          description: 'Servidor de desarrollo',
        },
      ],
    },
  });

  return {
    props: {
      spec,
    },
  };
};
