'use client';

import React from 'react';
import FriendsBadge from '@/components/FriendsBadge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const milestones = [
  { level: 1, name: 'The Buddy', desc: 'Add your first friend to the platform.' },
  { level: 5, name: 'The Squad', desc: 'Assemble a small team of 5 friends.' },
  { level: 15, name: 'The Crew', desc: 'Build a solid connection with 15 friends.' },
  { level: 30, name: 'The Tactician', desc: 'A recognized leader with 30 allies.' },
  { level: 50, name: 'The Elite', desc: 'Join the top social tier with 50 friends.' },
  { level: 100, name: 'The Legion', desc: 'God-tier status: 100+ members in your circle.' },
] as const;

export default function AchievementsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0D121B]">
      <Header />
      
      <main className="flex-1 container py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black uppercase tracking-tight text-white mb-4 font-barlow-condensed">
            Social <span className="text-[#e8000d]">Milestones</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Grow your network on Gamerhead and unlock exclusive, high-tier status badges. 
            Each milestone represents your influence and connectivity within the legion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {milestones.map((m) => (
            <div 
              key={m.level}
              className="bg-[#111114] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-[#e8000d]/40 transition-all group"
            >
              <div className="mb-6 transform transition-transform group-hover:scale-110 duration-300">
                <FriendsBadge level={m.level} size={140} />
              </div>
              
              <h3 className="text-2xl font-bold uppercase text-white mb-2 font-barlow-condensed tracking-wide">
                {m.name}
              </h3>
              
              <div className="text-[#e8000d] font-black text-sm uppercase tracking-widest mb-4">
                {m.level} Friends Milestone
              </div>
              
              <p className="text-gray-500 text-sm leading-relaxed">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
