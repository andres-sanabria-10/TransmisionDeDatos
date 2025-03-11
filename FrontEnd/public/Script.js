const { SciChartSurface, NumericAxis, FastLineRenderableSeries, XyDataSeries, NumberRange } = SciChart;

function actualizarValores(id, display, isPi = false) {
    const slider = document.getElementById(id);
    const output = document.getElementById(display);
    slider.addEventListener("input", function () {
        output.innerText = isPi ? (parseFloat(slider.value) / Math.PI).toFixed(2) + "π" : slider.value + (id.includes("Frecuencia") ? "Hz" : "V");
    });
}

// Variables de control separadas
let isRunningPortadora = true, isRunningModuladora = true;
let intervalIdPortadora, intervalIdModuladora;

// Variables de señal
let voltajeP = 5, frecuenciaP = 1000, faseP = Math.PI;
let voltajeM = 5, frecuenciaM = 1000, faseM = Math.PI;
const sampleRate = 200;
const duracion = 2 * Math.PI;
const maxPoints = 600;
let tiempoPortadora = 0, tiempoModuladora = 0;

// Declarar variables globales de series de datos para evitar errores de referencia
let signalDataPortadora, signalDataModuladora;
let xAxisPortadora, xAxisModuladora;

function updateOscilloscopePortadora() {
    if (!isRunningPortadora) return;
    tiempoPortadora += duracion / sampleRate;

    let yP = voltajeP * Math.sin(2 * Math.PI * frecuenciaP * tiempoPortadora / 10000 + faseP);
    signalDataPortadora.append(tiempoPortadora, yP);
    if (signalDataPortadora.count() > maxPoints) signalDataPortadora.removeAt(0);
    xAxisPortadora.visibleRange = new NumberRange(tiempoPortadora - 6, tiempoPortadora);
}

function updateOscilloscopeModuladora() {
    if (!isRunningModuladora) return;
    tiempoModuladora += duracion / sampleRate;

    let yM = voltajeM * Math.sin(2 * Math.PI * frecuenciaM * tiempoModuladora / 10000 + faseM);
    signalDataModuladora.append(tiempoModuladora, yM);
    if (signalDataModuladora.count() > maxPoints) signalDataModuladora.removeAt(0);
    xAxisModuladora.visibleRange = new NumberRange(tiempoModuladora - 6, tiempoModuladora);
}

async function initSciChart() {
    const { sciChartSurface: oscPortadora, wasmContext: ctxPortadora } = await SciChartSurface.create("osciloscopio");
    const { sciChartSurface: oscModuladora, wasmContext: ctxModuladora } = await SciChartSurface.create("osciloscopioDos");

    // Configuración de ejes
    xAxisPortadora = new NumericAxis(ctxPortadora, { axisTitle: "Tiempo (s)" });
    const yAxisPortadora = new NumericAxis(ctxPortadora, { axisTitle: "Voltaje (V)", visibleRange: new NumberRange(-10, 10) });

    oscPortadora.xAxes.add(xAxisPortadora);
    oscPortadora.yAxes.add(yAxisPortadora);

    xAxisModuladora = new NumericAxis(ctxModuladora, { axisTitle: "Tiempo (s)" });
    const yAxisModuladora = new NumericAxis(ctxModuladora, { axisTitle: "Voltaje (V)", visibleRange: new NumberRange(-10, 10) });

    oscModuladora.xAxes.add(xAxisModuladora);
    oscModuladora.yAxes.add(yAxisModuladora);

    // Series de datos (se asignan a variables globales)
    signalDataPortadora = new XyDataSeries(ctxPortadora);
    const lineSeriesPortadora = new FastLineRenderableSeries(ctxPortadora, { stroke: "lime", dataSeries: signalDataPortadora });
    oscPortadora.renderableSeries.add(lineSeriesPortadora);

    signalDataModuladora = new XyDataSeries(ctxModuladora);
    const lineSeriesModuladora = new FastLineRenderableSeries(ctxModuladora, { stroke: "cyan", dataSeries: signalDataModuladora });
    oscModuladora.renderableSeries.add(lineSeriesModuladora);

    // Iniciar actualización periódica de gráficos
    intervalIdPortadora = setInterval(updateOscilloscopePortadora, 30);
    intervalIdModuladora = setInterval(updateOscilloscopeModuladora, 30);

    // Eventos para actualizar sliders
    document.getElementById("voltajePortadora").oninput = function () {
        voltajeP = parseFloat(this.value);
        document.getElementById("voltajePortadoraValue").innerText = voltajeP + "V";
    };

    document.getElementById("frecuenciaPortadora").oninput = function () {
        frecuenciaP = parseFloat(this.value);
        document.getElementById("frecuenciaPortadoraValue").innerText = frecuenciaP + "Hz";
    };

    document.getElementById("fasePortadora").oninput = function () {
        faseP = parseFloat(this.value);
        document.getElementById("fasePortadoraValue").innerText = (faseP / Math.PI).toFixed(2) + "π";
    };

    document.getElementById("voltajeModuladora").oninput = function () {
        voltajeM = parseFloat(this.value);
        document.getElementById("voltajeModuladoraValue").innerText = voltajeM + "V";
    };

    document.getElementById("frecuenciaModuladora").oninput = function () {
        frecuenciaM = parseFloat(this.value);
        document.getElementById("frecuenciaModuladoraValue").innerText = frecuenciaM + "Hz";
    };

    document.getElementById("faseModuladora").oninput = function () {
        faseM = parseFloat(this.value);
        document.getElementById("faseModuladoraValue").innerText = (faseM / Math.PI).toFixed(2) + "π";
    };
}

window.onload = function () {
    initSciChart();
};

// Función para pausar/reanudar la señal portadora
function toggleOscilloscopePortadora() {
    isRunningPortadora = !isRunningPortadora;
    const button = document.getElementById("toggleButtonPortadora");
    button.innerText = isRunningPortadora ? "Detener" : "Reanudar";

    if (isRunningPortadora) {
        if (!intervalIdPortadora) {
            intervalIdPortadora = setInterval(updateOscilloscopePortadora, 30);
        }
    } else {
        clearInterval(intervalIdPortadora);
        intervalIdPortadora = null;
    }
}

// Función para pausar/reanudar la señal moduladora
function toggleOscilloscopeModuladora() {
    isRunningModuladora = !isRunningModuladora;
    const button = document.getElementById("toggleButtonModuladora");
    button.innerText = isRunningModuladora ? "Detener" : "Reanudar";

    if (isRunningModuladora) {
        if (!intervalIdModuladora) {
            intervalIdModuladora = setInterval(updateOscilloscopeModuladora, 30);
        }
    } else {
        clearInterval(intervalIdModuladora);
        intervalIdModuladora = null;
    }
}
