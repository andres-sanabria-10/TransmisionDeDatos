import React, { useEffect, useRef, useState } from 'react';

const OsciloscopioPortadora = ({ params }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const xAxisRef = useRef(null);
  const intervalRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const timeOffsetRef = useRef(0);
  
  // Valores por defecto en caso de que no se proporcionen parámetros
  const defaultParams = {
    voltaje: 3,
    frecuencia: 50,
    fase: 0
  };

  // Combinar parámetros proporcionados con valores predeterminados
  const actualParams = {
    voltaje: params?.voltaje !== undefined ? params.voltaje : defaultParams.voltaje,
    frecuencia: params?.frecuencia !== undefined ? params.frecuencia : defaultParams.frecuencia,
    fase: params?.fase !== undefined ? params.fase : defaultParams.fase
  };

  useEffect(() => {
    const checkReadiness = () => {
      if (document.getElementById("osciloscopio-portadora") && window.SciChart) {
        setIsReady(true);
      } else {
        setTimeout(checkReadiness, 100);
      }
    };

    checkReadiness();

    return () => {
      if (chartRef.current) {
        chartRef.current.delete();
        chartRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let isComponentMounted = true;

    const initSciChart = async () => {
      try {
        const {
          SciChartSurface,
          NumericAxis,
          FastLineRenderableSeries,
          XyDataSeries,
          NumberRange
        } = window.SciChart;

        const { sciChartSurface, wasmContext } = await SciChartSurface.create("osciloscopio-portadora");

        if (!isComponentMounted) {
          sciChartSurface.delete();
          return;
        }

        sciChartSurface.background = "#121212";

        // Configurar ejes
        const xAxis = new NumericAxis(wasmContext, {
          axisTitle: "Tiempo (s)",
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" },
          visibleRange: new NumberRange(0, 0.1),
          autoRange: false
        });

        const yAxis = new NumericAxis(wasmContext, {
          axisTitle: "Voltaje (V)",
          visibleRange: new NumberRange(-6, 6),
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" },
          autoRange: false
        });

        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);

        const signalData = new XyDataSeries(wasmContext);

        const lineSeries = new FastLineRenderableSeries(wasmContext, {
          stroke: "#FF5722",
          dataSeries: signalData,
          strokeThickness: 1.5,
        });

        sciChartSurface.renderableSeries.add(lineSeries);

        chartRef.current = sciChartSurface;
        dataSeriesRef.current = signalData;
        xAxisRef.current = xAxis;

        console.log("SciChart Portadora inicializado correctamente");

        // Iniciar la animación en tiempo real
        startRealTimeAnimation();
      } catch (error) {
        console.error("Error inicializando SciChart Portadora:", error);
      }
    };

    initSciChart();

    return () => {
      isComponentMounted = false;
    };
  }, [isReady]);

  useEffect(() => {
    // Detener la animación actual si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Iniciar una nueva animación con los parámetros actualizados
    if (isReady && dataSeriesRef.current) {
      startRealTimeAnimation();
    }
  }, [actualParams.voltaje, actualParams.frecuencia, actualParams.fase, isReady]);

  const startRealTimeAnimation = () => {
    if (!dataSeriesRef.current || !xAxisRef.current) return;

    // Limpiar datos existentes
    dataSeriesRef.current.clear();
    
    // Reiniciar el offset de tiempo
    timeOffsetRef.current = 0;
    
    // Calcular el número de puntos necesarios basado en la frecuencia
    // Para frecuencias altas, necesitamos más puntos por ciclo
    const pointsPerCycle = Math.max(100, Math.min(500, actualParams.frecuencia * 10));
    const duration = 0.1; // Ventana de tiempo de 0.1 segundos
    
    // Calcular el tiempo entre muestras
    const sampleTimeIncrement = duration / (pointsPerCycle * (duration * actualParams.frecuencia));
    
    // Generar datos iniciales para llenar la pantalla
    generateStaticData();
    
    // Configurar intervalo para actualizar la visualización
    intervalRef.current = setInterval(() => {
      // Mover la ventana visible
      timeOffsetRef.current += 0.001; // Incrementar el tiempo
      const currentTime = timeOffsetRef.current;
      
      // Actualizar el rango visible para desplazarse con los datos
      xAxisRef.current.visibleRange = new window.SciChart.NumberRange(
        currentTime, 
        currentTime + duration
      );
      
      // Regenerar los datos para la nueva ventana de tiempo
      generateWaveformData(currentTime, currentTime + duration);
      
    }, 50); // Actualizar aproximadamente a 50 FPS
  };

  const generateWaveformData = (startTime, endTime) => {
    if (!dataSeriesRef.current) return;
    
    // Limpiar datos existentes
    dataSeriesRef.current.clear();
    
    // Calcular cuántos puntos necesitamos basados en la frecuencia
    // Asegurar suficientes puntos por ciclo para frecuencias altas
    const minPointsPerCycle = 20; // Mínimo de puntos por ciclo
    const cyclesInWindow = actualParams.frecuencia * (endTime - startTime);
    const totalPoints = Math.max(1000, Math.ceil(minPointsPerCycle * cyclesInWindow));
    
    const timeStep = (endTime - startTime) / totalPoints;
    
    // Generar puntos de datos
    for (let i = 0; i <= totalPoints; i++) {
      const time = startTime + (i * timeStep);
      const angularFreq = 2 * Math.PI * actualParams.frecuencia;
      const y = actualParams.voltaje * Math.sin(angularFreq * time + actualParams.fase);
      
      dataSeriesRef.current.append(time, y);
    }
  };
  
  const generateStaticData = () => {
    if (!dataSeriesRef.current) return;
    
    const currentTime = timeOffsetRef.current;
    generateWaveformData(currentTime, currentTime + 0.1);
  };

  return (
    <div id="osciloscopio-portadora" ref={containerRef} style={{ width: '100%', height: '350px', backgroundColor: '#121212' }}></div>
  );
};

export default OsciloscopioPortadora;