/* ========== WEL-T EDITS Website — Main JS ========== */

// --- Mobile nav toggle ---
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '\u2715' : '\u2630';
    });
    // Close menu on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.textContent = '\u2630';
      });
    });
  }

  // --- Mark active nav link ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
    // Also mark parent for case-studies subpages
    if (currentPage.includes('case-studies') || window.location.pathname.includes('case-studies')) {
      if (href === 'case-studies.html' || href === '../case-studies.html') {
        a.classList.add('active');
      }
    }
  });
});

// --- PDF Viewer (using PDF.js from CDN) ---
const PDFViewer = {
  instances: {},

  async init(containerId, pdfUrl, title) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (!pdfjsLib) {
      console.error('PDF.js not loaded');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const instance = {
      pdf,
      currentPage: 1,
      totalPages: pdf.numPages,
      container,
      rendering: false,
    };

    this.instances[containerId] = instance;

    // Update page info
    const pageInfo = container.querySelector('.page-info');
    if (pageInfo) pageInfo.textContent = `1 / ${pdf.numPages}`;

    // Render first page
    await this.renderPage(containerId, 1);

    // Bind controls
    const prevBtn = container.querySelector('.pdf-prev');
    const nextBtn = container.querySelector('.pdf-next');
    const fsBtn = container.querySelector('.pdf-fullscreen');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prevPage(containerId));
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage(containerId));
    if (fsBtn) fsBtn.addEventListener('click', () => this.fullscreen(containerId));

    // Keyboard navigation when container is focused/hovered
    container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevPage(containerId);
      if (e.key === 'ArrowRight') this.nextPage(containerId);
    });
    container.setAttribute('tabindex', '0');
  },

  async renderPage(containerId, pageNum) {
    const instance = this.instances[containerId];
    if (!instance || instance.rendering) return;

    instance.rendering = true;
    const page = await instance.pdf.getPage(pageNum);
    const canvasWrapper = instance.container.querySelector('.pdf-canvas-wrapper');
    let canvas = canvasWrapper.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasWrapper.appendChild(canvas);
    }

    const wrapperWidth = canvasWrapper.clientWidth - 32;
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(wrapperWidth / viewport.width, 2);
    const scaledViewport = page.getViewport({ scale });

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport: scaledViewport,
    }).promise;

    instance.currentPage = pageNum;
    const pageInfo = instance.container.querySelector('.page-info');
    if (pageInfo) pageInfo.textContent = `${pageNum} / ${instance.totalPages}`;

    instance.rendering = false;
  },

  prevPage(containerId) {
    const instance = this.instances[containerId];
    if (instance && instance.currentPage > 1) {
      this.renderPage(containerId, instance.currentPage - 1);
    }
  },

  nextPage(containerId) {
    const instance = this.instances[containerId];
    if (instance && instance.currentPage < instance.totalPages) {
      this.renderPage(containerId, instance.currentPage + 1);
    }
  },

  fullscreen(containerId) {
    const instance = this.instances[containerId];
    if (!instance) return;
    const wrapper = instance.container.querySelector('.pdf-canvas-wrapper');
    if (wrapper.requestFullscreen) wrapper.requestFullscreen();
    else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
  }
};

// --- Helper: create PDF viewer HTML ---
function createPdfViewerHTML(id, title, pdfPath) {
  return `
    <div class="pdf-viewer-container" id="${id}">
      <div class="pdf-viewer-toolbar">
        <span class="pdf-title">${title}</span>
        <div class="pdf-controls">
          <button class="pdf-prev">\u25C0 Prev</button>
          <span class="page-info">Loading...</span>
          <button class="pdf-next">Next \u25B6</button>
          <button class="pdf-fullscreen">\u26F6</button>
        </div>
      </div>
      <div class="pdf-canvas-wrapper"></div>
    </div>`;
}
