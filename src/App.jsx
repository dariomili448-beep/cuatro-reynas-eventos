import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import './App.css'
import { QRCodeSVG } from 'qrcode.react'


const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function App() {
  const [nombre, setNombre] = useState('')
  const parametros = new URLSearchParams(window.location.search)
const modoInvitado = parametros.get('subir') === '1'
const eventoQR = parametros.get('evento') || ''
  const [evento, setEvento] = useState('')
  const [activo, setActivo] = useState(false)
  const [pendientes, setPendientes] = useState([])
  const [aprobadas, setAprobadas] = useState([])
  const [todasAprobadas, setTodasAprobadas] = useState([])
useEffect(() => {
  if (!activo || !evento) return

  async function cargarFotosGuardadas() {
    const { data, error } = await supabase
      .from('fotos')
      .select('*')
      .eq('evento', evento)

    if (error) {
      console.error(error)
      return
    }

    const fotos = await Promise.all(
      (data || []).map(async foto => {
        const { data: urlData } = await supabase.storage
          .from('fotos-eventos')
          .createSignedUrl(foto.nombre_archivo, 3600)

        return {
          ...foto,
          url: urlData?.signedUrl || '',
          nombre: foto.nombre_archivo
        }
      })
    )

    setPendientes(fotos.filter(f => f.estado === 'pendiente'))
    setAprobadas(fotos.filter(f => f.estado === 'aprobada'))
  }

  cargarFotosGuardadas()

const intervalo = setInterval(() => {
  cargarFotosGuardadas()
}, 5000)

return () => clearInterval(intervalo)
}, [activo, evento])
useEffect(() => {
  cargarGaleriaGeneral()
}, [])
async function cargarGaleriaGeneral() {
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('estado', 'aprobada')

  if (error) {
    console.error(error)
    return
  }

  const fotos = await Promise.all(
    (data || []).map(async foto => {
      const { data: urlData } = await supabase.storage
        .from('fotos-eventos')
        .createSignedUrl(foto.nombre_archivo, 3600)

      return {
        ...foto,
        url: urlData?.signedUrl || '',
        nombre: foto.nombre_archivo
      }
    })
  )

  setTodasAprobadas(fotos)
}
  function crearEvento() {
    if (!nombre.trim()) {
      alert('Escribí el nombre del evento')
      return
    }
    setEvento(nombre)
    setActivo(true)
  }

  async function cargarFotos(e) {
  const archivos = Array.from(e.target.files || [])

  for (const archivo of archivos) {
    if (!archivo.type.startsWith('image/')) continue

  const nombrearchivo = `${crypto.randomUUID()}-${archivo.name}`;

    const { error } = await supabase.storage
      .from('fotos-eventos')
      .upload(nombrearchivo, archivo)

    if (error) {
      alert('Error al subir: ' + error.message)
      continue
    }

    const { error: errorBD } = await supabase
      .from('fotos')
      .insert({
       evento: modoInvitado ? eventoQR : evento,
        nombre_archivo: nombrearchivo,
        estado: 'pendiente'
})

    if (errorBD) {
      alert('Error al registrar foto: ' + errorBD.message)
    }
  }

  e.target.value = ''
  alert('Carga finalizada')
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
if (modoInvitado) {
  return (
    <main className="app">
      <header>
        <h1>CUATRO REYNAS</h1>
        <p>FOTOS EN DIRECTO</p>
        <span>EVENTOS & EXPERIENCIAS</span>
      </header>

      <section className="panel">
        <h2>¡Compartí tus fotos!</h2>
        <h3>{eventoQR}</h3>
        <p>Seleccioná las fotografías de esta fiesta.</p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={cargarFotos}
        />
      </section>
    </main>
  )
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
<div style={{ margin: '20px 0', textAlign: 'center' }}>
  <h3>ESCANEÁ PARA SUBIR FOTOS</h3>
  <QRCodeSVG
 value={window.location.origin + '/?subir=1&evento=' + encodeURIComponent(evento)}
    size={220}
  />
  <p>Compartí este código con tus invitados</p>
</div>
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
<h2>GALERÍA GENERAL</h2>
<p>Los mejores momentos de nuestros eventos</p>

<div style={rejilla}>
  {todasAprobadas.map(foto => (
    <div key={foto.id} style={tarjeta}>
      <img
        src={foto.url}
        style={imagen}
        alt={foto.evento}
      />
      <p>{foto.evento}</p>
    </div>
  ))}
</div>
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
  width: "100%",
  height: "150px",
  objectFit: "cover",
  borderRadius: "8px"
};

export default App;