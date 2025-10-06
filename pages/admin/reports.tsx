import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Download, ArrowLeft, BookOpen, TrendingUp } from 'lucide-react';

interface SummaryData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

interface ChartDataPoint {
  date: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

export default function AdminReports() {
  const router = useRouter();
  const [period, setPeriod] = useState('month');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        // Ya no enviamos userIds, el backend debe devolver todos los movimientos
      });

      const response = await fetch(`/api/reports/summary?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
        
        // Transformar datos para Recharts
        if (data.labels && data.datasets) {
          const transformedData: ChartDataPoint[] = data.labels.map((label: string, index: number) => {
            const incomeDataset = data.datasets.find((d: any) => d.label === 'Ingresos');
            const expenseDataset = data.datasets.find((d: any) => d.label === 'Egresos');
            const balanceDataset = data.datasets.find((d: any) => d.label === 'Balance');
            
            return {
              date: label,
              ingresos: incomeDataset?.data[index] || 0,
              egresos: expenseDataset?.data[index] || 0,
              balance: balanceDataset?.data[index] || 0
            };
          });
          setChartData(transformedData);
        }
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
        period,
        format: 'csv'
      });

      const response = await fetch(`/api/reports/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `reporte-financiero-${new Date().toISOString().split('T')[0]}.csv`;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 border shadow-sm bg-background">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {formatCurrency(entry.value)}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  // Actualizar cuando cambie el período
  useEffect(() => {
    fetchReportData();
  }, [period]);

  return (
    <AuthGuard requiredRole="ADMIN">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes Financieros</h1>
            <p className="text-muted-foreground">
              Resumen completo de todos los movimientos del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/docs')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Documentación API
            </Button>
          </div>
        </div>

        {/* Controles simplificados */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Reporte</CardTitle>
            <CardDescription>
              Selecciona el período de tiempo para el análisis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector de período */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período de Tiempo</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Últimas 24 horas</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mes</SelectItem>
                    <SelectItem value="year">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botones de acción */}
              <div className="flex items-end gap-2">
                <Button 
                  onClick={fetchReportData} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {loading ? 'Actualizando...' : 'Actualizar Datos'}
                </Button>
                <Button 
                  onClick={handleExport} 
                  disabled={exporting || loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de resumen */}
        {summaryData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(summaryData.totalIncome)}
                </div>
                <Badge variant="secondary" className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 mt-2">
                  INGRESOS
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {formatCurrency(summaryData.totalExpense)}
                </div>
                <Badge variant="secondary" className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200 mt-2">
                  EGRESOS
                </Badge>
              </CardContent>
            </Card>

            <Card className={`border-blue-200 dark:border-blue-800 ${
              summaryData.totalBalance >= 0 
                ? 'bg-blue-50 dark:bg-blue-950' 
                : 'bg-orange-50 dark:bg-orange-950'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${
                  summaryData.totalBalance >= 0 
                    ? 'text-blue-700 dark:text-blue-400' 
                    : 'text-orange-700 dark:text-orange-400'
                }`}>
                  <TrendingUp className="h-4 w-4" />
                  Balance Final
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  summaryData.totalBalance >= 0 
                    ? 'text-blue-700 dark:text-blue-400' 
                    : 'text-orange-700 dark:text-orange-400'
                }`}>
                  {formatCurrency(summaryData.totalBalance)}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 ${
                    summaryData.totalBalance >= 0 
                      ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' 
                      : 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                  }`}
                >
                  {summaryData.totalBalance >= 0 ? 'POSITIVO' : 'NEGATIVO'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución Financiera</CardTitle>
            <CardDescription>
              Tendencia de ingresos, egresos y balance acumulado en el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Cargando datos del gráfico...</p>
                </div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toLocaleString('es-ES')}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      name="Ingresos"
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="egresos" 
                      name="Egresos"
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      name="Balance"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed rounded-lg">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No hay datos para mostrar</p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  No se encontraron movimientos en el período seleccionado
                </p>
                <Button onClick={fetchReportData}>
                  Intentar de nuevo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navegación */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/movements')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver Movimientos
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}