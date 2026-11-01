import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function CopyrightPage() {
  const heading = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-32 pb-20 font-source-serif text-[#365574] leading-relaxed">
      <p className="mb-4 font-geist-mono text-sm uppercase tracking-widest text-[#0568D0]">OptiRoute</p>
      <h1 ref={heading} tabIndex={-1} className="mb-8 font-radio-canada text-4xl md:text-5xl font-medium tracking-tight text-black outline-none">Copyright &amp; credits</h1>
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 font-radio-canada text-2xl font-medium text-black">Our original work</h2>
          <p>© 2026 OptiRoute contributors. All rights reserved in their original copyrightable contributions. Each contributor retains the rights they hold in their own work.</p>
          <p className="mt-3">The original project code, documentation, and design are not released under a public open-source license. For reuse or redistribution beyond what applicable law allows, contact the project team for permission. This notice does not prevent ordinary use of the hosted application.</p>
        </section>
        <section>
          <h2 className="mb-3 font-radio-canada text-2xl font-medium text-black">Built with open-source software</h2>
          <p>OptiRoute uses third-party software including React, React Router, Firebase, Recharts, and KaTeX. These components belong to their respective rights holders and remain available under their own licenses. Our rights notice does not replace or restrict those licenses.</p>
          <a href="/third-party-notices.txt" className="mt-4 inline-block font-radio-canada font-medium text-[#0568D0] underline underline-offset-4">Read the third-party license texts and notices</a>
        </section>
        <section>
          <h2 className="mb-3 font-radio-canada text-2xl font-medium text-black">Typography &amp; imagery</h2>
          <p>The interface uses Radio Canada Big, Source Serif Pro, and Geist Mono. Their upstream font notices are included in the third-party notices.</p>
          <p className="mt-3">The original site design and imagery were supplied by the OptiRoute team. The Amrit Jaiswal and Aryan Babu team portraits were styled with AI image editing from team-supplied photographs. Rights in AI-assisted material are claimed only to the extent actually held under applicable law. Third-party and user-provided material retain their own rights.</p>
        </section>
        <section>
          <h2 className="mb-3 font-radio-canada text-2xl font-medium text-black">AI services &amp; names</h2>
          <p>Connected AI providers, model names, and service names identify their respective products. They do not imply sponsorship or endorsement. Provider services and models have their own terms; their use does not transfer ownership to OptiRoute.</p>
        </section>
      </div>
      <Link to="/" className="mt-12 inline-block rounded-full border border-[#C6D5E5] px-6 py-3 font-radio-canada text-black hover:bg-[#EFF7FF]">Back to home</Link>
    </main>
  );
}
