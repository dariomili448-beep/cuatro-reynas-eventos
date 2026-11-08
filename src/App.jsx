import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import './App.css'
import { QRCodeSVG } from 'qrcode.react'
import JSZip from 'jszip'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function App() {
  const [nombre, setNombre] = useState('')
  const [dedicatoria, setDedicatoria] = useState('')
  const [archivosInvitado, setArchivosInvitado] = useState([])
  const parametros = new URLSearchParams(window.location.search)
const modoInvitado = parametros.get('subir') === '1'
const eventoQR = parametros.get('evento') || ''
console.log('EVENTO RECIBIDO POR QR:', eventoQR)
const modoProyeccion = parametros.get('proyectar') === '1'
  const [evento, setEvento] = useState('')
  const [activo, setActivo] = useState(false)
  const [pendientes, setPendientes] = useState([])
  const [aprobadas, setAprobadas] = useState([])
  const [todasAprobadas, setTodasAprobadas] = useState([])
  const [fotosProyeccion, setFotosProyeccion] = useState([])
  const [indiceProyeccion, setIndiceProyeccion] = useState(0)
useEffect(() => {
  cargarGaleriaGeneral()
}, [])

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
  if (!modoProyeccion || !eventoQR) return

  async function cargarFotosProyeccion() {
    const { data, error } = await supabase
      .from('fotos')
      .select('*')
      .eq('evento', eventoQR)
      .eq('estado', 'aprobada')

    if (error) {
      console.error('Error al cargar proyección:', error)
      return
    }

    const fotos = await Promise.all(
      (data || []).map(async foto => {
        const { data: urlData } = await supabase.storage
          .from('fotos-eventos')
          .createSignedUrl(foto.nombre_archivo, 3600)

        return {
          ...foto,
          url: urlData?.signedUrl || ''
        }
      })
    )

    setFotosProyeccion(fotos)
  }

  cargarFotosProyeccion()

  const intervalo = setInterval(() => {
    cargarFotosProyeccion()
  }, 5000)

  return () => clearInterval(intervalo)
}, [modoProyeccion, eventoQR])

