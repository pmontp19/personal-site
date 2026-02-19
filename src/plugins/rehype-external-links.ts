import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

export default function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return;
      
      const href = node.properties?.href;
      if (typeof href !== 'string') return;
      
      // Skip anchors, mailto, and tel links
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      
      try {
        const url = new URL(href, 'https://peremontpeo.dev');
        const isExternal = url.hostname !== 'peremontpeo.dev' && !url.hostname.endsWith('.peremontpeo.dev');
        
        if (isExternal) {
          node.properties = node.properties || {};
          node.properties.target = '_blank';
          node.properties.rel = 'noopener noreferrer';
          
          const existingClasses = node.properties.className;
          node.properties.className = Array.isArray(existingClasses) 
            ? [...existingClasses, 'external-link'] 
            : 'external-link';
          
          node.children.push({
            type: 'element',
            tagName: 'span',
            properties: { className: ['external-link-icon-wrapper'] },
            children: [{
              type: 'element',
              tagName: 'svg',
              properties: {
                xmlns: 'http://www.w3.org/2000/svg',
                width: '1em',
                height: '1em',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                strokeLinecap: 'round' as const,
                strokeLinejoin: 'round' as const,
                className: ['external-link-icon'],
                'aria-hidden': 'true'
              },
              children: [
                { type: 'element', tagName: 'path', properties: { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }, children: [] },
                { type: 'element', tagName: 'polyline', properties: { points: '15 3 21 3 21 9' }, children: [] },
                { type: 'element', tagName: 'line', properties: { x1: '10', y1: '14', x2: '21', y2: '3' }, children: [] }
              ]
            }]
          });
        }
      } catch {
        // Invalid URL, skip
      }
    });
  };
}
