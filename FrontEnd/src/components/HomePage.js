import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  // Asegurar que el body tenga fondo oscuro cuando se muestra esta página
  React.useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    
    return () => {
      // Restaurar cuando se desmonte
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="home-container">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center mb-5">
          <h2 className="welcome-title">Bienvenido al Laboratorio de Modulación</h2>
          <p className="welcome-text">
            Selecciona el tipo de modulación que deseas explorar:
          </p>
        </div>
      </div>
      
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="option-card">
            <div className="card-body">
              <h3 className="card-title">Señales Analógicas</h3>
              <p className="card-text">
                Explora modulaciones como AM, FM y PM para transmitir señales analógicas.
              </p>
              <Link to="/analogicas" className="btn btn-primary btn-lg w-100">
                Explorar Modulación Analógica
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="option-card">
            <div className="card-body">
              <h3 className="card-title">Señales Digitales</h3>
              <p className="card-text">
                Explora modulaciones digitales como ASK, FSK y PSK.
              </p>
              <Link to="/digitales" className="btn btn-primary btn-lg w-100">
                Explorar Modulación Digital
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="option-card">
            <div className="card-body">
              <h3 className="card-title">Digitalización (PCM)</h3>
              <p className="card-text">
                Explora la conversión analógico-digital mediante PCM y sus variantes.
              </p>
              <Link to="/pcm" className="btn btn-primary btn-lg w-100">
                Explorar PCM
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;