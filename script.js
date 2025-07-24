let bases = []; // { workbook, nombreArchivo, fechaCarga, novedadesRegistradas: [] }
let baseActivaIndex = null;

// Mostrar/ocultar campo de login admin
function toggleAdmin() {
  const login = document.getElementById('adminLogin');
  login.style.display = login.style.display === 'none' ? 'block' : 'none';
}

// Verificar contraseña para acceso al panel admin
function verificarAcceso() {
  const pass = document.getElementById('password').value;
  if (pass === 'primeralinea#') {
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminLogin').style.display = 'none';
  } else {
    alert('❌ Contraseña incorrecta');
  }
}

// Actualiza la lista de bases en el panel admin
function actualizarListaBases() {
  const lista = document.getElementById('listaBases');
  lista.innerHTML = '';

  if (bases.length === 0) {
    lista.innerHTML = '<p>No hay bases cargadas.</p>';
    baseActivaIndex = null;
    return;
  }

  bases.forEach((base, idx) => {
    const fechaStr = base.fechaCarga.toLocaleString();
    const activo = idx === baseActivaIndex ? ' (Activa)' : '';
    const item = document.createElement('li');
    item.textContent = `${base.nombreArchivo} - Subida: ${fechaStr}${activo}`;
    item.style.cursor = 'pointer';
    item.style.padding = '5px';
    if (idx === baseActivaIndex) item.style.fontWeight = 'bold';
    item.onclick = () => {
      baseActivaIndex = idx;
      actualizarListaBases();
      alert(`Base activa cambiada a: ${base.nombreArchivo}`);
      limpiarFormulario();
    };
    lista.appendChild(item);
  });
}

// Limpia formulario y mensajes
function limpiarFormulario() {
  document.getElementById('codigoCliente').value = '';
  document.getElementById('nombreCliente').value = '';
  document.getElementById('novedad').value = '';
  document.getElementById('observaciones').value = '';
  document.getElementById('mensaje').textContent = '';
}

// Evento para cargar archivos Excel y guardar en repositorio
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('inputArchivo');
  if (input) {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const data = await file.arrayBuffer();
      const libro = XLSX.read(data);

      bases.push({
        workbook: libro,
        nombreArchivo: file.name,
        fechaCarga: new Date(),
        novedadesRegistradas: []
      });

      baseActivaIndex = bases.length - 1;
      actualizarListaBases();
      alert(`📁 Base '${file.name}' cargada con éxito y establecida como activa`);
      limpiarFormulario();
    });
  }
});

