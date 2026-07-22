import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export default function AndroidFrame({ children }: AndroidFrameProps) {
  // Current local time formatted for status bar
  const formatTime = () => {
    const d = new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minStr}`;
  };

  return (
    <div className="flex justify-center py-6 bg-slate-100/30">
      {/* Device wrapper */}
      <div className="relative mx-auto w-[380px] h-[780px] bg-slate-900 rounded-[50px] shadow-2xl border-[12px] border-slate-950 flex flex-col overflow-hidden ring-1 ring-slate-800">
        
        {/* Speaker & camera notch pinhole */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-950 rounded-full z-30 flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
          <div className="w-12 h-1 bg-slate-900 rounded"></div>
        </div>

        {/* Android Status Bar */}
        <div className="bg-white px-6 pt-6 pb-2 flex justify-between items-center text-[11px] font-extrabold text-slate-800 select-none z-20">
          <span>{formatTime()}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-slate-700" />
          </div>
        </div>

        {/* Interactive screen space */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-none relative">
          {children}
        </div>

        {/* Android system navigation gesture line */}
        <div className="bg-slate-50 py-2.5 flex justify-center items-center z-20 border-t border-slate-100">
          <div className="w-28 h-1 bg-slate-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
