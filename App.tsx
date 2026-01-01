import React, { useState, useEffect } from 'react';
import { ParticleScene } from './components/ParticleScene';
import { WebcamController } from './components/WebcamController';
import { GestureType } from './types';
import { Target, Hand, MousePointer2, Sparkles, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [currentGesture, setCurrentGesture] = useState<GestureType>(GestureType.None);
  const [resetKey, setResetKey] = useState(0);

  const gestureInfo = {
    [GestureType.None]: { title: '空灵模式', desc: '环境粒子律动，处于呼吸状态。', icon: <Sparkles className="w-5 h-5 text-blue-400" /> },
    [GestureType.OpenPalm]: { title: '粒子爆发', desc: '张开手掌，能量向四周扩散。', icon: <Hand className="w-5 h-5 text-cyan-400" /> },
    [GestureType.ClosedFist]: { title: '引力坍缩', desc: '握紧拳头，形成强大的引力核心。', icon: <Target className="w-5 h-5 text-red-500" /> },
    [GestureType.Pointing]: { title: '线性流向', desc: '食指指向，粒子随风快速流动。', icon: <MousePointer2 className="w-5 h-5 text-green-400" /> },
    [GestureType.Victory]: { title: '混沌跳跃', desc: '胜利手势，粒子随音乐疯狂跳动。', icon: <span className="text-xl">✌️</span> },
  };

  const info = gestureInfo[currentGesture] || gestureInfo[GestureType.None];

  // 关键：当手势改变时，自动触发重置
  useEffect(() => {
    if (currentGesture !== GestureType.None) {
      handleReset();
    }
  }, [currentGesture]);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      
      {/* 3D 粒子背景 */}
      <ParticleScene currentGesture={currentGesture} resetKey={resetKey} />

      {/* 顶部标题栏 */}
      <div className="absolute top-0 left-0 p-8 z-20 w-full pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 opacity-90">
          GEMINI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">PARTICLE</span>
        </h1>
        <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-transparent"></div>
      </div>

      {/* 实时状态指示器 */}
      <div className="absolute top-32 left-8 z-20 transition-all duration-700">
        <div className="bg-gray-950/40 backdrop-blur-xl border-l-4 border-blue-500 p-6 rounded-r-2xl max-w-xs shadow-2xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              {info.icon}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {info.title}
            </h2>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            {info.desc}
          </p>
        </div>
      </div>

      {/* 重置按钮 */}
      <div className="absolute bottom-[320px] right-6 z-30">
        <button 
          onClick={handleReset}
          className="group flex items-center gap-2 px-5 py-3 bg-gray-900/60 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-300 shadow-xl active:scale-95"
        >
          <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-xs font-bold tracking-widest uppercase">重置粒子系统</span>
        </button>
      </div>

      {/* 底部操作指南 */}
      <div className="absolute bottom-8 left-8 z-20 hidden md:flex flex-col gap-2">
        <div className="px-3 py-1 bg-white/5 backdrop-blur text-[10px] text-gray-500 rounded uppercase tracking-[0.2em] w-fit mb-2">
          Gesture Manual
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div> 掌：爆发
          </div>
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <div className="w-2 h-2 rounded-full bg-red-500"></div> 拳：引力
          </div>
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-400"></div> 指：流体
          </div>
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div> 耶：跳动
          </div>
        </div>
      </div>

      {/* 右下角摄像头控制 */}
      <WebcamController onGestureChange={setCurrentGesture} />
    </div>
  );
};

export default App;