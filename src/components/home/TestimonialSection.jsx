import React, { useEffect, useState } from 'react';
import portrait from '../../assets/testimonial-portrait.png';
import amritPortrait from '../../assets/amrit-team-portrait.png';
import aryanPortrait from '../../assets/aryan-team-portrait.png';

const members = [
  { name: 'Amrit Jaiswal', role: 'AI Engineer · Project Manager & Deployment Lead', portrait: amritPortrait },
  { name: 'Aryan Babu', role: 'AI Engineer · Tester', portrait: aryanPortrait },
  { name: 'Sourav', role: 'Lead AI Engineer · Designer', portrait },
];

const TestimonialSection = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const interacting = hovered || focused;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || interacting || reducedMotion) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % members.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, interacting, reducedMotion]);

  const move = direction => setActive(index => (index + direction + members.length) % members.length);

  return (
    <section
      id="team"
      aria-label="The OptiRoute team"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      className="w-full max-w-[1280px] mx-auto py-[60px] md:py-[120px] px-5 flex flex-col lg:flex-row items-center justify-center gap-[32px] lg:gap-[40px]"
    >
      <div className="relative w-full max-w-[451px] lg:w-[38%] shrink-0 aspect-[896/1200] overflow-hidden rounded bg-[#A8D3FF]">
        {members.map((member, index) => (
          <img
            key={member.name}
            src={member.portrait}
            alt={index === active ? `${member.name}, ${member.role}` : ''}
            aria-hidden={index !== active}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none ${index === active ? 'translate-x-0 opacity-100' : index < active ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}
          />
        ))}
      </div>
      
      <div className="min-w-0 flex-1 flex flex-col gap-[32px] lg:gap-[56px] w-full lg:max-w-[700px] lg:px-6">
        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.81818 0V4.36364C7.05455 5.52727 5.52727 7.70909 5.23636 10.9091H9.81818V20H0V10.9091C0 4.8 3.27273 1.16364 9.81818 0ZM24 0V4.36364C21.2364 5.52727 19.7091 7.70909 19.4182 10.9091H24V20H14.1818V10.9091C14.1818 4.8 17.4545 1.16364 24 0Z" fill="#DBE0EC"/>
        </svg>

        <p className="font-radio-canada font-medium text-[20px] md:text-[24px] leading-[1em] tracking-[-0.03em] text-[#000000]">
          "Integrating OptiRoute into our AI stack took less than 10 minutes. It completely eliminated our user-facing API timeouts and instantly reduced our OpenAI bill through semantic caching"
        </p>

        <div className="flex flex-col gap-5">
          <div className="relative min-h-[88px] md:min-h-[92px] overflow-hidden" aria-live={paused || interacting ? 'polite' : 'off'} aria-atomic="true">
            {members.map((member, index) => (
              <div key={member.name} aria-hidden={index !== active} className={`absolute inset-x-0 top-0 transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none ${index === active ? 'translate-x-0 opacity-100' : index < active ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}>
                <h4 className="font-radio-canada font-medium text-[20px] text-[#000000]">{member.name}</h4>
                <p className="font-source-serif font-normal text-[16px] md:text-[20px] leading-snug text-[#6C6C6C]">{member.role}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4" role="group" aria-label="Team slideshow controls">
            <button type="button" onClick={() => move(-1)} aria-label="Previous team member" className="team-carousel-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div className="flex items-center gap-1">
              {members.map((member, index) => (
                <button key={member.name} type="button" onClick={() => setActive(index)} aria-label={`Show ${member.name}`} aria-pressed={index === active} className="group flex h-10 w-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0568D0]">
                  <span className={`h-2 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${index === active ? 'w-6 bg-[#0568D0]' : 'w-2 bg-[#C6D5E5] group-hover:bg-[#7896B6]'}`} />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => move(1)} aria-label="Next team member" className="team-carousel-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play team slideshow' : 'Pause team slideshow'} aria-pressed={paused} className="team-carousel-arrow ml-1">
              {paused ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6v12M15 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
            </button>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
