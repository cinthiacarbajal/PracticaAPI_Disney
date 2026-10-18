


/**
 * Disney Explorer
 * Explorador educativo de personajes con Fetch API.
 * API comunitaria: https://disneyapi.dev/docs/
 */
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://api.disneyapi.dev/character';
  const searchForm = document.getElementById('searchForm');
  const characterInput = document.getElementById('characterInput');
  const btnExploreAll = document.getElementById('btnExploreAll');
  const btnRunAsync = document.getElementById('btnRunAsync');
  const btnRunPromises = document.getElementById('btnRunPromises');
  const pageSizeSelect = document.getElementById('pageSize');
  const characterGrid = document.getElementById('characterGrid');
  const resultsLabel = document.getElementById('resultsLabel');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const pageIndicator = document.getElementById('pageIndicator');
  const detailPanel = document.getElementById('detailPanel');
  const requestUrl = document.getElementById('requestUrl');
  const metricsBar = document.getElementById('metricsBar');
  const metricStatus = document.getElementById('metricStatus');
  const metricTime = document.getElementById('metricTime');
  const metricType = document.getElementById('metricType');
  const metricMode = document.getElementById('metricMode');
  const labResult = document.getElementById('labResult');
  const jsonOutput = document.getElementById('jsonOutput');
  const codeOutput = document.getElementById('codeOutput');
  const codeTitle = document.getElementById('codeTitle');
  const btnCopyJson = document.getElementById('btnCopyJson');
  const btnCopyCode = document.getElementById('btnCopyCode');
  const toast = document.getElementById('toast');

  let currentPage = 1;
  let currentQuery = '';
  let currentPageSize = Number(pageSizeSelect.value);
  let lastJson = null;
  let toastTimer;

  const snippets = {
    async: `// Consulta de personajes con async/await
async function buscarPersonajes(url) {
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(\`Error HTTP: \${respuesta.status}\`);
    }
    const datos = await respuesta.json();
    console.log('Personajes recibidos:', datos);
    return datos;
  } catch (error) {
    console.error('No se pudo consultar la API:', error.message);
    throw error;
  }
}`,
    promises: `// Consulta de personajes con Promesas (.then / .catch)
function buscarPersonajesConPromesas(url) {
  return fetch(url)
    .then(respuesta => {
      if (!respuesta.ok) {
        throw new Error(\`Error HTTP: \${respuesta.status}\`);
      }
      return respuesta.json();
    })
    .then(datos => {
      console.log('Personajes recibidos:', datos);
      return datos;
    })
    .catch(error => {
      console.error('No se pudo consultar la API:', error.message);
      throw error;
    });
}`
  };

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    currentQuery = characterInput.value.trim();
    currentPage = 1;
    loadCharacters('async');
  });

  btnExploreAll.addEventListener('click', () => {
    characterInput.value = '';
    currentQuery = '';
    currentPage = 1;
    loadCharacters('async');
  });

  btnRunAsync.addEventListener('click', () => runLabRequest('async'));
  btnRunPromises.addEventListener('click', () => runLabRequest('promises'));
  pageSizeSelect.addEventListener('change', () => {
    currentPageSize = Number(pageSizeSelect.value);
    currentPage = 1;
    loadCharacters('async');
  });
  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) { currentPage -= 1; loadCharacters('async'); }
  });
  btnNext.addEventListener('click', () => {
    if (!btnNext.disabled) { currentPage += 1; loadCharacters('async'); }
  });

  document.querySelectorAll('.tab-btn').forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });
  btnCopyJson.addEventListener('click', () => copyText(lastJson ? JSON.stringify(lastJson, null, 2) : '', 'JSON'));
  btnCopyCode.addEventListener('click', () => copyText(codeOutput.textContent, 'código'));

  characterGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-character-id]');
    if (button) loadCharacterDetail(button.dataset.characterId);
  });
  detailPanel.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-detail]')) detailPanel.classList.add('hidden');
  });

  function makeUrl() {
    const params = new URLSearchParams({ page: String(currentPage), pageSize: String(currentPageSize) });
    if (currentQuery) params.set('name', currentQuery);
    return `${API_BASE}?${params.toString()}`;
  }

  async function loadCharacters(mode = 'async') {
    const url = makeUrl();
    requestUrl.textContent = url;
    showGridLoading();
    detailPanel.classList.add('hidden');
    if (mode === 'promises') return loadCharactersWithPromises(url);
    updateCodeSnippet('async');
    const start = performance.now();
    try {
      const response = await fetch(url);
      const elapsed = Math.round(performance.now() - start);
      updateMetrics(response, elapsed, 'async/await');
      if (!response.ok) throw new Error(`La API respondió con HTTP ${response.status} ${response.statusText}.`);
      const payload = await response.json();
      lastJson = payload;
      jsonOutput.textContent = JSON.stringify(payload, null, 2);
      renderLabSummary(payload);
      const characters = normalizeCharacters(payload);
      renderCharacters(characters);
      updatePagination(payload, characters.length);
    } catch (error) {
      renderGridError(error);
      renderLabError(error);
    }
  }

  function loadCharactersWithPromises(url) {
    updateCodeSnippet('promises');
    const start = performance.now();
    fetch(url)
      .then((response) => {
        const elapsed = Math.round(performance.now() - start);
        updateMetrics(response, elapsed, '.then() / Promesas');
        if (!response.ok) throw new Error(`La API respondió con HTTP ${response.status} ${response.statusText}.`);
        return response.json();
      })
      .then((payload) => {
        lastJson = payload;
        jsonOutput.textContent = JSON.stringify(payload, null, 2);
        renderLabSummary(payload);
        const characters = normalizeCharacters(payload);
        renderCharacters(characters);
        updatePagination(payload, characters.length);
      })
      .catch((error) => {
        renderGridError(error);
        renderLabError(error);
      });
  }

  async function runLabRequest(mode) {
    const url = makeUrl();
    requestUrl.textContent = url;
    activateTab('tab-json');
    labResult.innerHTML = '<div class="loading-state"><span class="spinner"></span><p>Consultando la API…</p></div>';
    updateCodeSnippet(mode);
    const start = performance.now();
    if (mode === 'promises') {
      fetch(url)
        .then((response) => {
          updateMetrics(response, Math.round(performance.now() - start), '.then() / Promesas');
          if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
          return response.json();
        })
        .then((payload) => {
          lastJson = payload;
          jsonOutput.textContent = JSON.stringify(payload, null, 2);
          renderLabSummary(payload);
        })
        .catch(renderLabError);
      return;
    }
    try {
      const response = await fetch(url);
      updateMetrics(response, Math.round(performance.now() - start), 'async/await');
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      const payload = await response.json();
      lastJson = payload;
      jsonOutput.textContent = JSON.stringify(payload, null, 2);
      renderLabSummary(payload);
    } catch (error) {
      renderLabError(error);
    }
  }

  function normalizeCharacters(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (payload?.data && typeof payload.data === 'object' && payload.data.name) return [payload.data];
    if (payload && payload.name) return [payload];
    return [];
  }

  function renderCharacters(characters) {
    if (!characters.length) {
      characterGrid.innerHTML = `<div class="empty-state"><span class="empty-icon">✧</span><strong>No encontramos personajes con ese nombre.</strong><p>Prueba con otro término o pulsa “Descubrir todos” para volver al catálogo.</p></div>`;
      resultsLabel.textContent = currentQuery ? `Sin resultados para “${escapeHtml(currentQuery)}”` : 'No hay personajes disponibles en esta página.';
      return;
    }
    characterGrid.innerHTML = characters.map((character) => {
      const id = character._id ?? character.id ?? '';
      const name = character.name || 'Personaje sin nombre';
      const imageUrl = safeImageUrl(character.imageUrl || character.image || '');
      const firstFilm = (character.films || [])[0] || (character.tvShows || [])[0] || 'Explora su historia';
      const category = (character.films || []).length ? 'PERSONAJE DE CINE' : (character.tvShows || []).length ? 'UNIVERSO DE SERIES' : 'PERSONAJE DISNEY';
      return `<article class="character-card">
        <div class="character-image">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('beforeend','<span class=&quot;image-fallback&quot; aria-label=&quot;Imagen no disponible&quot;>✧</span>')">` : '<span class="image-fallback" aria-label="Imagen no disponible">✧</span>'}</div>
        <div class="character-content"><div class="character-meta"><span>${category}</span><span class="tiny-star">✦</span></div><h3 class="character-title">${escapeHtml(name)}</h3><p class="film-preview">${escapeHtml(firstFilm)}</p><div class="character-actions"><span class="character-meta">${id !== '' ? `ID ${escapeHtml(String(id))}` : 'DISNEY API'}</span><button class="text-action" type="button" data-character-id="${escapeHtml(String(id))}">Ver detalles ↗</button></div></div>
      </article>`;
    }).join('');
    resultsLabel.textContent = currentQuery ? `${characters.length} resultado(s) para “${currentQuery}”` : `${characters.length} personajes en esta página`;
  }

  async function loadCharacterDetail(id) {
    if (!id) { showToast('Este registro no tiene un identificador disponible.'); return; }
    detailPanel.classList.remove('hidden');
    detailPanel.innerHTML = '<div class="loading-state"><span class="spinner"></span><p>Reuniendo los detalles del personaje…</p></div>';
    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const url = `${API_BASE}/${encodeURIComponent(id)}`;
    requestUrl.textContent = url;
    const start = performance.now();
    try {
      const response = await fetch(url);
      updateMetrics(response, Math.round(performance.now() - start), 'async/await · detalle');
      if (!response.ok) throw new Error(`No fue posible cargar el personaje (HTTP ${response.status}).`);
      const payload = await response.json();
      lastJson = payload;
      jsonOutput.textContent = JSON.stringify(payload, null, 2);
      renderLabSummary(payload);
      const character = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
      renderDetail(character);
    } catch (error) {
      detailPanel.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠</span><strong>No pudimos cargar los detalles</strong><p>${escapeHtml(error.message)}</p><button class="btn btn-outline" data-close-detail type="button">Cerrar</button></div>`;
      showToast(error.message);
    }
  }

  function renderDetail(character) {
    const name = character?.name || 'Personaje Disney';
    const imageUrl = safeImageUrl(character?.imageUrl || character?.image || '');
    const films = character?.films || [];
    const shows = character?.tvShows || [];
    const shorts = character?.shortFilms || [];
    const games = character?.videoGames || [];
    const attractions = character?.parkAttractions || [];
    const allies = character?.allies || [];
    const enemies = character?.enemies || [];
    detailPanel.innerHTML = `<div class="detail-topline"><span class="detail-kicker">FICHA DEL PERSONAJE</span><button class="detail-close" type="button" data-close-detail>✕ Cerrar</button></div>
      <div class="detail-main"><div class="detail-portrait">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : '<span class="image-fallback">✧</span>'}</div>
      <div><h3 class="detail-name">${escapeHtml(name)}</h3><p class="detail-id">Identificador: ${escapeHtml(String(character?._id ?? character?.id ?? 'No disponible'))}</p><p class="detail-description">Información obtenida en tiempo real desde la API de personajes Disney.</p>
      <div class="detail-lists">${detailList('Películas', films)}${detailList('Series de TV', shows)}${detailList('Cortometrajes', shorts)}${detailList('Videojuegos', games)}${detailList('Atracciones', attractions)}${detailList('Aliados y enemigos', [...allies.map(x => `Aliado: ${x}`), ...enemies.map(x => `Enemigo: ${x}`)])}</div>
      ${character?.url ? `<a class="detail-link" href="${escapeHtml(safeLink(character.url))}" target="_blank" rel="noopener noreferrer">Ver registro en la API ↗</a>` : ''}</div></div>`;
  }

  function detailList(title, values) {
    const safeValues = Array.isArray(values) ? values.filter(Boolean) : [];
    const text = safeValues.length ? safeValues.slice(0, 10).map(escapeHtml).join(' · ') : 'Sin datos disponibles';
    return `<div class="detail-list"><h4>${title}</h4><p>${text}</p></div>`;
  }

  function updatePagination(payload, count) {
    const info = payload?.info || payload?.paginationInfo || {};
    const totalPages = Number(info.totalPages || info.total_pages || 0);
    pageIndicator.textContent = totalPages ? `Página ${currentPage} de ${totalPages}` : `Página ${currentPage}`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = Boolean(totalPages && currentPage >= totalPages) || count === 0 || count < currentPageSize;
  }

  function showGridLoading() {
    characterGrid.innerHTML = '<div class="loading-state"><span class="spinner"></span><p>Abriendo el libro de historias…</p></div>';
    resultsLabel.textContent = 'Consultando personajes…';
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = true;
  }

  function renderGridError(error) {
    characterGrid.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠</span><strong>No pudimos conectar con la API</strong><p>${escapeHtml(error.message || 'Ocurrió un error inesperado.')}<br>Comprueba tu conexión e inténtalo de nuevo.</p><button class="btn btn-outline" id="btnRetry" type="button">Intentar de nuevo</button></div>`;
    document.getElementById('btnRetry')?.addEventListener('click', () => loadCharacters('async'));
    resultsLabel.textContent = 'La consulta no se pudo completar.';
  }

  function updateMetrics(response, elapsed, mode) {
    metricsBar.classList.remove('hidden');
    metricStatus.textContent = `${response.status} ${response.statusText || ''}`.trim();
    metricStatus.classList.toggle('error', !response.ok);
    metricTime.textContent = `${elapsed} ms`;
    metricType.textContent = response.headers.get('content-type') || 'No especificado';
    metricMode.textContent = mode;
  }

  function renderLabSummary(payload) {
    const characters = normalizeCharacters(payload);
    const info = payload?.info || {};
    const names = characters.slice(0, 6).map(item => item.name).filter(Boolean);
    labResult.innerHTML = `<div class="lab-mini-grid"><div class="lab-mini-item"><span>REGISTROS EN ESTA RESPUESTA</span><strong>${characters.length}</strong></div><div class="lab-mini-item"><span>PÁGINAS DISPONIBLES</span><strong>${info.totalPages ?? 'No indicado'}</strong></div><div class="lab-mini-item"><span>PERSONAJES DE EJEMPLO</span><strong>${names.length ? names.map(escapeHtml).join(', ') : 'Sin nombres detectados'}</strong></div></div>`;
  }

  function renderLabError(error) {
    jsonOutput.textContent = `// Error en la petición\n${error.message || error}`;
    labResult.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠</span><strong>La petición no se completó</strong><p>${escapeHtml(error.message || String(error))}</p></div>`;
    showToast(error.message || 'Error al consultar la API.');
  }

  function updateCodeSnippet(mode) {
    const selected = mode === 'promises' ? 'promises' : 'async';
    codeTitle.textContent = selected === 'async' ? 'Código JavaScript · async/await' : 'Código JavaScript · Promesas .then()';
    codeOutput.textContent = snippets[selected];
  }

  function activateTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach((button) => {
      const active = button.dataset.tab === tabId;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.toggle('active', pane.id === tabId));
  }

  async function copyText(value, label) {
    if (!value) { showToast(`Todavía no hay ${label} para copiar.`); return; }
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label.charAt(0).toUpperCase() + label.slice(1)} copiado al portapapeles.`);
    } catch {
      showToast('El navegador no permitió copiar automáticamente. Selecciona el texto y cópialo manualmente.');
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function safeImageUrl(value) {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }

  function safeLink(value) {
    const url = safeImageUrl(value);
    return url || '#';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  // Carga inicial para que el explorador muestre datos desde que abre la página.
  loadCharacters('async');
});
