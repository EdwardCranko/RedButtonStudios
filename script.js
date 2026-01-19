/* ============================================
   RED BUTTON STUDIOS - Digital Portfolio Card
   Vanilla JavaScript | ES6+ | GSAP
   ============================================ */

'use strict';

/* -------------------- DOM Elements -------------------- */
const DOM = {
  navToggle: document.getElementById('navToggle'),
  mobileMenu: document.getElementById('mobileMenu'),
  mobileLinks: document.querySelectorAll('.mobile-menu-link'),
  cardSwapContainer: document.getElementById('cardSwap'),
  cards: document.querySelectorAll('.card'),
  backToTop: document.getElementById('backToTop'),
  revealElements: document.querySelectorAll('.about-portfolio-section'),
  siteOverlay: document.getElementById('siteOverlay'),
  enterSite: document.getElementById('enterSite'),
  overlayDismiss: document.querySelectorAll('[data-overlay-close]')
};

/* -------------------- State -------------------- */
const state = {
  isMenuOpen: false,
  cardOrder: [],
  swapInterval: null,
  isPaused: false,
  lenis: null
};

/* -------------------- Site Overlay -------------------- */
const initSiteOverlay = () => {
  if (!DOM.siteOverlay) return;
  const overlay = DOM.siteOverlay;
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocusOutside = null;

  const getFocusable = () => Array.from(overlay.querySelectorAll(focusableSelector))
    .filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');

  const focusFirst = () => {
    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus();
    }
  };

  const unlockSite = () => {
    if (overlay.classList.contains('is-hidden')) return;
    const fallbackFocus = document.querySelector('.site-logo');
    const canRestoreFocus = lastFocusOutside
      && lastFocusOutside !== document.body
      && !overlay.contains(lastFocusOutside)
      && typeof lastFocusOutside.focus === 'function';
    const focusTarget = canRestoreFocus ? lastFocusOutside : fallbackFocus;
    if (focusTarget) {
      focusTarget.focus({ preventScroll: true });
    }
    overlay.classList.add('is-hidden');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    overlay.setAttribute('inert', '');
    document.body.classList.remove('site-locked');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const showOverlay = () => {
    overlay.classList.remove('is-hidden');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.inert = false;
    overlay.removeAttribute('inert');
    if (!overlay.contains(document.activeElement)) {
      lastFocusOutside = document.activeElement;
      focusFirst();
    }
  };

  if (['#main', '#site', '#home'].includes(window.location.hash)) {
    unlockSite();
  } else {
    showOverlay();
  }

  DOM.enterSite?.addEventListener('click', unlockSite);

  DOM.overlayDismiss.forEach((el) => {
    el.addEventListener('click', () => {
      unlockSite();
    });
  });

  overlay.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('is-hidden')) return;
    if (e.key === 'Escape') {
      unlockSite();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = getFocusable();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
};

/* -------------------- Overlay Flicker Grid -------------------- */
const initOverlayFlickerGrid = () => {
  const overlay = document.getElementById('siteOverlay');
  if (!overlay) return;
  const container = overlay.querySelector('.overlay-grid');
  if (!container) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const config = {
    squareSize: 4,
    gridGap: 6,
    flickerChance: 0.1,
    color: '#cbd5e1',
    maxOpacity: 0.7
  };

  const toRGBA = (color) => {
    const scratch = document.createElement('canvas');
    scratch.width = scratch.height = 1;
    const sctx = scratch.getContext('2d');
    if (!sctx) return 'rgba(255, 255, 255,';
    sctx.fillStyle = color;
    sctx.fillRect(0, 0, 1, 1);
    const data = sctx.getImageData(0, 0, 1, 1).data;
    return `rgba(${data[0]}, ${data[1]}, ${data[2]},`;
  };

  const colorPrefix = toRGBA(config.color);
  let cols = 0;
  let rows = 0;
  let squares = null;
  let dpr = 1;
  let rafId = 0;
  let lastTime = 0;

  const setupCanvas = () => {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || window.innerWidth));
    const height = Math.max(1, Math.floor(rect.height || window.innerHeight));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    cols = Math.floor(width / (config.squareSize + config.gridGap));
    rows = Math.floor(height / (config.squareSize + config.gridGap));
    const count = Math.max(1, cols * rows);
    squares = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      squares[i] = Math.random() * config.maxOpacity;
    }
  };

  const updateSquares = (deltaTime) => {
    if (!squares) return;
    for (let i = 0; i < squares.length; i += 1) {
      if (Math.random() < config.flickerChance * deltaTime) {
        squares[i] = Math.random() * config.maxOpacity;
      }
    }
  };

  const drawGrid = () => {
    if (!squares) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < rows; j += 1) {
        const opacity = squares[i * rows + j];
        ctx.fillStyle = `${colorPrefix}${opacity})`;
        ctx.fillRect(
          i * (config.squareSize + config.gridGap) * dpr,
          j * (config.squareSize + config.gridGap) * dpr,
          config.squareSize * dpr,
          config.squareSize * dpr
        );
      }
    }
  };

  const animate = (time) => {
    const isHidden = overlay.classList.contains('is-hidden');
    if (!isHidden) {
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      updateSquares(deltaTime);
      drawGrid();
    }
    rafId = requestAnimationFrame(animate);
  };

  setupCanvas();
  const ro = new ResizeObserver(setupCanvas);
  ro.observe(container);
  rafId = requestAnimationFrame(animate);

  overlay._flickerCleanup = () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
};