// Buscar cliente en la base activa (columna C -> índice 2)
function buscarCliente() {
  if (baseActivaIndex === null) {
    document.getElementById('nombreCliente').value = "(No hay base activa)";
    return;
  }
  const codigo = document.getElementById('codigoCliente').value.trim();
  if (!codigo) {
    document.getElementById('nombreCliente').value = '';
    return;
  }

  const base = bases[baseActivaIndex];
  const hoja = base.workbook.Sheets[base.workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  // Buscar codigo en columna C (índice 2), convertir a string para seguridad
  const fila = datos.find(row => String(row[2]).trim() === codigo);

  if (fila) {
    document.getElementById('nombreCliente').value = fila[3] || "(sin nombre)";
  } else {
    document.getElementById('nombreCliente').value = "❌ No encontrado";
  }
}

// Registrar novedad en la base activa
function registrarNovedad() {
  if (baseActivaIndex === null) {
    alert('⚠️ No hay base activa seleccionada para registrar novedades');
    return;
  }

  const codigo = document.getElementById('codigoCliente').value.trim();
  const novedad = document.getElementById('novedad').value;
  const obs = document.getElementById('observaciones').value;
  const nombre = document.getElementById('nombreCliente').value || "(sin nombre)";

  if (!codigo || !novedad) {
    alert('⚠️ Completa todos los campos obligatorios');
    return;
  }

  const base = bases[baseActivaIndex];
  const hoja = base.workbook.Sheets[base.workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  // Validar que el código exista en la base activa
  const existe = datos.some(row => String(row[2]).trim() === codigo);
  if (!existe) {
    alert('❌ Código no encontrado en la base activa');
    return;
  }

  // Fecha y hora separados
  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-ES'); // formato dd/mm/yyyy
  const horaStr = now.toLocaleTimeString('es-ES', { hour12: false }); // formato 24h HH:mm:ss

  // Guardar novedad en array novedadesRegistradas dentro de la base activa
  base.novedadesRegistradas.push({
    codigo,
    nombre,
    novedad,
    observaciones: obs,
    fecha: fechaStr,
    hora: horaStr
  });

  document.getElementById('mensaje').textContent = '✅ Novedad registrada correctamente';

  limpiarFormulario();

  // Mensaje temporal
  setTimeout(() => {
    document.getElementById('mensaje').textContent = '';
  }, 3000);
}

// Descargar Excel con novedades integradas en la base activa
function descargarExcel() {
  if (baseActivaIndex === null) {
    alert('⚠️ No hay base activa para descargar');
    return;
  }

  const base = bases[baseActivaIndex];
  const libroOriginal = base.workbook;
  const hojaOriginal = libroOriginal.Sheets[libroOriginal.SheetNames[0]];
  const datosOriginales = XLSX.utils.sheet_to_json(hojaOriginal, { header: 1 });

  // Agregar columnas para novedades, si no existen
  // Vamos a agregar las columnas nuevas al final:
  // - Columna N: Novedad
  // - Columna O: Observaciones
  // - Columna P: Fecha Novedad
  // - Columna Q: Hora Novedad

  // Copiar datos originales y agregar encabezados si no están
  let datosFinales = [];

  // Encabezados originales + nuevos
  const encabezados = datosOriginales[0].slice(); // copia encabezados
  if (!encabezados.includes('Novedad')) encabezados.push('Novedad');
  if (!encabezados.includes('Observaciones')) encabezados.push('Observaciones');
  if (!encabezados.includes('Fecha Novedad')) encabezados.push('Fecha Novedad');
  if (!encabezados.includes('Hora Novedad')) encabezados.push('Hora Novedad');

  datosFinales.push(encabezados);

  // Crear un índice para novedades por código para rápido acceso
  const novedadesPorCodigo = {};
  base.novedadesRegistradas.forEach(n => {
    if (!novedadesPorCodigo[n.codigo]) novedadesPorCodigo[n.codigo] = [];
    novedadesPorCodigo[n.codigo].push(n);
  });

  // Recorrer todas las filas originales (excepto encabezados)
  for (let i = 1; i < datosOriginales.length; i++) {
    const fila = datosOriginales[i].slice();

    const codigoFila = String(fila[2]).trim();

    // Agregar columnas nuevas vacías por defecto
    let novedadStr = '';
    let obsStr = '';
    let fechaStr = '';
    let horaStr = '';

    // Si hay novedades para este código, concatenar todas
    if (novedadesPorCodigo[codigoFila]) {
      const novedades = novedadesPorCodigo[codigoFila];
      novedadStr = novedades.map(n => n.novedad).join(' | ');
      obsStr = novedades.map(n => n.observaciones).join(' | ');
      fechaStr = novedades.map(n => n.fecha).join(' | ');
      horaStr = novedades.map(n => n.hora).join(' | ');
    }

    // Agregar las 4 columnas nuevas al final
    fila.push(novedadStr, obsStr, fechaStr, horaStr);

    datosFinales.push(fila);
  }

  // Crear nueva hoja y libro para descargar
  const nuevaHoja = XLSX.utils.aoa_to_sheet(datosFinales);
  const nuevoLibro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(nuevoLibro, nuevaHoja, 'Novedades');

  const nombreArchivo = `base_con_novedades_${base.nombreArchivo.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(nuevoLibro, nombreArchivo);
}
