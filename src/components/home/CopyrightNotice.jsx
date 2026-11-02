import { Link } from 'react-router-dom';

export default function CopyrightNotice() {
  const currentYear = new Date().getFullYear();
  const years = currentYear > 2026 ? `2026–${currentYear}` : '2026';

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-end gap-x-5 gap-y-2 font-source-serif text-[14px] md:text-[16px] text-[#66640F] text-center">
      <p>© {years} OptiRoute contributors. All rights reserved.</p>
      <Link to="/contact" className="underline underline-offset-4 hover:text-[#423F08] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Contact</Link>
      <Link to="/privacy" className="underline underline-offset-4 hover:text-[#423F08] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Privacy policy</Link>
      <Link to="/terms" className="underline underline-offset-4 hover:text-[#423F08] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Terms of use</Link>
      <Link to="/copyright" className="underline underline-offset-4 hover:text-[#423F08] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Copyright &amp; credits</Link>
    </div>
  );
}