/* -------------------- Utility Functions -------------------- */
const throttle = (func, limit = 100) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/* -------------------- Mobile Menu -------------------- */
const initMobileMenu = () => {
  DOM.navToggle?.addEventListener('click', toggleMobileMenu);
  
  DOM.mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (state.isMenuOpen) toggleMobileMenu();
    });
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isMenuOpen) {
      toggleMobileMenu();
    }
  });
};

const toggleMobileMenu = () => {
  state.isMenuOpen = !state.isMenuOpen;
  DOM.navToggle?.classList.toggle('active', state.isMenuOpen);
  DOM.mobileMenu?.classList.toggle('active', state.isMenuOpen);
  DOM.navToggle?.setAttribute('aria-expanded', state.isMenuOpen);
};

/* -------------------- Card Swap Carousel -------------------- */
const initCardSwap = () => {
  if (!DOM.cardSwapContainer || DOM.cards.length === 0) return;
  
  const cards = Array.from(DOM.cards);
  const total = cards.length;
  state.cardOrder = cards.map((_, i) => i);
  
  const cardDistance = 60;
  const verticalDistance = 30;
  const skewAmount = 6;
  
  const makeSlot = (i) => ({
    x: i * cardDistance,
    y: -i * verticalDistance,
    z: -i * cardDistance * 1.5,
    zIndex: total - i
  });
  
  const placeCard = (el, slot) => {
    if (typeof gsap !== 'undefined') {
      gsap.set(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        xPercent: -50,
        yPercent: -50,
        skewY: skewAmount,
        transformOrigin: 'center center',
        zIndex: slot.zIndex,
        force3D: true
      });
    } else {
      el.style.transform = `translate(-50%, -50%) translate3d(${slot.x}px, ${slot.y}px, ${slot.z}px) skewY(${skewAmount}deg)`;
      el.style.zIndex = slot.zIndex;
    }
  };
  
  cards.forEach((card, i) => {
    placeCard(card, makeSlot(i));
  });
  
  const swap = () => {
    if (state.cardOrder.length < 2 || state.isPaused) return;
    
    const [front, ...rest] = state.cardOrder;
    const elFront = cards[front];
    
    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline();
      
      tl.to(elFront, {
        y: '+=400',
        duration: 1.5,
        ease: 'elastic.out(0.6, 0.9)'
      });
      
      tl.addLabel('promote', '-=1.2');
      
      rest.forEach((idx, i) => {
        const el = cards[idx];
        const slot = makeSlot(i);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(el, {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: 1.5,
          ease: 'elastic.out(0.6, 0.9)'
        }, `promote+=${i * 0.1}`);
      });
      
      const backSlot = makeSlot(cards.length - 1);
      tl.addLabel('return', 'promote+=0.3');
      tl.call(() => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      }, null, 'return');
      tl.to(elFront, {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: 1.5,
        ease: 'elastic.out(0.6, 0.9)'
      }, 'return');
      
      tl.call(() => {
        state.cardOrder = [...rest, front];
      });
    }
  };
  
  state.swapInterval = setInterval(swap, 5000);
  
  DOM.cardSwapContainer.addEventListener('mouseenter', () => {
    state.isPaused = true;
  });
  
  DOM.cardSwapContainer.addEventListener('mouseleave', () => {
    state.isPaused = false;
  });
};

