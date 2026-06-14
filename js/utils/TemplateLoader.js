// Template loader with caching

const templateCache = {};

export async function loadTemplate(name) {
  if (templateCache[name]) {
    return templateCache[name].cloneNode(true);
  }

  // Resolve relative to the current page so it works under any hosting path
  // (local server, GitHub Pages project site, etc.)
  const templatePath = new URL(`templates/${name}.html`, document.baseURI).href;

  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const container = document.createElement('div');
    container.innerHTML = html;
    // First real element (skip any leading style/script nodes)
    let template = container.firstElementChild;
    while (template && (template.tagName === 'STYLE' || template.tagName === 'SCRIPT')) {
      template = template.nextElementSibling;
    }

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
