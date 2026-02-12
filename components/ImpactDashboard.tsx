import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Task, TaskCategory } from '../types';

interface ImpactDashboardProps {
  tasks: Task[];
  summary: string;
}

const ImpactDashboard: React.FC<ImpactDashboardProps> = ({ tasks, summary }) => {
  const categoryData = Object.values(TaskCategory).map(cat => ({
    name: cat.split(' ')[0], // Shorten names for mobile charts
    count: tasks.filter(t => t.category === cat).length,
  }));

  const stats = [
    { label: 'Services', value: tasks.length, color: 'text-indigo-700' },
    { label: 'Credits', value: tasks.filter(t => t.status === 'VERIFIED').reduce((acc, t) => acc + t.creditValue, 0), color: 'text-green-700' },
    { label: 'Active Youth', value: new Set(tasks.map(t => t.helperId).filter(Boolean)).size, color: 'text-purple-700' },
    { label: 'Pending', value: tasks.filter(t => t.status === 'OPEN').length, color: 'text-slate-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] mb-2">{stat.label}</p>
            <p className={`text-3xl md:text-4xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 md:p-8 rounded-2xl border-2 border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Services by Type
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} fontWeight={600} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} fontWeight={600} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#4338ca" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border-2 border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="w-2 h-6 bg-purple-600 rounded-full"></span>
            Community Growth
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { date: 'Jan', value: 45 },
                { date: 'Feb', value: 52 },
                { date: 'Mar', value: 89 },
                { date: 'Apr', value: 124 },
                { date: 'May', value: 167 },
              ]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} fontWeight={600} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} fontWeight={600} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={4} dot={{ r: 6, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
            <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-black mb-3 text-indigo-200">Municipal Impact Update</h4>
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-medium italic">
              "{summary}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;