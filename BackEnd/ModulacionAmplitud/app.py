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
        Vm = float(data.get('Vm', 1))
        fm = float(data.get('fm', 1))
        Fasem= float(data.get('Fasem', 0)) # Fase de la moduladora
        Fasep = float(data.get('Fasep', 0))  # Fase de la portadora

     
        tipo = data.get('tipo', 'AM')  # Tipo de modulación: AM, FM, PM

        if fm >= fp:
            return jsonify({"error": "fm debe ser menor que fp"}), 400

        # Vector de tiempo (0.2 segundos, 5000 muestras)
        t = np.arange(0, 0.2, 1/5000)
        

        # Señal modulada según el tipo seleccionado
        if tipo == 'AM':
            m = Vm / Vp 
            # Modulación de Amplitud (AM)
            señal_modulada = (Vp * np.sin(2 * np.pi * fp * t) +
                             (m * Vp / 2) * np.cos(2 * np.pi * (fp - fm) * t) -
                             (m * Vp / 2) * np.cos(2 * np.pi * (fp + fm) * t))

        elif tipo == 'FM':
            # Calcula Δf como un porcentaje de fp
 
            k=2
            delta_f =k*Vm
            m = delta_f / fm
            señal_modulada = Vp * np.sin(2 * np.pi * fp * t + delta_f * np.sin(2 * np.pi * fm * t))


        elif tipo == 'PM':
            # Modulación de Fase (PM) - Fórmula correcta
            Kp = 2  # Ejemplo: 1 rad/V
            m = Kp * Vm
            señal_modulada = Vp * np.cos(2 * np.pi * fp * t + m * np.sin(2 * np.pi * fm * t))


        else:
            return jsonify({"error": "Tipo de modulación no soportado"}), 400

        return jsonify({"t": t.tolist(), "señal": señal_modulada.tolist(),"indice_modulacion": m})

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