/* -------------------- Scroll Reveal -------------------- */
const initScrollReveal = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    DOM.revealElements.forEach(el => el.classList.add('visible'));
    return;
  }
  
  DOM.revealElements.forEach(el => el.classList.add('reveal'));
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  DOM.revealElements.forEach(el => observer.observe(el));
};

/* -------------------- Back to Top -------------------- */
const initBackToTop = () => {
  DOM.backToTop?.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
};

/* -------------------- Lenis Smooth Scroll -------------------- */
const initLenis = () => {
  if (typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
  });

  state.lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
};

/* -------------------- Smooth Scroll -------------------- */
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      
      if (state.lenis) {
        if (targetId === '#') {
          state.lenis.scrollTo(0);
        } else {
          state.lenis.scrollTo(targetId, { offset: -100 });
        }
      } else {
        // Fallback if Lenis fails to load
        if (targetId === '#') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const target = document.querySelector(targetId);
          if (target) {
            window.scrollTo({ top: target.offsetTop - 100, behavior: 'smooth' });
          }
        }
      }
    });
  });
};

/* -------------------- Plasma Effect -------------------- */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.5, 0.2];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;
  
  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);
  
  float i = 0.0;
  float d = 1.0;
  float z = 0.0;
  float T = iTime * uSpeed * uDirection;
  vec3 O = vec3(0.0);
  vec3 p = vec3(0.0);
  vec3 S = vec3(0.0);

  for (vec2 r = iResolution.xy, Q; ++i < 60.; ) {
    p = z*normalize(vec3(C-.5*r,r.y)); 
    p.z -= 4.; 
    S = p;
    d = p.y-T;
    
    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05); 
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T)); 
    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4; 
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
    float safeD = (d >= 0.0 ? 1.0 : -1.0) * max(abs(d), 1e-4);
    O += o.w / safeD * o.xyz;
  }
  
  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);
  
  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));
  
  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}`;

const createPlasmaEffect = () => {
  const container = document.getElementById('aboutAurora');
  if (!container) {
    console.error('Plasma container not found');
    return;
  }
  
  console.log('Creating plasma effect');
  
  // Clear container and set class
  container.innerHTML = '';
  container.classList.add('plasma-container');
  container.classList.remove('aurora--fallback');
  
  // Use local OGL implementation
  const initPlasmaWebGL = () => {
    try {
      // Check if OGL is available (local implementation)
      if (!window.OGL) {
        console.error('Local OGL implementation not found');
        return;
      }
      
      const { Renderer, Program, Mesh, Triangle } = window.OGL;
      
      // Configuration
      const config = {
        color: '#b19eef',
        speed: 1,
        direction: 'forward',
        scale: 1,
        opacity: 1,
        mouseInteractive: true
      };
      
      const useCustomColor = config.color ? 1.0 : 0.0;
      const customColorRgb = config.color ? hexToRgb(config.color) : [1, 1, 1];
      const directionMultiplier = config.direction === 'reverse' ? -1.0 : 1.0;

      // Renderer setup
      const renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
      
      const gl = renderer.gl;
      const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      if (!isWebGL2) {
        throw new Error('WebGL2 is required for the plasma shader.');
      }
      const canvas = gl.canvas;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      container.appendChild(canvas);

      // Geometry and program
      const geometry = new Triangle(gl);

      const program = new Program(gl, {
        vertex: vertex,
        fragment: fragment,
        uniforms: {
          iTime: { value: 0 },
          iResolution: { value: new Float32Array([1, 1]) },
          uCustomColor: { value: new Float32Array(customColorRgb) },
          uUseCustomColor: { value: useCustomColor },
          uSpeed: { value: config.speed * 0.4 },
          uDirection: { value: directionMultiplier },
          uScale: { value: config.scale },
          uOpacity: { value: config.opacity },
          uMouse: { value: new Float32Array([0, 0]) },
          uMouseInteractive: { value: config.mouseInteractive ? 1.0 : 0.0 }
        }
      });

      const mesh = new Mesh(gl, { geometry, program });

      // Mouse handling
      const mousePos = { x: 0, y: 0 };
      const handleMouseMove = (e) => {
        if (!config.mouseInteractive) return;
        const rect = container.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
        const mouseUniform = program.uniforms.uMouse.value;
        mouseUniform[0] = mousePos.x;
        mouseUniform[1] = mousePos.y;
      };

      const interactionTarget = container.closest('.about__card') || container;
      if (config.mouseInteractive) {
        interactionTarget.addEventListener('mousemove', handleMouseMove);
      }

      // Resize handling
      let lastWidth = 0;
      let lastHeight = 0;

      const setSize = (width, height) => {
        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));
        
        if (lastWidth === width && lastHeight === height) return;
        lastWidth = width;
        lastHeight = height;
        
        renderer.setSize(width, height);
        const res = program.uniforms.iResolution.value;
        res[0] = gl.drawingBufferWidth;
        res[1] = gl.drawingBufferHeight;
      };

      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setSize(width, height);
        }
      });
      ro.observe(container);

      // Initial size
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize(rect.width, rect.height);
      }

      // Animation loop
      let raf = 0;
      let isRendering = false;
      const t0 = performance.now();
      
      const render = (t) => {
        let timeValue = (t - t0) * 0.001;
        if (config.direction === 'pingpong') {
          const pingpongDuration = 10;
          const segmentTime = timeValue % pingpongDuration;
          const isForward = Math.floor(timeValue / pingpongDuration) % 2 === 0;
          const u = segmentTime / pingpongDuration;
          const smooth = u * u * (3 - 2 * u);
          const pingpongTime = isForward ? smooth * pingpongDuration : (1 - smooth) * pingpongDuration;
          program.uniforms.uDirection.value = 1.0;
          program.uniforms.iTime.value = pingpongTime;
        } else {
          program.uniforms.iTime.value = timeValue;
        }
        renderer.render({ scene: mesh });
        if (isRendering) {
          raf = requestAnimationFrame(render);
        }
      };

      const startLoop = () => {
        if (!isRendering) {
          isRendering = true;
          raf = requestAnimationFrame(render);
        }
      };

      const stopLoop = () => {
        isRendering = false;
        cancelAnimationFrame(raf);
      };

      let observer = null;
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              startLoop();
            } else {
              stopLoop();
            }
          });
        });
        observer.observe(container);
      } else {
        startLoop();
      }

      // Cleanup
      container._plasmaCleanup = () => {
        stopLoop();
        observer?.disconnect();
        ro.disconnect();
        if (config.mouseInteractive) {
          interactionTarget.removeEventListener('mousemove', handleMouseMove);
        }
        try {
          container.removeChild(canvas);
        } catch {
          console.warn('Canvas already removed from container');
        }
      };

      console.log('Plasma effect initialized successfully with local OGL');
      
    } catch (error) {
      console.error('Error initializing plasma effect:', error);
    }
  };
  
  // Initialize immediately since OGL is loaded locally
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlasmaWebGL);
  } else {
    initPlasmaWebGL();
  }
};

const initPlasma = () => {
  console.log('Initializing plasma effect');
  console.log('Container element:', document.getElementById('aboutAurora'));
  console.log('OGL available:', typeof window.OGL !== 'undefined');
  
  createPlasmaEffect();
};

/* -------------------- Portfolio Modal -------------------- */
const projectData = {
  1: {
    title: "DataCloudix",
    description: "DataCloudix is a great upcoming telecommunications company. Their platform is designed to help businesses make sense of their metrics. By aggregating data from multiple sources into a single, intuitive dashboard, it allows users to identify trends, track performance, and make data-driven decisions with confidence. The interface focuses on clarity and speed, ensuring that complex datasets are rendered instantly without lag."
  },
  2: {
    title: "Aden Motors",
    description: "A sleek, high-performance website for a leading automotive service provider. This project involved creating a digital presence that reflects the reliability and professionalism of Aden Motors. Key features include an easy-to-use service booking system, a dynamic gallery of past work, and a fully responsive design that looks great on mobile devices for customers on the go."
  },
  3: {
    title: "Purposeful Living International",
    description: "Purposeful Living International is an organization dedicated to inspiring and transforming lives. The website serves as a hub for connection, offering resources for individuals to find healing, growth, and authentic community. It features event registration and access to empowerment coaching, reflecting the organization's mission to bring people out of isolation."
  },
  4: {
    title: "Whispa.quest",
    description: "An immersive interactive quest experience built with WebGL. Whispa.quest pushes the boundaries of web interactivity, offering users a gamified journey through a mysterious digital landscape. The project utilizes advanced 3D rendering techniques and spatial audio to create a truly unique atmosphere that engages users far beyond a traditional static website."
  },
  5: {
    title: "Imperial Brake & Clutch",
    description: "A robust digital presence for an automotive parts specialist. This catalog-style website allows customers to easily browse a vast inventory of brake and clutch components. The focus was on searchability and organization, ensuring that users can find the exact part they need quickly. The design is industrial yet modern, aligning perfectly with the brand's identity."
  }
};

const initPortfolioModal = () => {
  const modal = document.getElementById('projectModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeBtn = document.querySelector('.modal-close');
  const detailsBtns = document.querySelectorAll('.js-details-btn');

  if (!modal) return;

  const openModal = (projectId) => {
    const data = projectData[projectId];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalBody.textContent = data.description;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  detailsBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.project-card');
      const id = card.dataset.id;
      openModal(id);
    });
  });

  closeBtn.addEventListener('click', closeModal);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
};

/* -------------------- Silk Button Effect -------------------- */
const initSilkButtons = () => {
  const buttons = document.querySelectorAll('.btn--primary');
  if (buttons.length === 0 || !window.OGL) return;

  const { Renderer, Program, Mesh, Triangle } = window.OGL;

  const vertex = `#version 300 es
    in vec2 position;
    in vec2 uv;
    out vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragment = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 fragColor;

    uniform float uTime;
    uniform vec3  uColor;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uRotation;
    uniform float uNoiseIntensity;

    const float e = 2.71828182845904523536;

    float noise(vec2 texCoord) {
      float G = e;
      vec2  r = (G * sin(G * texCoord));
      return fract(r.x * r.y * (1.0 + texCoord.x));
    }

    vec2 rotateUvs(vec2 uv, float angle) {
      float c = cos(angle);
      float s = sin(angle);
      mat2  rot = mat2(c, -s, s, c);
      return rot * uv;
    }

    void main() {
      float rnd        = noise(gl_FragCoord.xy);
      vec2  uv         = rotateUvs(vUv * uScale, uRotation);
      vec2  tex        = uv * uScale;
      float tOffset    = uSpeed * uTime;

      tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

      float pattern = 0.6 +
                      0.4 * sin(5.0 * (tex.x + tex.y +
                                       cos(3.0 * tex.x + 5.0 * tex.y) +
                                       0.02 * tOffset) +
                               sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

      // Match prompt logic: vec4(uColor, 1.0) * vec4(pattern) - noise
      // This effectively modulates RGB by pattern and subtracts noise
      vec3 col = uColor * pattern - rnd / 15.0 * uNoiseIntensity;
      fragColor = vec4(col, 1.0);
    }
  `;

  const hexToRgb = (hex) => {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    ];
  };

  buttons.forEach(btn => {
    // Create container for canvas
    const container = document.createElement('div');
    container.className = 'silk-canvas-container';
    btn.insertBefore(container, btn.firstChild);

    const renderer = new Renderer({
      alpha: true,
      dpr: 1 // Keep DPR low for performance on small buttons
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Float32Array(hexToRgb('#7B7481')) },
        uSpeed: { value: 0.5 }, // Adjusted to match prompt's effective speed (0.1 * 5)
        uScale: { value: 1.0 },
        uRotation: { value: 0 },
        uNoiseIntensity: { value: 1.5 }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    let animationId;
    let isRendering = false;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        renderer.setSize(rect.width, rect.height);
      }
    });
    resizeObserver.observe(container);

    const render = (t) => {
      if (!isRendering) return;
      
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      animationId = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (!isRendering) {
        isRendering = true;
        animationId = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      isRendering = false;
      cancelAnimationFrame(animationId);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startLoop();
        } else {
          stopLoop();
        }
      });
    });
    observer.observe(btn);

    // Cleanup if button is removed (basic handling)
    btn._silkCleanup = () => {
      stopLoop();
      observer.disconnect();
      resizeObserver.disconnect();
      if (container.parentNode) container.parentNode.removeChild(container);
    };
  });
};

/* -------------------- Initialize -------------------- */
const init = () => {
  console.log('GSAP availability check:', typeof gsap);
  console.log('GSAP object:', gsap);
  
  if (typeof gsap === 'undefined') {
    console.warn('GSAP is not loaded! Carousel animations will not work.');
  }
  
  initSiteOverlay();
  initOverlayFlickerGrid();
  initMobileMenu();
  initCardSwap();
  initScrollReveal();
  initBackToTop();
  initSmoothScroll();
  initLenis();
  initPlasma();
  initPortfolioModal();
  initSilkButtons();
  
  console.log('Red Button Studios - Portfolio initialized successfully');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
