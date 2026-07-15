"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, LabelList
} from 'recharts';
import { FaGlobe, FaShieldAlt, FaChartLine } from 'react-icons/fa';

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#fbbf24'];

export default function AnalyticsPage() {
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  const [totalBlocked, setTotalBlocked] = useState(8492104);
  const [tick, setTick] = useState(0);

  // Initialize and simulate live data
  useEffect(() => {
    // Initial Time Series (last 10 minutes) - Smoother curve
    const initialTimeData = Array.from({ length: 10 }, (_, i) => {
      const base = 450 + Math.sin(i) * 100;
      return {
        time: `-${10 - i}m`,
        attacks: Math.floor(base + (Math.random() * 50)),
      };
    });
    setTimeSeriesData(initialTimeData);

    // Initial Geo Data (More realistic APT origins)
    setGeoData([
      { name: 'Russian Federation', value: 12450 },
      { name: 'PRC (China)', value: 9820 },
      { name: 'United States', value: 7100 },
      { name: 'Islamic Rep. of Iran', value: 4300 },
      { name: 'DPRK (North Korea)', value: 3100 },
    ]);

    // Initial Sector Data (Industry standard names)
    setSectorData([
      { name: 'Financial Services', value: 42 },
      { name: 'Healthcare & Pharma', value: 28 },
      { name: 'Information Tech', value: 15 },
      { name: 'Gov & Defense', value: 10 },
      { name: 'Critical Infra.', value: 5 },
    ]);

    // Live update interval
    const interval = setInterval(() => {
      setTick(t => t + 1);
      
      // Update Time Series - Smooth rolling trend using sine wave + noise
      setTimeSeriesData(prev => {
        const newData = [...prev.slice(1)];
        // Use time to create a breathing wave pattern
        const currentTick = Date.now() / 10000;
        const baseTrend = 450 + Math.sin(currentTick) * 150;
        const noise = (Math.random() - 0.5) * 60;
        
        newData.push({
          time: 'Now',
          attacks: Math.max(100, Math.floor(baseTrend + noise)),
        });
        return newData;
      });

      // Fluctuate Total Blocked more realistically
      setTotalBlocked(prev => prev + Math.floor(Math.random() * 25) + 3);

      // Slightly fluctuate Geo Data
      setGeoData(prev => prev.map(item => ({
        ...item,
        value: item.value + Math.floor(Math.random() * 12)
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.main 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={{ minHeight: '80vh', padding: '120px 20px 60px', background: 'transparent', maxWidth: '1200px', margin: '0 auto', position: 'relative', boxSizing: 'border-box', width: '100%' }}
    >
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        {/* Simulation Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#fcd34d', fontSize: '0.8rem', fontWeight: 600, backdropFilter: 'blur(10px)', marginBottom: '25px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b', animation: 'pulse 2s infinite' }}></div>
          SIMULATION MODE
        </div>
        <br/>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 100%)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 8px 32px rgba(59,130,246,0.2)', marginBottom: '20px', backdropFilter: 'blur(10px)' }}>
          <FaGlobe style={{ fontSize: '2.5rem', color: '#60a5fa' }} aria-hidden="true" />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
          Global Threat Intelligence
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Live visualization of active phishing campaigns and global cyberattack vectors.
        </p>
      </header>

      {/* Top Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(15, 20, 40, 0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '30px', textAlign: 'center', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '15px' }}>
            <FaShieldAlt style={{ fontSize: '1.8rem', color: '#34d399' }} />
          </div>
          <h3 style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '10px' }}>Total Threats Blocked</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f8fafc', textShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
            {totalBlocked.toLocaleString()}
          </div>
        </div>
        
        <div style={{ background: 'rgba(15, 20, 40, 0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '30px', textAlign: 'center', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0.05) 100%)', border: '1px solid rgba(236,72,153,0.3)', marginBottom: '15px' }}>
            <FaChartLine style={{ fontSize: '1.8rem', color: '#f472b6' }} />
          </div>
          <h3 style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '10px' }}>Current Defcon Level</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f8fafc', textShadow: '0 0 20px rgba(236, 72, 153, 0.3)' }}>
            ELEVATED
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '30px' }}>
        
        {/* Line Chart */}
        <div style={{ background: 'rgba(15, 20, 40, 0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 30px rgba(0,0,0,0.2)', minWidth: 0 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>Live Attack Volume (Global)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <LineChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(15,20,40,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '8px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#f472b6' }}
                />
                <Line type="monotone" dataKey="attacks" stroke="url(#colorAttacks)" strokeWidth={4} dot={{ r: 5, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#fff', style: { filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.8))' } }} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div style={{ background: 'rgba(15, 20, 40, 0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 30px rgba(0,0,0,0.2)', minWidth: 0 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>Targeted Sectors (Last 24h)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <PieChart>
                <defs>
                  {sectorData.map((entry, index) => (
                    <linearGradient key={`grad-pie-${index}`} id={`colorPie${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1}/>
                      <stop offset="100%" stopColor={COLORS[(index + 1) % COLORS.length]} stopOpacity={0.7}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={2}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorPie${index})`} style={{ filter: `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]}40)` }} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'rgba(15,20,40,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
            {sectorData.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})` }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{ background: 'rgba(15, 20, 40, 0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 30px rgba(0,0,0,0.2)', minWidth: 0, gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>Top Threat Origins</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={geoData} layout="vertical" margin={{ top: 5, right: 50, left: 0, bottom: 5 }}>
                <defs>
                  {geoData.map((entry, index) => (
                    <linearGradient key={`grad-bar-${index}`} id={`colorBar${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={COLORS[(index + 1) % COLORS.length]} stopOpacity={1}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#f8fafc" fontSize={12} fontWeight={500} width={120} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: 'rgba(15,20,40,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={1000}>
                  {geoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorBar${index})`} style={{ filter: `drop-shadow(0 0 6px ${COLORS[(index + 1) % COLORS.length]}50)` }} />
                  ))}
                  <LabelList dataKey="value" position="right" fill="#94a3b8" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </motion.main>
  );
}
