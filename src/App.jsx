
import { useState } from 'react'
import './App.css'

function App() {
  const [nombre, setNombre] = useState('')
  const [evento, setEvento] = useState('')
  const [activo, setActivo] = useState(false)
  const [pendientes, setPendientes] = useState([])
  const [aprobadas, setAprobadas] = useState([])

  function crearEvento() {
    if (!nombre.trim()) {
      alert('Escribí el nombre del evento')
      return
    }
    setEvento(nombre)
    setActivo(true)
  }

  function cargarFotos(e) {
    const archivos = Array.from(e.target.files || [])
    const nuevas = archivos
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(f),
        nombre: f.name
      }))

    setPendientes(prev => [...prev, ...nuevas])
    e.target.value = ''
  }

  function aprobar(id) {
    const foto = pendientes.find(f => f.id === id)
    if (!foto) return
    setAprobadas(prev => [...prev, foto])
    setPendientes(prev => prev.filter(f => f.id !== id))
  }

  function rechazar(id) {
    const foto = pendientes.find(f => f.id === id)
    if (foto) URL.revokeObjectURL(foto.url)
    setPendientes(prev => prev.filter(f => f.id !== id))
  }

  return (
    <main className="app">
      <header>
        <h1>CUATRO REYNAS</h1>
        <p>FOTOS EN DIRECTO</p>
        <span>EVENTOS & EXPERIENCIAS</span>
      </header>

      <section className="panel">
        <h2>Panel del DJ</h2>
        <p>Administrá las fotografías de tus eventos.</p>

        {!activo ? (
          <>
            <label>Nombre de la fiesta</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Cumpleaños de 15 de Martina"
            />
            <button onClick={crearEvento}>
              CREAR NUEVO EVENTO
            </button>
          </>
        ) : (
          <>
            <h2>{evento}</h2>
            <p>Evento activo</p>

            <label>Agregar fotografías para probar</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={cargarFotos}
            />

            <h2>Fotos pendientes: {pendientes.length}</h2>

            <div style={rejilla}>
              {pendientes.map(foto => (
                <div key={foto.id} style={tarjeta}>
                  <img src={foto.url} style={imagen} />
                  <button onClick={() => aprobar(foto.id)}>
                    APROBAR
                  </button>
                  <button
                    onClick={() => rechazar(foto.id)}
                    style={{background:'#922'}}
                  >
                    RECHAZAR
                  </button>
                </div>
              ))}
            </div>

            <h2>Fotos aprobadas: {aprobadas.length}</h2>

            <div style={rejilla}>
              {aprobadas.map(foto => (
                <div key={foto.id} style={tarjeta}>
                  <img src={foto.url} style={imagen} />
                  <p>Lista para proyectar</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <footer>CUATRO REYNAS EVENTOS © 2026</footer>
    </main>
  )
}

const rejilla = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: '15px',
  marginTop: '20px'
}

const tarjeta = {
  background: '#292929',
  padding: '10px',
  borderRadius: '10px'
}

const imagen = {
  width: '100%',
  height: '150px',
  objectFit: 'cover',
  borderRadius: '8px'
}

export default App