useEffect(() => {
  if (!modoProyeccion || fotosProyeccion.length <= 1) return

  const intervalo = setInterval(() => {
    setIndiceProyeccion(prev =>
      (prev + 1) % fotosProyeccion.length
    )
  }, 8000)

  return () => clearInterval(intervalo)
}, [modoProyeccion, fotosProyeccion.length])
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
  estado: 'pendiente',
  dedicatoria: dedicatoria
})

    if (errorBD) {
      alert('Error al registrar foto: ' + errorBD.message)
    }
  }

  e.target.value = ''
  setDedicatoria('')
  alert('Carga finalizada')
}
    async function enviarFotosInvitado() {
  if (archivosInvitado.length === 0) {
    alert('Seleccioná al menos una fotografía')
    return
  }

  for (const archivo of archivosInvitado) {
    if (!archivo.type.startsWith('image/')) continue

   const nombrearchivo = `${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { error } = await supabase.storage
      .from('fotos-eventos')
      .upload(nombrearchivo, archivo)

    if (error) {
      alert('Error al subir: ' + error.message)
      continue
    }

    const { error: errorBD } = await supabase.from('fotos').insert({
      evento: eventoQR,
      nombre_archivo: nombrearchivo,
      estado: 'pendiente',
      dedicatoria: dedicatoria
    })

    if (errorBD) {
      alert('Error al registrar foto: ' + errorBD.message)
    }
  }

  setArchivosInvitado([])
  setDedicatoria('')
  alert('¡Tus fotos y dedicatoria fueron enviadas!')
}
async function descargarFotosAprobadas() {
  if (!evento) {
    alert('No hay ningún evento activo')
    return
  }

  const { data: fotos, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('evento', evento)
    .eq('estado', 'aprobada')

  if (error) {
    alert('Error al buscar las fotos: ' + error.message)
    return
  }

  if (!fotos || fotos.length === 0) {
    alert('Todavía no hay fotos aprobadas para descargar')
    return
  }

  const zip = new JSZip()
  const nombreCarpeta = evento.replace(/[\\/:*?"<>|]/g, '_')
  const carpeta = zip.folder(nombreCarpeta)

  let descargadas = 0

  for (const foto of fotos) {
    const { data, error } = await supabase.storage
      .from('fotos-eventos')
      .download(foto.nombre_archivo)

    if (error) {
      console.error(error)
      continue
    }

    carpeta.file(foto.nombre_archivo.split('/').pop(), data)
    descargadas++
  }

  if (descargadas === 0) {
    alert('No se pudo descargar ninguna fotografía')
    return
  }

  const archivoZIP = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(archivoZIP)

  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreCarpeta + '.zip'
  enlace.click()

  URL.revokeObjectURL(url)

  alert('¡Listo! Se descargaron ' + descargadas + ' fotografías')
}
async function aprobar(id) {
  const { data, error } = await supabase
    .from('fotos')
    .update({ estado: 'aprobada' })
    .eq('id', id)
    .select()

  console.log('FOTO ACTUALIZADA:', data)
  console.log('ERROR:', error)

  if (error || !data || data.length === 0) {
    alert('La base de datos no confirmó la aprobación')
    return
  }

  const foto = pendientes.find(f => f.id === id)

  setAprobadas(prev => [...prev, { ...foto, estado: 'aprobada' }])
  setPendientes(prev => prev.filter(f => f.id !== id))
}



 async function rechazar(id) {
  const { data, error } = await supabase
    .from('fotos')
    .update({ estado: 'rechazada' })
    .eq('id', id)
    .select()

  console.log('FOTO RECHAZADA:', data)
  console.log('ERROR:', error)

  if (error || !data || data.length === 0) {
    alert('La base de datos no confirmó el rechazo')
    return
  }

  const foto = pendientes.find(f => f.id === id)

  if (foto) URL.revokeObjectURL(foto.url)

  setPendientes(prev => prev.filter(f => f.id !== id))
}
if (modoProyeccion) {
  const fotoActual = fotosProyeccion[indiceProyeccion]

  return (
    <main style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at center, #282012 0%, #090909 60%, #000 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      color: '#fff',
      textAlign: 'center',
      boxShadow: 'inset 0 0 80px #D4AF3740'
    }}>

      <div style={{
        position: 'absolute',
        top: '3%',
        color: '#D4AF37',
        fontSize: 'clamp(18px, 3vw, 32px)',
        letterSpacing: '5px',
        fontWeight: 'bold'
      }}>
        ♛ CUATRO REYNAS EVENTOS ♛
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '25px',
        width: '94%',
        height: '76%',
        marginTop: '35px'
      }}>

        {/* FOTOGRAFIA Y DEDICATORIA */}

        <div style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>

          {fotoActual ? (
            <>
              <div style={{
                maxWidth: '100%',
                maxHeight: '85%',
                padding: '8px',
                border: '2px solid #D4AF37',
                borderRadius: '14px',
                background: '#080808',
                boxShadow: '0 0 25px #D4AF3780, 0 0 60px #D4AF3730'
              }}>
                <img
                  src={fotoActual.url}
                  alt="Foto del evento"
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    objectFit: 'contain',
                    borderRadius: '7px'
                  }}
                />
              </div>

              {fotoActual.dedicatoria && (
                <p style={{
                  color: '#F5D77A',
                  fontSize: 'clamp(18px, 3vw, 30px)',
                  padding: '10px 20px',
                  margin: '12px',
                  textShadow: '0 0 12px #D4AF3780'
                }}>
                  {fotoActual.dedicatoria}
                </p>
              )}
            </>
          ) : (
            <h2 style={{ color: '#D4AF37' }}>
              Esperando fotos aprobadas...
            </h2>
          )}

        </div>

        {/* CODIGO QR LATERAL */}

        <div style={{
          width: 'clamp(140px, 19vw, 230px)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          padding: '12px',
          border: '2px solid #D4AF37',
          borderRadius: '16px',
          background: '#111',
          boxShadow: '0 0 25px #D4AF3740'
        }}>

          <div style={{
            color: '#D4AF37',
            fontSize: 'clamp(14px, 1.5vw, 20px)',
            fontWeight: 'bold'
          }}>
            ¡COMPARTÍ!
          </div>

          <div style={{
            background: '#fff',
            padding: '10px',
            borderRadius: '10px'
          }}>
           <QRCodeSVG
  value={'https://cuatro-reynas-eventos.vercel.app/?subir=1&evento=' + encodeURIComponent(eventoQR || evento || nombre)}
  size={180}
/>
          </div>

          <div style={{
            color: '#F5D77A',
            fontSize: 'clamp(11px, 1.2vw, 16px)',
            lineHeight: 1.5,
            fontWeight: 'bold'
          }}>
            ESCANEÁ Y ENVIÁ
            <br />
            TUS FOTOS Y MENSAJES
          </div>

        </div>

      </div>

      <div style={{
        position: 'absolute',
        bottom: '3%',
        color: '#D4AF37',
        fontSize: 'clamp(12px, 2vw, 20px)',
        letterSpacing: '4px'
      }}>
        LOS MEJORES MOMENTOS DE TU EVENTO
      </div>

    </main>
  )
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
       <h3 style={{
  color: '#D4AF37',
  fontSize: '26px',
  fontWeight: 'bold',
  margin: '15px 0'
}}>
  EVENTO: {eventoQR}
</h3>
        <p>Seleccioná las fotografías de esta fiesta.</p>
<textarea
  value={dedicatoria}
  onChange={e => setDedicatoria(e.target.value)}
  placeholder="Escribí tu dedicatoria para los homenajeados..."
  rows={4}
/>
    <input
  type="file"
  accept="image/*"
  multiple
  onChange={e => setArchivosInvitado(Array.from(e.target.files || []))}
/>
<button onClick={enviarFotosInvitado}>
  ENVIAR FOTOS Y DEDICATORIA
</button>
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
https://cuatro-reynas-eventos.vercel.app/
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
                  <p style={{ color: '#D4AF37' }}>
  {foto.dedicatoria}
</p>
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
            <button
  onClick={descargarFotosAprobadas}
  style={{
    width: '100%',
    padding: '15px',
    margin: '15px 0',
    background: '#D4AF37',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer'
  }}
>
  DESCARGAR FOTOS APROBADAS DEL EVENTO
</button>
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

      <button
        onClick={() => {
         window.open(
  '/?proyectar=1&evento=' + encodeURIComponent(evento),
  'pantallaProyeccion'
)
        }}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '10px',
          background: '#16a34a',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        PROYECTAR FOTO
      </button>
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