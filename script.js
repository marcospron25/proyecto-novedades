let bases = [];
let baseActivaIndex = null;

function toggleAdmin() {
  const login = document.getElementById('adminLogin');
  login.style.display = login.style.display === 'none' ? 'block' : 'none';
}

function verificarAcceso() {
  const pass = document.getElementById('password').value;
  if (pass === 'primeralinea#') {
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminLogin').style.display = 'none';
  } else {
    alert('❌ Contraseña incorrecta');
  }
}

function guardarBasesEnStorage() {
  const almacen = bases.map(b => ({
    nombreArchivo: b.nombreArchivo,
    fechaCarga: b.fechaCarga.getTime(),
    novedadesRegistradas: b.novedadesRegistradas,
    sheetData: XLSX.utils.sheet_to_json(b.workbook.Sheets[b.workbook.SheetNames[0]], { header: 1 })
  }));
  localStorage.setItem('misBases', JSON.stringify({ bases: almacen, activa: baseActivaIndex }));
}

function cargarBasesDeStorage() {
  const json = localStorage.getItem('misBases');
  if (!json) return;

  const obj = JSON.parse(json);
  baseActivaIndex = obj.activa;
  obj.bases.forEach(b => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(b.sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    bases.push({
      workbook: wb,
      nombreArchivo: b.nombreArchivo,
      fechaCarga: new Date(b.fechaCarga),
      novedadesRegistradas: b.novedadesRegistradas
    });
  });
}

function actualizarListaBases(sinAlert = false) {
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
    if (idx === baseActivaIndex) item.style.fontWeight = 'bold';
    item.onclick = () => {
      baseActivaIndex = idx;
      actualizarListaBases();
      if (!sinAlert) alert(`Base activa: ${base.nombreArchivo}`);
      limpiarFormulario();
      guardarBasesEnStorage();
    };
    lista.appendChild(item);
  });
}

function limpiarFormulario() {
  document.getElementById('codigoCliente').value = '';
  document.getElementById('nombreCliente').value = '';
  document.getElementById('novedad').value = '';
  document.getElementById('observaciones').value = '';
  document.getElementById('mensaje').textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  cargarBasesDeStorage();
  actualizarListaBases(true);

  const input = document.getElementById('inputArchivo');
  if (input) {
    input.addEventListener('change', async e => {
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
      guardarBasesEnStorage();
      actualizarListaBases();
      alert(`📁 Base '${file.name}' cargada y activa`);
      limpiarFormulario();
    });
  }
});

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
  const fila = datos.find(row => String(row[2]).trim() === codigo);

  document.getElementById('nombreCliente').value = fila ? (fila[3] || "(sin nombre)") : "❌ No encontrado";
}

function registrarNovedad() {
  if (baseActivaIndex === null) {
    alert('⚠️ No hay base activa seleccionada');
    return;
  }

  const codigo = document.getElementById('codigoCliente').value.trim();
  const novedad = document.getElementById('novedad').value;
  const obs = document.getElementById('observaciones').value;

  if (!codigo || !novedad) {
    alert('⚠️ Completa todos los campos obligatorios');
    return;
  }

  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-ES');
  const horaStr = now.toLocaleTimeString('es-ES', { hour12: false });

  bases[baseActivaIndex].novedadesRegistradas.push({
    codigo,
    novedad,
    observaciones: obs,
    fecha: fechaStr,
    hora: horaStr
  });

  document.getElementById('mensaje').textContent = '✅ Novedad registrada correctamente';
  limpiarFormulario();
  guardarBasesEnStorage();

  setTimeout(() => document.getElementById('mensaje').textContent = '', 3000);
}

function descargarExcel() {
  if (baseActivaIndex === null) {
    alert('⚠️ No hay base activa');
    return;
  }

  const base = bases[baseActivaIndex];
  const hojaO = base.workbook.Sheets[base.workbook.SheetNames[0]];
  const datosOrig = XLSX.utils.sheet_to_json(hojaO, { header: 1 });
  const encabezados = datosOrig[0].slice();

  ['Novedad', 'Observaciones', 'Fecha Novedad', 'Hora Novedad'].forEach(c => {
    if (!encabezados.includes(c)) encabezados.push(c);
  });

  const datosFinales = [encabezados];

  const novedadesMap = {};
  base.novedadesRegistradas.forEach(n => {
    if (!novedadesMap[n.codigo]) novedadesMap[n.codigo] = [];
    novedadesMap[n.codigo].push(n);
  });

  for (let i = 1; i < datosOrig.length; i++) {
    const fila = datosOrig[i].slice();
    const codigo = String(fila[2]).trim();

    const arreglo = novedadesMap[codigo] || [];
    const nov = arreglo.map(n => n.novedad).join(' | ');
    const obs = arreglo.map(n => n.observaciones).join(' | ');
    const fet = arreglo.map(n => n.fecha).join(' | ');
    const hor = arreglo.map(n => n.hora).join(' | ');

    fila.push(nov, obs, fet, hor);
    datosFinales.push(fila);
  }

  const nh = XLSX.utils.aoa_to_sheet(datosFinales);
  const nlib = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(nlib, nh, 'Con Novedades');
  const fn = new Date().toISOString().slice(0,10);
  XLSX.writeFile(nlib, `${base.nombreArchivo.replace(/\.[^/.]+$/,'')}_con_novedades_${fn}.xlsx`);
}
