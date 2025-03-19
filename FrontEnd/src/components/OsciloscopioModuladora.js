import React, { useEffect, useRef } from 'react';

const OsciloscopioModuladora = ({ params }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Efecto para inicializar el gráfico
  useEffect(() => {
    let isComponentMounted = true;
    
    const initSciChart = async () => {
      try {
        // Acceder a SciChart desde el objeto global window
        const {
          SciChartSurface,
          NumericAxis,
          FastLineRenderableSeries,
          XyDataSeries,
          NumberRange
        } = window.SciChart;
        
        // Inicializar SciChart
        const { sciChartSurface, wasmContext } = await SciChartSurface.create("osciloscopio-moduladora");
        
        if (!isComponentMounted) {
          sciChartSurface.delete();
          return;
        }
        
        sciChartSurface.background = "#121212"; // Fondo oscuro
        
        // Configurar ejes
        const xAxis = new NumericAxis(wasmContext, { 
          axisTitle: "Tiempo (s)",
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" },
          visibleRange: new NumberRange(0, 0.1) // Mostrar 0.1 segundos
        });
        
        const yAxis = new NumericAxis(wasmContext, { 
          axisTitle: "Voltaje (V)", 
          visibleRange: new NumberRange(-6, 6), // Ajustado para el rango de voltaje
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" }
        });
        
        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);
        
        // Series de datos
        const signalData = new XyDataSeries(wasmContext);
        
        const lineSeries = new FastLineRenderableSeries(wasmContext, { 
          stroke: "#2196F3", // Azul para la moduladora
          dataSeries: signalData,
          strokeThickness: 2.5
        });
        
        sciChartSurface.renderableSeries.add(lineSeries);
        
        // Guardar referencias
        chartRef.current = sciChartSurface;
        dataSeriesRef.current = signalData;
        
        // Marcar como inicializado
        isInitializedRef.current = true;
        
        // Generar datos estáticos
        generateStaticData();
      } catch (error) {
        console.error("Error inicializando SciChart:", error);
      }
    };
    
    // Esperar a que SciChart esté disponible en window
    if (window.SciChart) {
      initSciChart();
    } else {
      const checkSciChart = setInterval(() => {
        if (window.SciChart) {
          clearInterval(checkSciChart);
          initSciChart();
        }
      }, 100);
    }
    
    return () => {
      isComponentMounted = false;
      // Limpiar al desmontar
      if (chartRef.current) {
        chartRef.current.delete();
      }
    };
  }, []); // Solo se ejecuta una vez al montar
  
  // Efecto para actualizar la gráfica cuando cambien los parámetros
  useEffect(() => {
    if (isInitializedRef.current) {
      generateStaticData();
    }
  }, [params.voltaje, params.frecuencia, params.fase]);
  
  const generateStaticData = () => {
    if (!dataSeriesRef.current) return;
    
    dataSeriesRef.current.clear();
    
    // Generar datos para un ciclo completo
    const numPoints = 1000;
    const duration = 0.1; // 0.1 segundos
    
    for (let i = 0; i < numPoints; i++) {
      const time = (i / numPoints) * duration;
      // Convertir frecuencia de Hz a radianes/segundo (2π * f)
      const angularFreq = 2 * Math.PI * params.frecuencia;
      const y = params.voltaje * Math.sin(angularFreq * time + params.fase);
      
      dataSeriesRef.current.append(time, y);
    }
  };
  
  return (
    <div id="osciloscopio-moduladora" ref={containerRef} style={{ width: '100%', height: '350px', backgroundColor: '#121212' }}></div>
  );
};

export default OsciloscopioModuladora;