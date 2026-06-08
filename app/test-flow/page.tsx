import type { Metadata } from 'next';
import { FlowVisualization } from '@/components/sections/FlowVisualization';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TestFlowPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FAF8F5 0%, #F5F2ED 100%)',
        padding: '48px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}
    >
      <header style={{ textAlign: 'center', maxWidth: '720px' }}>
        <p
          style={{
            color: '#F59E0B',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Test isolado · solo este componente carga
        </p>
        <h1
          style={{
            fontSize: '40px',
            fontWeight: 700,
            color: '#2A2A2A',
            margin: '0 0 12px',
          }}
        >
          De la semilla al mercado
        </h1>
        <p style={{ color: '#4A4A4A', fontSize: '16px', lineHeight: 1.5 }}>
          Recorre cada etapa de nuestro proceso operativo. Una cadena integrada donde cada decisión se basa en datos, tecnología y supervisión.
        </p>
      </header>

      <FlowVisualization />
    </main>
  );
}
