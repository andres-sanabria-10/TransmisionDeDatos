document.addEventListener("DOMContentLoaded", async function () {
    // Configurar SciChartSurface sin zoom automático
    const { sciChartSurface, wasmContext } = await SciChartSurface.create("scichart-root");

    sciChartSurface.background = "#121212"; // Fondo oscuro

    const xAxis = new NumericAxis(wasmContext, { 
        axisTitle: "Tiempo (s)",
        labelStyle: { color: "white" },
        majorGridLineStyle: { color: "#444", strokeThickness: 1 }
    });

    const yAxis = new NumericAxis(wasmContext, { 
        axisTitle: "Amplitud",
        visibleRange: new NumberRange(-20, 20), // Escala fija
        labelStyle: { color: "white" },
        majorGridLineStyle: { color: "#444", strokeThickness: 1 }
    });

    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);

    const dataSeries = new XyDataSeries(wasmContext);

    // Mejoras en la visualización de la línea
    const lineSeries = new FastLineRenderableSeries(wasmContext, { 
        dataSeries, 
        stroke: "white",  // Color blanco para mejor visibilidad
        strokeThickness: 2.5 // Aumentar grosor de la línea
    });

    sciChartSurface.renderableSeries.add(lineSeries);

    // Obtener referencias a los controles deslizantes
    const voltajePortadora = document.getElementById("voltajePortadora");
    const frecuenciaPortadora = document.getElementById("frecuenciaPortadora");
    const voltajeModuladora = document.getElementById("voltajeModuladora");
    const frecuenciaModuladora = document.getElementById("frecuenciaModuladora");
    const sendButton = document.getElementById("EnvioModulacion");

    sendButton.addEventListener("click", async function () {
        try {
            // Validar que los valores sean correctos
            const Vp = parseFloat(voltajePortadora.value);
            const fp = parseFloat(frecuenciaPortadora.value);
            const Vm = parseFloat(voltajeModuladora.value);
            const fm = parseFloat(frecuenciaModuladora.value);

            if (isNaN(Vp) || isNaN(fp) || isNaN(Vm) || isNaN(fm) || Vp <= 0) {
                alert("Por favor ingresa valores válidos.");
                return;
            }

            // Calcular índice de modulación
            const m = Vm / Vp;

            const response = await fetch("http://localhost:5000/modulacion_amplitud", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Vp, fp, fm, m })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || "Error en la respuesta del servidor.");
            }

            console.log("Respuesta del backend:", data);

            // Limpiar y actualizar datos en SciChart sin afectar la escala
            dataSeries.clear();
            dataSeries.appendRange(data.t, data.señal);

        } catch (error) {
            console.error("Error al enviar datos:", error);
            alert("Error al comunicarse con el backend.");
        }
    });
});
