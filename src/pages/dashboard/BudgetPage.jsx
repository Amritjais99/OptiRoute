import React from 'react';
import { apiCall, API_BASE } from '../../utils/auth';


export default function BudgetPage() {
  const [cards, setCards] = React.useState([]);
  React.useEffect(() => {
    apiCall(`${API_BASE}/api/v1/budgets`).then(res => res.json()).then(setCards).catch(console.error);
  }, []);
  return (
    <div className="flex flex-col pt-4 pb-10 w-full max-w-[1280px] mx-auto gap-8 px-4 md:px-0">
      
      {/* Header Area */}
      <div>
        <h1 className="font-radio-canada text-[24px] md:text-[28px] font-bold text-white mb-4">Budgets</h1>
        <div className="flex flex-wrap gap-3">
          <span className="bg-[#788FA8] text-white font-radio-canada font-bold text-[13px] md:text-[14px] px-4 py-2 rounded-[8px]">
            Total Spend: <span className="font-geist-mono">$2,000</span> / <span className="font-geist-mono text-white/70">$4,000 (50% utilized)</span>
          </span>
          <span className="bg-[#788FA8] text-white font-radio-canada font-bold text-[13px] md:text-[14px] px-4 py-2 rounded-[8px]">
            Active Budgets: <span className="font-geist-mono">2</span>
          </span>
          <span className="bg-[#788FA8] text-white font-radio-canada font-bold text-[13px] md:text-[14px] px-4 py-2 rounded-[8px]">
            Avg. Utilization: <span className="font-geist-mono">50%</span>
          </span>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
        {cards.map((card, index) => (
          <div key={index + 1} className="bg-[#788FA8] rounded-[16px] p-5 md:p-6 flex flex-col shadow-sm">
            
            {/* Card Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#5F7A94] rounded flex flex-shrink-0 items-center justify-center text-white font-geist-mono font-bold text-[11px] mt-0.5">{index + 1}</div>
                <div>
                  <h3 className="font-radio-canada font-bold text-white text-[14px] md:text-[16px] leading-tight">{card.workflow_name}</h3>
                  <p className="font-geist-mono text-white/70 text-[10px] mt-1">Last updated: {card.date} UTC</p>
                </div>
              </div>
              <div className="flex gap-2 text-white/70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:text-white"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:text-white"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-[22px] bg-[#5F7A94] rounded-full mb-3 overflow-hidden flex">
              <div className="h-full bg-[#1A1F26] rounded-full flex items-center justify-center" style={{ width: card.utilized + '%' }}>
                <span className="font-geist-mono font-bold text-[10px] text-white">{card.utilized + '%'}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center mb-8 px-1">
              <p className="font-geist-mono text-[10px] md:text-[11px] text-white/80">Spent: <span className="font-bold text-white">{card.spent}</span></p>
              <p className="font-geist-mono text-[10px] md:text-[11px] text-white/80">Total Budget: <span className="font-bold text-white">{card.total}</span></p>
              <p className="font-geist-mono text-[10px] md:text-[11px] text-white/80">Utilized: <span className="font-bold text-white">{card.utilized + '%'}</span></p>
            </div>

            {/* Threshold */}
            <div>
              <p className="font-geist-mono text-white text-[10px] uppercase font-bold tracking-wider mb-3">Notify Threshold (% of Budget)</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-1.5 bg-[#5F7A94] rounded-full relative">
                  <div className="absolute top-0 left-0 h-full bg-[#F59E0B] rounded-full" style={{ width: card.threshold + '%' }}></div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-white rounded-full shadow cursor-pointer" style={{ left: card.threshold + '%' }}></div>
                </div>
                <div className="bg-[#5F7A94] rounded flex items-center px-2 py-1 gap-1 cursor-pointer hover:bg-[#546781] transition-colors">
                  <span className="font-geist-mono text-white font-bold text-[11px]">{card.threshold + '%'}</span>
                  <div className="flex flex-col">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="w-full max-w-[1000px] mx-auto mt-4">
        <div className="bg-[#788FA8] rounded-[20px] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-radio-canada font-bold text-white text-[13px] md:text-[15px]">Graph 1: Budget Spend Trend (Total Budget: $4,000)</h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
          </div>
          <div className="w-full h-[240px] md:h-[280px] relative overflow-hidden">
            <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="w-full h-full">
              {/* Horizontal Grid lines */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <line key={i} x1="50" y1={20 + i*25} x2="780" y2={20 + i*25} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
              ))}
              
              {/* Y-Axis Labels */}
              <text x="40" y="24" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$4,000</text>
              <text x="40" y="49" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$3,500</text>
              <text x="40" y="74" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$3,000</text>
              <text x="40" y="99" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$2,500</text>
              <text x="40" y="124" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$2,000</text>
              <text x="40" y="149" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$1,500</text>
              <text x="40" y="174" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$1,000</text>
              <text x="40" y="199" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$500</text>
              <text x="40" y="224" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="end">$0</text>
            
              {/* X-Axis Labels */}
              <text x="80" y="235" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Jan 15</text>
              <text x="250" y="235" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Feb 15</text>
              <text x="420" y="235" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Mar 15</text>
              <text x="590" y="235" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Apr 15</text>
              <text x="760" y="235" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">May 15</text>
              
              {/* Grey baseline curve */}
              <path d="M80,224 Q250,180 420,149 T760,124" fill="none" stroke="#9CA3AF" strokeWidth="2.5" />
              
              {/* Colored Area and Line */}
              <defs>
                <linearGradient id="orange-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Blue curve part */}
              <path d="M350,140 Q385,64 420,64 T590,149 T760,124" fill="none" stroke="#60A5FA" strokeWidth="2.5" />
              
              {/* Orange curve part */}
              <path d="M80,199 Q122,99 165,99 T250,164 T350,140" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
              
              {/* Orange Area */}
              <path d="M80,199 Q122,99 165,99 T250,164 T350,140 L350,224 L80,224 Z" fill="url(#orange-area)" />
              
              {/* Right dot and value */}
              <circle cx="760" cy="124" r="5" fill="#ffffff" stroke="#60A5FA" strokeWidth="3" />
              <text x="760" y="109" fill="#ffffff" fontSize="10" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">$2,000</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Alert Threshold Configuration */}
      <div className="w-full max-w-[700px] mx-auto mt-2 mb-10">
        <div className="bg-[#788FA8] rounded-[20px] p-6 md:p-8 shadow-sm">
          <h3 className="font-radio-canada font-bold text-white text-[18px] md:text-[20px] mb-1">Alert Threshold Configuration</h3>
          <p className="font-source-serif text-white/80 text-[14px] md:text-[15px] mb-10">Configure global budget notification settings.</p>
          
          <p className="font-geist-mono text-white text-[11px] uppercase font-bold tracking-wider mb-5">Set Global Notify Threshold (% of Budget)</p>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-10">
            <div className="w-full md:flex-1 h-2 bg-[#5F7A94] rounded-full relative">
              <div className="absolute top-0 left-0 h-full bg-[#F59E0B] rounded-full w-[80%]"></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow cursor-pointer" style={{ left: '80%', marginLeft: '-10px' }}></div>
            </div>
            <div className="bg-[#5F7A94] rounded flex items-center px-3 py-1.5 gap-2 cursor-pointer hover:bg-[#546781] transition-colors self-end md:self-auto">
              <span className="font-geist-mono text-white font-bold text-[13px]">80%</span>
              <div className="flex flex-col">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
            <div className="flex gap-3">
              {/* Mail */}
              <div className="w-9 h-9 bg-[#5F7A94] rounded flex items-center justify-center cursor-pointer hover:bg-[#546781] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              {/* Slack */}
              <div className="w-9 h-9 bg-[#5F7A94] rounded flex items-center justify-center cursor-pointer hover:bg-[#546781] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" xmlns="http://www.w3.org/2000/svg"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.835zM17.688 8.835a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313zM15.165 18.958a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.52v-2.522h2.52zM15.165 17.687a2.527 2.527 0 0 1-2.52-2.522 2.528 2.528 0 0 1 2.52-2.521h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.522h-6.313z"/></svg>
              </div>
              {/* Webhook */}
              <div className="w-9 h-9 bg-[#5F7A94] rounded flex items-center justify-center cursor-pointer hover:bg-[#546781] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </div>
              {/* PD */}
              <div className="w-9 h-9 bg-[#5F7A94] rounded flex items-center justify-center font-bold text-white text-[13px] font-radio-canada cursor-pointer hover:bg-[#546781] transition-colors">
                PD
              </div>
              {/* More */}
              <div className="w-9 h-9 bg-[#5F7A94] rounded flex items-center justify-center text-white cursor-pointer hover:bg-[#546781] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle></svg>
              </div>
            </div>
            
            <button className="w-full md:w-auto bg-[#1A1F26] text-white font-radio-canada font-bold text-[14px] md:text-[15px] px-8 py-2.5 rounded-[8px] hover:bg-black transition-colors">
              Test Alert
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}



