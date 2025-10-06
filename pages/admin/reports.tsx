import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import AuthGuard from '@/components/layout/AuthGuard'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface User {
  id: string;
  name: string;
  email: string;
}

interface SummaryData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
  }[];
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export default function AdminReports() {
  const router = useRouter();
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(['all']);
  const [period, setPeriod] = useState('month');
  const [chartData, setChartData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchReportData();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        userIds: selectedUsers.join(',')
      });

      const response = await fetch(`/api/reports/summary?${params}`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        userIds: selectedUsers.join(','),
        period
      });

      const response = await fetch(`/api/reports/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `reporte-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al exportar el reporte');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const handleUserSelection = (userId: string) => {
    if (userId === 'all') {
      setSelectedUsers(['all']);
    } else {
      const newSelection = selectedUsers.includes('all') 
        ? [userId]
        : selectedUsers.includes(userId)
        ? selectedUsers.filter(id => id !== userId)
        : [...selectedUsers, userId];
      
      setSelectedUsers(newSelection.length > 0 ? newSelection : ['all']);
    }
  };

  // Configuración del gráfico
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString('es-ES');
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución de Ingresos y Egresos',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
  };

  // Preparar datos para Chart.js
  const preparedChartData: ChartData<'line'> = chartData ? {
    labels: chartData.labels,
    datasets: chartData.datasets.map(dataset => ({
      ...dataset,
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointBackgroundColor: dataset.borderColor,
      pointBorderColor: dataset.borderColor,
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }))
  } : {
    labels: [],
    datasets: []
  };

  return (
    <AuthGuard requiredRole="ADMIN">
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Reportes y Análisis</h1>
      
      {/* Controles */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr auto auto',
        gap: '1rem', 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        {/* Selector de período */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Período:
          </label>
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="day">Últimas 24 horas</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </select>
        </div>

        {/* Selector de usuarios */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Usuarios:
          </label>
          <select 
            multiple
            value={selectedUsers}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedUsers(options);
            }}
            style={{ width: '100%', padding: '0.5rem', height: '100px' }}
          >
            <option value="all">Todos los usuarios</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            Mantén Ctrl para seleccionar múltiples
          </div>
        </div>

        {/* Botón actualizar */}
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button 
            onClick={fetchReportData}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {/* Botón exportar */}
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button 
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: exporting ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: exporting ? 'not-allowed' : 'pointer'
            }}
          >
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Resumen de totales */}
      {chartData && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem', 
          marginBottom: '2rem'
        }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#2e7d32' }}>Total Ingresos</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
              ${chartData.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#ffebee', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#c62828' }}>Total Egresos</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#c62828' }}>
              ${chartData.totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1565c0' }}>Balance Final</h3>
            <p style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: chartData.totalBalance >= 0 ? '#2e7d32' : '#c62828'
            }}>
              ${chartData.totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Gráfico con Chart.js */}
      <div style={{ 
        padding: '2rem', 
        backgroundColor: 'white', 
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3>Evolución de Ingresos y Egresos</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px dashed #ddd'
            }}>
              Cargando datos del gráfico...
            </div>
          </div>
        ) : chartData && chartData.labels.length > 0 ? (
          <div style={{ height: '500px', position: 'relative' }}>
            <Line 
              ref={chartRef}
              data={preparedChartData}
              options={chartOptions}
            />
            
            {/* Botones de acción del gráfico */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                    alert('Resetear Vista');
                  /*if (chartRef.current) {
                    chartRef.current.resetZoom();
                  }*/
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Resetear Vista
              </button>
              
              <button
                onClick={() => {
                  if (chartRef.current) {
                    const chart = chartRef.current;
                    const image = chart.toBase64Image();
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = `grafico-${new Date().toISOString().split('T')[0]}.png`;
                    link.click();
                  }
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Descargar PNG
              </button>
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            backgroundColor: '#f8f9fa',
            border: '1px dashed #ddd',
            borderRadius: '4px'
          }}>
            <div style={{ color: '#666', marginBottom: '1rem' }}>
              No hay datos para mostrar en el período seleccionado.
            </div>
            <button 
              onClick={fetchReportData}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>

      {/* Información de debug (opcional) */}
      {chartData && process.env.NODE_ENV === 'development' && (
        <details style={{ marginBottom: '2rem' }}>
          <summary style={{ cursor: 'pointer', color: '#666' }}>
            Información de Debug (Solo Desarrollo)
          </summary>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '4px',
            marginTop: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <strong>Datos del gráfico:</strong>
            <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
              {JSON.stringify({
                labels: chartData.labels,
                datasets: chartData.datasets.map(d => ({
                  label: d.label,
                  dataPoints: d.data.length,
                  min: Math.min(...d.data),
                  max: Math.max(...d.data),
                  avg: d.data.reduce((a, b) => a + b, 0) / d.data.length
                }))
              }, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {/* Navegación */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => router.push('/admin/users')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Gestión de Usuarios
        </button>
        
        <button 
          onClick={() => router.push('/movements')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Movimientos
        </button>
      </div>

      <button 
        onClick={() => router.push('/docs')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        📚 Ver Documentación API
      </button>
    </div>
    </AuthGuard>

  );
}