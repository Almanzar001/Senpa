import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import EnvironmentalAnalyticsService from '../services/environmentalAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LabelList
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

type ChartType = 'vertical-bar' | 'pie' | 'combined';
type DataType = 
  | 'operativos-por-region'
  | 'detenidos-por-region'
  | 'vehiculos-por-region'
  | 'casos-procuraduria-por-region'
  | 'operativos-por-provincia'
  | 'detenidos-por-provincia'
  | 'vehiculos-por-provincia'
  | 'casos-procuraduria-por-provincia'
  | 'combinado-por-region'
  | 'combinado-por-provincia'
  | 'incautaciones-por-tipo'
  | 'tabla-resumen-areas-tematicas';

interface ChartConfig {
  id: string;
  chartType: ChartType;
  dataType: DataType;
  dateFrom: string;
  dateTo: string;
  title: string;
}

interface ChartBuilderProps {}

const ChartBuilder: React.FC<ChartBuilderProps> = () => {
  const { cases, filteredCases, loading } = useData();
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('vertical-bar');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('operativos-por-region');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  // Función para agregar un nuevo gráfico
  const addChart = () => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chartType: selectedChartType,
      dataType: selectedDataType,
      dateFrom,
      dateTo,
      title: getDataTypeLabel(selectedDataType)
    };
    setCharts(prev => [...prev, newChart]);
  };

  // Función para eliminar un gráfico
  const removeChart = (chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  // Función para limpiar todos los gráficos
  const clearAllCharts = () => {
    setCharts([]);
  };

  // Función para exportar gráficos a PDF
  const exportToPDF = async () => {
    if (charts.length === 0) {
      alert('No hay gráficos para exportar');
      return;
    }

    setIsExporting(true);
    
    try {
      // Esperar un momento para que todos los gráficos se rendericen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      // Título del documento
      pdf.setFontSize(16);
      pdf.text('Reporte de Gráficos - Dashboard SENPA', pageWidth / 2, 20, { align: 'center' });
      
      // Fecha de generación
      pdf.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('es-ES');
      pdf.text(`Generado el: ${currentDate}`, pageWidth / 2, 30, { align: 'center' });
      
      let yPosition = 45;
      let chartCount = 0;
      let chartsOnCurrentPage = 0;
      
      // Procesar cada gráfico
      for (const chart of charts) {
        try {
          // Buscar el elemento del gráfico
          const chartElement = document.querySelector(`[data-chart-id="${chart.id}"]`) as HTMLElement;
          if (!chartElement) {
            console.error(`❌ No se encontró el gráfico con ID: ${chart.id}`);
            continue;
          }

          // Buscar el contenedor del gráfico (div con altura específica)
          let chartContainer = chartElement.querySelector('.h-80') as HTMLElement;
          if (!chartContainer) {
            // Para gráficos combinados, buscar por atributo de estilo o clase específica
            chartContainer = chartElement.querySelector('div[class*="h-[500px]"]') as HTMLElement;
          }
          if (!chartContainer) {
            // Como último recurso, buscar el primer div que contenga el ResponsiveContainer
            const containers = chartElement.querySelectorAll('div');
            for (const container of containers) {
              if (container.querySelector('.recharts-responsive-container')) {
                chartContainer = container as HTMLElement;
                break;
              }
            }
          }
          if (!chartContainer) {
            console.warn(`❌ No se encontró contenedor en el gráfico: ${chart.title}`);
            continue;
          }

          // Verificar si necesitamos nueva página (después de 2 gráficos por página)
          if (chartsOnCurrentPage >= 2) {
            pdf.addPage();
            yPosition = 20;
            chartsOnCurrentPage = 0;
          }
          
          // Título del gráfico
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(chart.title, margin, yPosition);
          yPosition += 4;
          
          // Información adicional del gráfico
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          
          // Tipo de gráfico
          const chartTypeLabel = chart.chartType === 'vertical-bar' ? 'Barras Verticales' : 
                                chart.chartType === 'combined' ? 'Gráfico Combinado' : 'Gráfico Circular';
          pdf.text(`Tipo: ${chartTypeLabel}`, margin, yPosition);
          yPosition += 3;
          
          // Período si existe
          if (chart.dateFrom || chart.dateTo) {
            const periodText = chart.dateFrom && chart.dateTo ? 
              `Período: ${chart.dateFrom} a ${chart.dateTo}` : 
              chart.dateFrom ? `Desde: ${chart.dateFrom}` : `Hasta: ${chart.dateTo}`;
            pdf.text(periodText, margin, yPosition);
            yPosition += 3;
          }
          
          // Total de casos - manejar gráficos combinados
          const chartData = generateChartData(chart);
          let totalCases: number;
          
          if (chart.chartType === 'combined') {
            // Para gráficos combinados, calcular el total de todas las métricas
            totalCases = chartData.reduce((sum: number, item: any) => {
              return sum + (item.operativos || 0) + (item.detenidos || 0) + (item.vehiculos || 0) + (item.patrullas || 0);
            }, 0);
          } else {
            // Para gráficos simples
            totalCases = chartData.reduce((sum, item: any) => sum + (item.value || 0), 0);
          }
          
          pdf.text(`Total de casos: ${totalCases}`, margin, yPosition);
          yPosition += 6;
          
          
          // Esperar a que el gráfico se renderice completamente
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Capturar el contenedor del gráfico
          const canvas = await html2canvas(chartContainer, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: true,
            useCORS: true,
            allowTaint: false,
            foreignObjectRendering: false,
            removeContainer: false,
            width: chartContainer.offsetWidth,
            height: chartContainer.offsetHeight
          });
          
          
          if (canvas.width === 0 || canvas.height === 0) {
            console.error(`❌ Canvas vacío para: ${chart.title}`);
            throw new Error(`Canvas vacío para el gráfico: ${chart.title}`);
          }
          
          const imgData = canvas.toDataURL('image/png', 0.9);
          
          // Calcular dimensiones para 2 gráficos por página
          const maxWidth = pageWidth - (2 * margin);
          const maxHeight = (pageHeight - 80) / 2 - 25; // Espacio optimizado para encabezados pequeños
          
          const aspectRatio = canvas.height / canvas.width;
          let imgWidth = maxWidth;
          let imgHeight = imgWidth * aspectRatio;
          
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight / aspectRatio;
          }
          
          // Centrar la imagen
          const xPosition = (pageWidth - imgWidth) / 2;
          
          
          // Agregar imagen al PDF
          pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20; // Espacio reducido entre gráficos
          
          chartCount++;
          chartsOnCurrentPage++;
          
          // Pausa entre capturas para estabilidad
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (chartError) {
          console.error(`❌ Error procesando gráfico ${chart.title}:`, chartError);
          // Continuar con el siguiente gráfico en lugar de fallar completamente
          continue;
        }
      }
      
      
      if (chartCount === 0) {
        throw new Error('No se pudieron procesar los gráficos. Verifica que los gráficos estén visibles y completamente cargados.');
      }
      
      // Guardar el PDF
      const fileName = `graficos-senpa-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      alert(`PDF generado exitosamente con ${chartCount} gráfico(s) en ${Math.ceil(chartCount / 2)} página(s)`);
      
    } catch (error) {
      console.error('❌ Error completo al exportar PDF:', error);
      alert(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Función para exportar gráficos a Excel
  const exportToExcel = () => {
    if (charts.length === 0) {
      alert('No hay gráficos para exportar');
      return;
    }

    try {
      // Crear un nuevo libro de trabajo
      const workbook = XLSX.utils.book_new();
      
      // Para cada gráfico, crear una hoja
      charts.forEach((chart, index) => {
        const chartData = generateChartData(chart);
        
        if (chartData.length === 0) {
          return; // Saltar gráficos sin datos
        }

        let excelData: any[][] = [];
        
        // Encabezado común
        excelData.push(
          ['DASHBOARD SENPA - REPORTE DE GRÁFICOS'],
          [''],
          ['Título:', chart.title],
          ['Tipo de Gráfico:', chart.chartType === 'vertical-bar' ? 'Barras Verticales' : 
                              chart.chartType === 'combined' ? 'Gráfico Combinado' : 'Gráfico Circular'],
          ...(chart.dateFrom || chart.dateTo ? [
            ['Período:', chart.dateFrom && chart.dateTo ? 
              `${chart.dateFrom} a ${chart.dateTo}` : 
              chart.dateFrom ? `Desde ${chart.dateFrom}` : `Hasta ${chart.dateTo}`]
          ] : []),
          ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
          ['']
        );

        // Verificar si es un gráfico combinado o tabla resumen
        if (chart.chartType === 'combined') {
          // Para gráficos combinados, mostrar datos detallados sin totales
          excelData.push(
            // Encabezados detallados para gráfico combinado
            ['Región/Provincia', 'Operativos', 'Detenidos', 'Vehículos', 'Patrullas']
          );
          
          // Datos detallados
          chartData.forEach((item: any) => {
            excelData.push([
              item.name || 'N/A',
              item.operativos || 0,
              item.detenidos || 0,
              item.vehiculos || 0,
              item.patrullas || 0
            ]);
          });

          // Ajustar el ancho de las columnas para gráfico combinado
          const worksheet = XLSX.utils.aoa_to_sheet(excelData);
          worksheet['!cols'] = [
            { wch: 20 }, // Región/Provincia
            { wch: 12 }, // Operativos
            { wch: 12 }, // Detenidos
            { wch: 12 }, // Vehículos
            { wch: 12 }  // Patrullas
          ];
          
          // Nombre de la hoja
          let sheetName = `Combinado ${index + 1}`;
          if (chart.title.includes('Región')) {
            sheetName = 'Comb por Región';
          } else if (chart.title.includes('Provincia')) {
            sheetName = 'Comb por Provincia';
          }
          
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
          
        } else if (chart.dataType === 'tabla-resumen-areas-tematicas') {
          // Para tabla resumen por áreas temáticas
          if (chartData.length > 0) {
            // Obtener las regiones (columnas)
            const regiones = Object.keys(chartData[0].regiones);
            
            // Crear encabezados dinámicos
            const headers = ['Categoría', 'Área Temática', ...regiones.map(r => `Región ${r}`), 'Total'];
            excelData.push(headers);
            
            // Agregar datos de la tabla
            chartData.forEach((fila: any) => {
              const rowData = [
                fila.categoria,
                fila.areaTematica,
                ...regiones.map(region => fila.regiones[region] || 0),
                fila.total
              ];
              
              excelData.push(rowData);
            });
            
            // Crear hoja principal
            const worksheetResumen = XLSX.utils.aoa_to_sheet(excelData);
            
            // Ajustar anchos de columna
            const colWidths = [
              { wch: 20 }, // Categoría
              { wch: 25 }, // Área Temática
              ...regiones.map(() => ({ wch: 12 })), // Regiones
              { wch: 12 }  // Total
            ];
            worksheetResumen['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(workbook, worksheetResumen, 'Resumen Áreas');
          }
          
        } else {
          // Para gráficos simples (barras y pie) sin totales
          excelData.push(
            // Encabezados simples
            ['Categoría', 'Cantidad']
          );
          
          // Datos simples
          chartData.forEach((item: any) => {
            excelData.push([item.name || 'N/A', item.value || 0]);
          });

          // Crear la hoja de trabajo para gráficos simples
          const worksheet = XLSX.utils.aoa_to_sheet(excelData);
          
          // Ajustar el ancho de las columnas para gráficos simples
          worksheet['!cols'] = [
            { wch: 30 }, // Categoría
            { wch: 15 }  // Cantidad
          ];

          // Nombre de la hoja (limitado a 31 caracteres para Excel)
          let sheetName = `Gráfico ${index + 1}`;
          if (chart.title.length <= 25) {
            sheetName = chart.title.substring(0, 25);
          }
          
          // Agregar la hoja al libro
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
      });

      // Si no se procesaron gráficos
      if (workbook.SheetNames.length === 0) {
        alert('No hay datos para exportar');
        return;
      }

      // Generar el archivo y descargarlo
      const fileName = `graficos-senpa-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert(`Excel generado exitosamente con ${workbook.SheetNames.length} hoja(s)`);
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert(`Error al generar el archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Función para generar datos de un gráfico específico
  const generateChartData = (chart: ChartConfig) => {
    // Determinar qué casos usar - SIEMPRE usar todos los casos para gráficos combinados
    const baseCases = cases; // Usar siempre todos los casos sin filtros previos
    
    
    if (!baseCases || baseCases.length === 0) {
      return [];
    }

    // Aplicar filtros de fecha si los hay
    let casesFilteredByDate = baseCases;
    if (chart.dateFrom || chart.dateTo) {
      casesFilteredByDate = baseCases.filter(caso => {
        const casoDate = parseDate(caso.fecha);
        if (!casoDate) return false;
        
        const fromDate = chart.dateFrom ? new Date(`${chart.dateFrom}T00:00:00`) : null;
        const toDate = chart.dateTo ? new Date(`${chart.dateTo}T23:59:59.999`) : null;
        
        casoDate.setHours(0, 0, 0, 0);
        
        if (fromDate && casoDate < fromDate) return false;
        if (toDate && casoDate > toDate) return false;
        return true;
      });
    }

    let dataMap: Record<string, number> = {};
    
    switch (chart.dataType) {
      case 'operativos-por-region':
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          acc[caso.region] = (acc[caso.region] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        break;

      case 'detenidos-por-region':
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          acc[caso.region] = (acc[caso.region] || 0) + (caso.detenidos || 0);
          return acc;
        }, {} as Record<string, number>);
        break;

      case 'vehiculos-por-region':
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          acc[caso.region] = (acc[caso.region] || 0) + (caso.vehiculosDetenidos || 0);
          return acc;
        }, {} as Record<string, number>);
        break;

      case 'casos-procuraduria-por-region':
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          if (caso.procuraduria) {
            acc[caso.region] = (acc[caso.region] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        break;

      case 'operativos-por-provincia':
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          acc[caso.provincia] = (acc[caso.provincia] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        break;

      case 'detenidos-por-provincia':
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          acc[caso.provincia] = (acc[caso.provincia] || 0) + (caso.detenidos || 0);
          return acc;
        }, {} as Record<string, number>);
        break;

      case 'vehiculos-por-provincia':
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          acc[caso.provincia] = (acc[caso.provincia] || 0) + (caso.vehiculosDetenidos || 0);
          return acc;
        }, {} as Record<string, number>);
        break;

      case 'casos-procuraduria-por-provincia':
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          if (caso.procuraduria) {
            acc[caso.provincia] = (acc[caso.provincia] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        break;

      case 'combinado-por-region':
        // Para gráfico combinado, retornamos datos estructurados diferentes
        const regionData: Record<string, any> = {};
        
        // Debug temporal para verificar estructura de datos
        casesFilteredByDate.forEach((caso) => {
          if (!regionData[caso.region]) {
            regionData[caso.region] = {
              name: caso.region,
              operativos: 0,
              detenidos: 0,
              vehiculos: 0,
              patrullas: 0
            };
          }
          // Operativos: solo contar si tipoActividad contiene "operativo"
          if (caso.tipoActividad && caso.tipoActividad.toLowerCase().includes('operativo')) {
            regionData[caso.region].operativos += 1;
          }
          
          // Patrullas: solo contar si tipoActividad contiene "patrulla"
          if (caso.tipoActividad && caso.tipoActividad.toLowerCase().includes('patrulla')) {
            regionData[caso.region].patrullas += 1;
          }
          
          // Detenidos: usar el conteo directo desde las hojas de detenidos (ya procesado por EnvironmentalAnalytics)
          if (caso.detenidos > 0) {
            regionData[caso.region].detenidos += caso.detenidos;
          }
          
          // Vehículos: usar el conteo directo desde las hojas de vehículos (ya procesado por EnvironmentalAnalytics)
          if (caso.vehiculosDetenidos > 0) {
            regionData[caso.region].vehiculos += caso.vehiculosDetenidos;
          }
        });
        
        // Debug: Ver el resultado final por región
        
        const resultData = Object.values(regionData)
          .filter((item: any) => item.operativos > 0 || item.patrullas > 0)
          .sort((a: any, b: any) => (b.operativos + b.patrullas) - (a.operativos + a.patrullas));
          
        
        return resultData;

      case 'combinado-por-provincia':
        // Para gráfico combinado, retornamos datos estructurados diferentes
        const provinciaData: Record<string, any> = {};
        
        casesFilteredByDate.forEach((caso) => {
          if (!provinciaData[caso.provincia]) {
            provinciaData[caso.provincia] = {
              name: caso.provincia,
              operativos: 0,
              detenidos: 0,
              vehiculos: 0,
              patrullas: 0
            };
          }
          
          // Operativos: solo contar si tipoActividad contiene "operativo"
          if (caso.tipoActividad && caso.tipoActividad.toLowerCase().includes('operativo')) {
            provinciaData[caso.provincia].operativos += 1;
          }
          
          // Patrullas: solo contar si tipoActividad contiene "patrulla"
          if (caso.tipoActividad && caso.tipoActividad.toLowerCase().includes('patrulla')) {
            provinciaData[caso.provincia].patrullas += 1;
          }
          
          // Detenidos: usar el conteo directo desde las hojas de detenidos (ya procesado por EnvironmentalAnalytics)
          if (caso.detenidos > 0) {
            provinciaData[caso.provincia].detenidos += caso.detenidos;
          }
          
          // Vehículos: usar el conteo directo desde las hojas de vehículos (ya procesado por EnvironmentalAnalytics)
          if (caso.vehiculosDetenidos > 0) {
            provinciaData[caso.provincia].vehiculos += caso.vehiculosDetenidos;
          }
        });
        
        // Debug: Ver el resultado final por provincia
        
        const resultProvinciaData = Object.values(provinciaData)
          .filter((item: any) => item.operativos > 0 || item.patrullas > 0)
          .sort((a: any, b: any) => (b.operativos + b.patrullas) - (a.operativos + a.patrullas));
          
        
        return resultProvinciaData;

      case 'incautaciones-por-tipo':
        // Usar el servicio de analytics para obtener incautaciones por tipo
        const analytics = new EnvironmentalAnalyticsService();
        const incautacionesData = analytics.getIncautacionesByType(casesFilteredByDate);
        
        
        // Convertir al formato esperado por los gráficos
        return incautacionesData.map(item => ({
          name: item.tipo,
          value: item.cantidad
        }));

      case 'tabla-resumen-areas-tematicas':
        // Generar datos para la tabla de resumen por áreas temáticas
        const analytics2 = new EnvironmentalAnalyticsService();
        const tablaResumenData = analytics2.generateTablaResumenAreasTematicas(casesFilteredByDate);
        
        
        return tablaResumenData;
    }

    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  // Componente para renderizar un gráfico individual
  const ChartComponent: React.FC<{ chart: ChartConfig; onRemove: () => void }> = ({ chart, onRemove }) => {
    const data = generateChartData(chart);
    
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative"
        data-chart-id={chart.id}
      >
        {/* Botón de eliminar */}
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xl font-bold"
          title="Eliminar gráfico"
        >
          ×
        </button>
        
        {/* Título y información */}
        <div className="mb-4 pr-8">
          <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
          <div className="text-sm text-gray-600">
            <span>Tipo: {chart.chartType === 'vertical-bar' ? 'Barras Verticales' : 
                     chart.chartType === 'combined' ? 'Gráfico Combinado' : 'Gráfico Circular'}</span>
            {(chart.dateFrom || chart.dateTo) && (
              <span className="ml-4">
                Período: {chart.dateFrom && chart.dateTo ? `${chart.dateFrom} a ${chart.dateTo}` : chart.dateFrom ? `Desde ${chart.dateFrom}` : `Hasta ${chart.dateTo}`}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {chart.chartType === 'combined' 
              ? (() => {
                  const totalOperativos = data.reduce((sum: number, item: any) => sum + (item.operativos || 0), 0);
                  const totalDetenidos = data.reduce((sum: number, item: any) => sum + (item.detenidos || 0), 0);
                  const totalVehiculos = data.reduce((sum: number, item: any) => sum + (item.vehiculos || 0), 0);
                  const totalPatrullas = data.reduce((sum: number, item: any) => sum + (item.patrullas || 0), 0);
                  return `${totalOperativos} operativos, ${totalDetenidos} detenidos, ${totalVehiculos} vehículos, ${totalPatrullas} patrullas`;
                })()
              : `${data.reduce((sum, item) => sum + item.value, 0)} casos total`
            }
          </div>
        </div>
        
        {/* Gráfico */}
        <div className={`${chart.chartType === 'combined' ? 'h-[500px]' : chart.dataType === 'tabla-resumen-areas-tematicas' ? 'min-h-[400px]' : 'h-80'}`}>
          {data.length > 0 ? (
            chart.dataType === 'tabla-resumen-areas-tematicas' ? (
              // Renderizar tabla especial para áreas temáticas
              <div className="space-y-4">
                {/* Leyenda de colores */}
                  <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="text-xs font-semibold text-gray-700 mr-1">Leyenda:</div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border" style={{ backgroundColor: '#E3F2FD', borderColor: '#1976D2' }}></div>
                    <span className="text-xs text-gray-600">Patrullas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border" style={{ backgroundColor: '#E8F5E8', borderColor: '#388E3C' }}></div>
                    <span className="text-xs text-gray-600">Operativos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border" style={{ backgroundColor: '#FFF3E0', borderColor: '#F57C00' }}></div>
                    <span className="text-xs text-gray-600">Detenidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border" style={{ backgroundColor: '#FCE4EC', borderColor: '#C2185B' }}></div>
                    <span className="text-xs text-gray-600">Vehículos</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold text-xs">Categoría</th>
                      <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold text-xs">Área Temática</th>
                      {/* Generar columnas dinámicamente basadas en las regiones */}
                      {data.length > 0 && Object.keys(data[0].regiones).map((region) => (
                        <th key={region} className="border border-gray-300 px-2 py-1.5 text-center font-semibold text-xs">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500">Región</span>
                            <span>{region.replace('REGIÓN ', '')}</span>
                          </div>
                        </th>
                      ))}
                      <th className="border border-gray-300 px-3 py-1.5 text-center font-semibold text-xs bg-blue-50">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((fila: any, index: number) => (
                      <tr 
                        key={index} 
                        style={{
                          backgroundColor: fila.colores?.backgroundColor || (index % 2 === 0 ? '#ffffff' : '#f9fafb'),
                          borderLeft: `4px solid ${fila.colores?.borderColor || '#d1d5db'}`,
                        }}
                        className="hover:opacity-90 transition-opacity"
                      >
                        <td 
                          className="border border-gray-300 px-3 py-1.5 font-medium text-xs"
                          style={{ color: fila.colores?.textColor || '#374151' }}
                        >
                          {fila.categoria}
                        </td>
                        <td 
                          className="border border-gray-300 px-3 py-1.5 text-xs"
                          style={{ color: fila.colores?.textColor || '#374151' }}
                        >
                          {fila.areaTematica}
                        </td>
                        {Object.entries(fila.regiones).map(([region, cantidad]: [string, any]) => (
                          <td key={region} className="border border-gray-300 px-2 py-1.5 text-center text-xs">
                            <span 
                              className={cantidad > 0 ? 'font-semibold' : 'text-gray-400'}
                              style={{ 
                                color: cantidad > 0 ? (fila.colores?.textColor || '#2563eb') : '#9ca3af'
                              }}
                            >
                              {cantidad}
                            </span>
                          </td>
                        ))}
                        <td 
                          className="border border-gray-300 px-3 py-1.5 text-center bg-blue-50 font-semibold text-xs"
                          style={{ 
                            color: fila.colores?.textColor || '#374151',
                            backgroundColor: fila.colores?.borderColor ? `${fila.colores.borderColor}15` : '#eff6ff'
                          }}
                        >
                          {fila.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key={`responsive-${chart.id}`}>
                {chart.chartType === 'pie' ? (
                <PieChart key={`pie-${chart.id}`}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }: any) => `${name}: ${value} (${((percent || 0) * 100).toFixed(1)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={getPieColors()[index % getPieColors().length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : chart.chartType === 'combined' ? (
                <BarChart
                  key={`combined-${chart.id}`}
                  data={data}
                  margin={{ top: 20, right: 50, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fontWeight: 'bold' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    iconType="rect"
                  />
                  {/* Barras para cada métrica */}
                  <Bar 
                    dataKey="operativos" 
                    fill="#10B981" 
                    name="Operativos"
                  >
                    <LabelList 
                      dataKey="operativos" 
                      position="top" 
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#10B981' }}
                      offset={2}
                    />
                  </Bar>
                  <Bar 
                    dataKey="detenidos" 
                    fill="#EF4444" 
                    name="Personas Detenidas"
                  >
                    <LabelList 
                      dataKey="detenidos" 
                      position="top" 
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#EF4444' }}
                      offset={2}
                    />
                  </Bar>
                  <Bar 
                    dataKey="vehiculos" 
                    fill="#F59E0B" 
                    name="Vehículos Detenidos"
                  >
                    <LabelList 
                      dataKey="vehiculos" 
                      position="top" 
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#F59E0B' }}
                      offset={2}
                    />
                  </Bar>
                  <Bar 
                    dataKey="patrullas" 
                    fill="#8B5CF6" 
                    name="Patrullas"
                  >
                    <LabelList 
                      dataKey="patrullas" 
                      position="top" 
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#8B5CF6' }}
                      offset={2}
                    />
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  key={`vertical-${chart.id}`}
                  data={data}
                  margin={{ top: 50, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fontWeight: 'bold' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 14, fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    labelStyle={{ fontSize: 14, fontWeight: 'bold' }}
                    contentStyle={{ fontSize: 13 }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={getChartColor(chart.dataType)}
                    name="Cantidad"
                  >
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      style={{ fontSize: '14px', fontWeight: 'bold', fill: '#000' }}
                      offset={8}
                      content={(props: any) => {
                        const { x, y, width, value } = props;
                        if (!value || value === 0) return null;
                        return (
                          <text 
                            x={x + width / 2} 
                            y={y - 5} 
                            textAnchor="middle" 
                            fontSize="14" 
                            fontWeight="bold" 
                            fill="#000"
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No hay datos disponibles para este período
            </div>
          )}
        </div>
      </div>
    );
  };

  // Función para parsear fechas con la misma lógica que environmentalAnalytics
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    const trimmedDate = dateStr.trim();
    let caseDate: Date | null = null;
    
    // Format 1: YYYY-MM-DD (ISO format)
    if (trimmedDate.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
      const dateOnly = trimmedDate.substring(0, 10);
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          caseDate = new Date(year, month - 1, day);
        }
      }
    }
    // Format 2: DD/MM/YYYY, DD/M/YYYY, D/MM/YYYY, D/M/YYYY, DD-MM-YYYY, etc.
    else if (trimmedDate.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
      const parts = trimmedDate.split(/[\/\-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          caseDate = new Date(year, month - 1, day);
        }
      }
    }
    // Format 3: Try direct parsing as fallback
    if (!caseDate || isNaN(caseDate.getTime())) {
      const localDateStr = trimmedDate.match(/^\d{4}-\d{1,2}-\d{1,2}$/)
        ? trimmedDate.replace(/-/g, '/')
        : trimmedDate;
      const testDate = new Date(localDateStr);
      if (!isNaN(testDate.getTime())) {
        caseDate = testDate;
      }
    }
    
    return caseDate && !isNaN(caseDate.getTime()) ? caseDate : null;
  };

  const chartData = useMemo(() => {
    // Vista previa simple del gráfico actual
    const baseCases = (dateFrom || dateTo) ? cases : filteredCases;
    
    if (!baseCases || baseCases.length === 0) {
      return [];
    }

    // Aplicar filtros de fecha solo si tenemos filtros propios
    let casesFilteredByDate = baseCases;
    if (dateFrom || dateTo) {
      casesFilteredByDate = baseCases.filter(caso => {
        const casoDate = parseDate(caso.fecha);
        if (!casoDate) return false;
        
        const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
        const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
        
        casoDate.setHours(0, 0, 0, 0);
        
        if (fromDate && casoDate < fromDate) return false;
        if (toDate && casoDate > toDate) return false;
        return true;
      });
    }

    // Solo mostrar los primeros 5 elementos para la vista previa
    let dataMap: Record<string, number> = {};
    
    switch (selectedDataType) {
      case 'operativos-por-region':
      case 'operativos-por-provincia':
        const regionKey = selectedDataType.includes('region') ? 'region' : 'provincia';
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          const key = caso[regionKey];
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        break;
      case 'detenidos-por-region':
      case 'detenidos-por-provincia':
        const regionKey2 = selectedDataType.includes('region') ? 'region' : 'provincia';
        dataMap = casesFilteredByDate.reduce((acc, caso) => {
          const key = caso[regionKey2];
          acc[key] = (acc[key] || 0) + (caso.detenidos || 0);
          return acc;
        }, {} as Record<string, number>);
        break;
      default:
        // Para otros tipos, usar la función completa
        return generateChartData({
          id: 'preview',
          chartType: selectedChartType,
          dataType: selectedDataType,
          dateFrom,
          dateTo,
          title: ''
        }).slice(0, 5);
    }

    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Solo mostrar top 5 para vista previa
  }, [cases, filteredCases, selectedDataType, selectedChartType, dateFrom, dateTo]);

  const getChartColor = (dataType: DataType): string => {
    const colors: Record<DataType, string> = {
      'operativos-por-region': '#10B981',
      'detenidos-por-region': '#EF4444',
      'vehiculos-por-region': '#F59E0B',
      'casos-procuraduria-por-region': '#8B5CF6',
      'operativos-por-provincia': '#06B6D4',
      'detenidos-por-provincia': '#DC2626',
      'vehiculos-por-provincia': '#D97706',
      'casos-procuraduria-por-provincia': '#7C3AED',
      'combinado-por-region': '#3B82F6',
      'combinado-por-provincia': '#1E40AF',
      'incautaciones-por-tipo': '#F97316',
      'tabla-resumen-areas-tematicas': '#059669',
    };
    return colors[dataType];
  };

  function getDataTypeLabel(dataType: DataType): string {
    const labels: Record<DataType, string> = {
      'operativos-por-region': 'Operativos por Región',
      'detenidos-por-region': 'Detenidos por Región',
      'vehiculos-por-region': 'Vehículos por Región',
      'casos-procuraduria-por-region': 'Casos a Procuraduría por Región',
      'operativos-por-provincia': 'Operativos por Provincia',
      'detenidos-por-provincia': 'Detenidos por Provincia',
      'vehiculos-por-provincia': 'Vehículos por Provincia',
      'casos-procuraduria-por-provincia': 'Casos a Procuraduría por Provincia',
      'combinado-por-region': 'Datos Combinados por Región',
      'combinado-por-provincia': 'Datos Combinados por Provincia',
      'incautaciones-por-tipo': 'Incautaciones por Tipo',
      'tabla-resumen-areas-tematicas': 'Tabla Resumen por Áreas Temáticas',
    };
    return labels[dataType];
  }

  const getPieColors = (): string[] => {
    return [
      '#3B82F6', // blue-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#06B6D4', // cyan-500
      '#84CC16', // lime-500
      '#F97316', // orange-500
      '#EC4899', // pink-500
      '#6366F1', // indigo-500
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Constructor de Gráficos
            </h1>
            <div className="flex items-center gap-3">
              <Link to="/" className="btn-sm btn-ghost min-w-0" title="Dashboard Principal">
                <span className="text-base">🏠</span>
                <span className="hidden lg:inline ml-2">Dashboard</span>
              </Link>
              <Link to="/operations" className="btn-sm btn-ghost min-w-0" title="Operaciones">
                <span className="text-base">⚡</span>
                <span className="hidden lg:inline ml-2">Operaciones</span>
              </Link>
              <Link to="/detainees-map" className="btn-sm btn-ghost min-w-0" title="Mapa de Detenidos">
                <span className="text-base">👥</span>
                <span className="hidden lg:inline ml-2">Mapa</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-gray-600">
            Selecciona el tipo de gráfico y los datos que deseas visualizar
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Chart Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Gráfico
              </label>
              <select
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value as ChartType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="vertical-bar">Barras Verticales</option>
                <option value="pie">Gráfico Circular</option>
                <option value="combined">Gráfico Combinado</option>
              </select>
            </div>

            {/* Data Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datos a Visualizar
              </label>
              <select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value as DataType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <optgroup label="Por Región">
                  <option value="operativos-por-region">Operativos por Región</option>
                  <option value="detenidos-por-region">Detenidos por Región</option>
                  <option value="vehiculos-por-region">Vehículos por Región</option>
                  <option value="casos-procuraduria-por-region">Casos a Procuraduría por Región</option>
                  <option value="combinado-por-region">Datos Combinados por Región</option>
                </optgroup>
                <optgroup label="Por Provincia">
                  <option value="operativos-por-provincia">Operativos por Provincia</option>
                  <option value="detenidos-por-provincia">Detenidos por Provincia</option>
                  <option value="vehiculos-por-provincia">Vehículos por Provincia</option>
                  <option value="casos-procuraduria-por-provincia">Casos a Procuraduría por Provincia</option>
                  <option value="combinado-por-provincia">Datos Combinados por Provincia</option>
                </optgroup>
                <optgroup label="Análisis Específicos">
                  <option value="incautaciones-por-tipo">Incautaciones por Tipo</option>
                  <option value="tabla-resumen-areas-tematicas">Tabla Resumen por Áreas Temáticas</option>
                </optgroup>
              </select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Add Chart Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Configuración del gráfico: {getDataTypeLabel(selectedDataType)}
                {(dateFrom || dateTo) && (
                  <span className="ml-2 text-blue-600">
                    ({dateFrom && dateTo ? `${dateFrom} a ${dateTo}` : dateFrom ? `Desde ${dateFrom}` : `Hasta ${dateTo}`})
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addChart}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  ➕ Agregar Gráfico
                </button>
                {charts.length > 0 && (
                  <>
                    <button
                      onClick={exportToPDF}
                      disabled={isExporting}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      {isExporting ? '⏳ Exportando...' : '📄 Exportar PDF'}
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      📊 Exportar Excel
                    </button>
                    <button
                      onClick={clearAllCharts}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      🗑️ Limpiar Todo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          {(dateFrom || dateTo) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {dateFrom && dateTo ? (
                    `Filtros activos: ${dateFrom} a ${dateTo}`
                  ) : dateFrom ? (
                    `Desde: ${dateFrom}`
                  ) : (
                    `Hasta: ${dateTo}`
                  )}
                </div>
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Charts Display */}
        {charts.length > 0 ? (
          <div className="space-y-6" ref={chartsContainerRef}>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Gráficos Agregados ({charts.length})
              </h2>
              <p className="text-sm text-gray-600">
                Haz clic en la "×" en la esquina superior derecha de cada gráfico para eliminarlo
              </p>
            </div>
            
            <div className="space-y-6">
              {charts.map((chart) => (
                <div 
                  key={chart.id} 
                  className={chart.chartType === 'combined' ? 'w-full' : ''}
                >
                  <ChartComponent
                    chart={chart}
                    onRemove={() => removeChart(chart.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay gráficos agregados
            </h3>
            <p className="text-gray-600 mb-6">
              Configura los parámetros arriba y haz clic en "Agregar Gráfico" para empezar a visualizar tus datos
            </p>
            
            {/* Vista previa pequeña */}
            {chartData.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Vista previa:</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(0, 3)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Bar dataKey="value" fill={getChartColor(selectedDataType)} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {getDataTypeLabel(selectedDataType)} (muestra)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartBuilder;
