from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/modulacion', methods=['POST'])
def modulacion():
    try:
        # Obtener datos desde el frontend
        data = request.json
        Vp = float(data.get('Vp', 1))
        fp = float(data.get('fp', 1))
        fm = float(data.get('fm', 1))
        m = float(data.get('m', 1))
        tipo = data.get('tipo', 'AM')  # Tipo de modulación: AM, FM, PM

        if fm >= fp:
            return jsonify({"error": "fm debe ser menor que fp"}), 400

        # Vector de tiempo (0.2 segundos, 5000 muestras)
        t = np.arange(0, 0.2, 1/5000)

        # Señal modulada según el tipo seleccionado
        if tipo == 'AM':
            # Modulación de Amplitud (AM)
            señal_modulada = (Vp * np.sin(2 * np.pi * fp * t) +
                             (m * Vp / 2) * np.cos(2 * np.pi * (fp - fm) * t) -
                             (m * Vp / 2) * np.cos(2 * np.pi * (fp + fm) * t))

        elif tipo == 'FM':
            # Modulación de Frecuencia (FM)
            beta = m * 5  # Índice de modulación para FM
            señal_modulada = Vp * np.sin(2 * np.pi * fp * t + beta * np.sin(2 * np.pi * fm * t))

        elif tipo == 'PM':
            # Modulación de Fase (PM) - Fórmula correcta
            señal_modulada = Vp * np.sin(2 * np.pi * fp * t + m * np.sin(2 * np.pi * fm * t))

        else:
            return jsonify({"error": "Tipo de modulación no soportado"}), 400

        return jsonify({"t": t.tolist(), "señal": señal_modulada.tolist()})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Mantener la ruta anterior para compatibilidad
@app.route('/modulacion_amplitud', methods=['POST'])
def modulacion_amplitud():
    try:
        # Obtener datos desde el frontend
        data = request.json
        Vp = float(data.get('Vp', 1))
        fp = float(data.get('fp', 1))
        fm = float(data.get('fm', 1))
        m = float(data.get('m', 1))

        if fm >= fp:
            return jsonify({"error": "fm debe ser menor que fp"}), 400

        # Vector de tiempo (0.2 segundos, 5000 muestras)
        t = np.arange(0, 0.2, 1/5000)

        # Señal modulada en amplitud (AM)
        señal_modulada = (Vp * np.sin(2 * np.pi * fp * t) +
                          (m * Vp / 2) * np.cos(2 * np.pi * (fp - fm) * t) -
                          (m * Vp / 2) * np.cos(2 * np.pi * (fp + fm) * t))

        return jsonify({"t": t.tolist(), "señal": señal_modulada.tolist()})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)