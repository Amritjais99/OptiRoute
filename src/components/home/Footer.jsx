import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'Features', href: '#' },
  { label: 'API Reference', href: '#' },
  { label: 'Architecture', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'System Status', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-accent-yellow py-5">
      <div className="container-site flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-geist-mono text-label text-olive-label hover:text-cta-olive-dark transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="font-geist-mono text-label text-olive-label">
          © 2026 · All rights reserved
        </p>
      </div>
    </footer>
  );
}
