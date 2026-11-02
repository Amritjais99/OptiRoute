import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const email = 'amritjais6129@cic.du.ac.in';
const linkStyle = 'text-[#174D83] underline underline-offset-4 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4';
const pages = [['/contact', 'Contact'], ['/privacy', 'Privacy policy'], ['/terms', 'Terms of use'], ['/copyright', 'Copyright & credits']];

function SupportLayout({ title, children, dated = true }) {
  const heading = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    const previousTitle = document.title;
    document.title = `${title} | OptiRoute`;
    return () => { document.title = previousTitle; };
  }, [title]);

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(180deg, #A8D3FF 0%, #FFF4DF 40%, #FFF4DF 100%)' }}>
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20 font-source-serif text-[#365574] leading-relaxed">
        <p className="mb-4 font-geist-mono text-sm uppercase tracking-widest text-[#174D83]">OptiRoute</p>
        <h1 ref={heading} tabIndex={-1} className="mb-4 font-radio-canada text-4xl md:text-5xl font-medium tracking-tight text-black outline-none">{title}</h1>
        {dated && <p className="mb-8 text-sm">Last updated: 2 November 2026</p>}
        <div className="space-y-8">{children}</div>
        <nav aria-label="Support and policies" className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#365574]/25 pt-6 text-sm">
          <Link className={linkStyle} to="/">Home</Link>
          {pages.map(([to, label]) => <Link key={to} className={linkStyle} to={to}>{label}</Link>)}
        </nav>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return <section><h2 className="mb-3 font-radio-canada text-2xl font-medium text-black">{title}</h2><div className="space-y-3">{children}</div></section>;
}

export function ContactPage() {
  return (
    <SupportLayout title="Contact" dated={false}>
      <p>Have a question, found a bug, or need help with your data? Contact the OptiRoute project team.</p>
      <Section title="Get in touch">
        <p>Amrit Jaiswal · Project Manager & Deployment Lead</p>
        <a className={`${linkStyle} inline-block break-all text-lg`} href={`mailto:${email}`}>{email}</a>
        <p className="text-sm">This opens your email app. You can also copy the address into your preferred email service.</p>
      </Section>
      <Section title="What to include">
        <p>For a bug report, describe what happened, the page you were using, and the approximate time. Redact personal information from screenshots. Never send passwords, API keys, authentication tokens, or private conversations.</p>
        <p>For an account or data request, email from the address associated with your account and describe what you want accessed, corrected, or deleted. We may need to verify that the account belongs to you.</p>
      </Section>
      <p>OptiRoute is a student project maintained by its team. Responses depend on team availability; there is no guaranteed support response time.</p>
    </SupportLayout>
  );
}

export function PrivacyPage() {
  return (
    <SupportLayout title="Privacy policy">
      <p>This notice explains how the OptiRoute project team handles information when you use this website and its AI routing features.</p>
      <Section title="Information we handle">
        <p><strong>Account information:</strong> your name, email address, and Firebase user identifier. Firebase Authentication handles email/password and Google sign-in; OptiRoute’s application database does not store your account password.</p>
        <p><strong>AI activity:</strong> submitted prompts, relevant conversation context, model responses, saved chat history, semantic cache data, and usage records such as model selection, timestamps, latency, token counts, and estimated costs.</p>
        <p><strong>Model connections:</strong> provider and model choices, routing settings, and API keys you choose to save. Saved provider keys are encrypted by the backend and decrypted when needed to contact the provider. They are not end-to-end encrypted from the service operator.</p>
        <p><strong>Technical and support information:</strong> hosting providers may process IP addresses, request metadata, and diagnostic logs. If you email us, we receive your address and the content you send.</p>
      </Section>
      <Section title="Why we use it">
        <p>We use this information to authenticate users, route AI requests, save conversations and model settings, reuse relevant cached answers within a user’s account, display usage statistics, troubleshoot failures, and respond to support or privacy requests. Do not submit sensitive personal information or information you lack permission to share.</p>
      </Section>
      <Section title="Services involved">
        <p>Firebase provides authentication, Vercel hosts the frontend, Render runs the backend, and Turso stores application data. These services may process data outside your country.</p>
        <p>The website also loads fonts from Google Fonts and jsDelivr. Your browser sends technical request information, such as your IP address, to those services when fetching fonts.</p>
        <p>When a request needs a model, OptiRoute sends the prompt and relevant context to the AI provider used by your routing configuration. Provider authentication uses the applicable API key. Providers have their own retention and data-use policies; OptiRoute does not promise zero retention by every provider.</p>
        <p>See <a className={linkStyle} href="https://firebase.google.com/support/privacy">Firebase’s privacy information</a> and your connected provider’s policy, such as <a className={linkStyle} href="https://console.groq.com/docs/your-data">Groq’s data-handling information</a>, before submitting content.</p>
      </Section>
      <Section title="Browser storage and security">
        <p>Firebase uses browser storage to maintain your sign-in session. Sign out on shared devices. The application currently includes no advertising tracker or optional analytics SDK. Hosting services still process technical requests and logs.</p>
        <p>We use HTTPS, authenticated access, and encryption for saved provider keys. No system can guarantee absolute security. Prompts and responses are available to the backend for processing and storage.</p>
      </Section>
      <Section title="Retention and your choices">
        <p>There is currently no fixed automatic deletion schedule for account and chat records. Data is retained to support the features above until removed through available controls or a verified request. Chat and semantic-cache deletion controls are available in the app; deleting one item does not necessarily remove all related usage records.</p>
        <p>For account deletion, access, correction, or a broader data-removal request, <Link className={linkStyle} to="/contact">contact the team</Link>. Full account deletion is currently handled manually. Provider-held records and backups may follow separate retention schedules, so immediate deletion of every copy cannot be promised.</p>
      </Section>
      <Section title="Questions and changes">
        <p>Email <a className={`${linkStyle} break-all`} href={`mailto:${email}`}>{email}</a> with privacy questions. We will update the date on this page when our practices change.</p>
      </Section>
    </SupportLayout>
  );
}

export function TermsPage() {
  return (
    <SupportLayout title="Terms of use">
      <p>These terms describe the intended use and limitations of OptiRoute, a student-built AI routing and optimization project.</p>
      <Section title="Accounts and responsible use">
        <p>Keep your account credentials and provider API keys secure. Only submit content and connect provider accounts that you have permission to use. Do not use OptiRoute for unlawful activity, access another user’s data, bypass access controls or provider limits, distribute malware, or disrupt the service.</p>
      </Section>
      <Section title="AI responses and project limitations">
        <p>AI output can be inaccurate, incomplete, or misleading. Check important answers independently. Routing, caching, and fallback features do not guarantee correct answers or uninterrupted requests. OptiRoute is not a substitute for qualified medical, legal, financial, or other professional advice.</p>
        <p>The project is provided as available for learning and demonstration. Features may change, and free hosting can cause cold starts, quota limits, delays, or outages. There is no service-level or uptime guarantee. Keep your own copy of important information.</p>
      </Section>
      <Section title="Provider accounts and costs">
        <p>OptiRoute currently charges no platform subscription fee. A connected AI provider may charge for requests under its own pricing and terms, including connection checks and requests made while routing or retrying. You are responsible for your provider account, usage limits, and charges. Dashboard cost estimates are informational and may differ from your provider’s bill.</p>
      </Section>
      <Section title="Your content and our project">
        <p>You retain whatever rights you hold in content you submit. Submitting it allows the service to process, store, and send it to the relevant providers as needed for the features described in our <Link className={linkStyle} to="/privacy">privacy policy</Link>. AI output is subject to applicable law and the relevant provider’s terms; exclusive ownership or freedom from third-party claims is not guaranteed.</p>
        <p>The team’s original code, design, and documentation remain subject to the <Link className={linkStyle} to="/copyright">copyright and credits notice</Link>. Third-party components retain their own licenses.</p>
      </Section>
      <Section title="Service changes and contact">
        <p>The team may restrict access to address abuse or security concerns and may change or discontinue this student service. Nothing on this page excludes rights or responsibilities that cannot lawfully be excluded.</p>
        <p>For questions, support, or account requests, <Link className={linkStyle} to="/contact">contact the project team</Link>. Updates will be dated on this page.</p>
      </Section>
    </SupportLayout>
  );
}
