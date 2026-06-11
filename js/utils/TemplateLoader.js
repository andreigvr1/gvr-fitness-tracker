// Template loader with caching

const templateCache = {};

// Determine the base path (works both locally and on GitHub Pages)
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/gvr-fitness-tracker/')) {
    return '/gvr-fitness-tracker';
  }
  return '';
}

export async function loadTemplate(name) {
  if (templateCache[name]) {
    return templateCache[name].cloneNode(true);
  }

  const basePath = getBasePath();
  const templatePath = `${basePath}/templates/${name}.html`;

  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const container = document.createElement('div');
    container.innerHTML = html;
    const template = container.firstElementChild;

    if (!template) {
      throw new Error(`Template ${name} is empty or has no root element`);
    }

    templateCache[name] = template;
    return template.cloneNode(true);
  } catch (error) {
    console.error(`Failed to load template from ${templatePath}:`, error);
    throw error;
  }
}

export function setElementContent(el, content) {
  if (typeof content === 'string') {
    el.textContent = content;
  } else if (el instanceof HTMLElement) {
    el.innerHTML = '';
    el.appendChild(content);
  }
}

