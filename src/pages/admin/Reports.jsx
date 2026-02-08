import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { reportService } from '../../services/reportService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Reports = () => {
    const [tab, setTab] = useState('clients');
    const [clientData, setClientData] = useState([]);
    const [teamData, setTeamData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { (async()=>{ try{const[c,t]=await Promise.all([reportService.getClientReport().catch(()=>({results:[]})),reportService.getTeamPerformance().catch(()=>({results:[]}))]);setClientData(c.results||[]);setTeamData(t.results||[]);}catch{}finally{setLoading(false);} })(); }, []);

    const cChart = clientData.length>0 ? { labels:clientData.map(c=>c.company_name), datasets:[{label:'Recovered',data:clientData.map(c=>c.total_recovered),backgroundColor:'#10B981',borderRadius:6},{label:'Pending',data:clientData.map(c=>c.total_pending),backgroundColor:'#F97316',borderRadius:6}] } : null;
    const tChart = teamData.length>0 ? { labels:teamData.map(t=>t.full_name), datasets:[{label:'Recovered ($)',data:teamData.map(t=>t.total_recovered),backgroundColor:'#F97316',borderRadius:6}] } : null;

    return (
        <Layout>
            <div className="page-header"><h1 className="page-title">Reports</h1><p className="page-subtitle">Analytics and performance insights</p></div>
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
                {[['clients','Client Report'],['team','Team Performance']].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab===k?'bg-white text-orange-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{l}</button>)}
            </div>

            {loading ? <div className="skeleton h-80 rounded-2xl"/> :
            tab==='clients' ? <div>
                {cChart&&<div className="card p-6 mb-6"><h3 className="text-sm font-bold text-gray-900 mb-4">Recovery by Client</h3><Bar data={cChart} options={{responsive:true,scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,grid:{color:'#f3f4f6'}}}}}/></div>}
                <div className="card overflow-hidden"><table className="w-full"><thead><tr>{['Client','Debtors','Active','Loan','Recovered','Pending','Rate'].map(h=><th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody>{clientData.map(c=><tr key={c.client_id} className="table-row"><td className="table-cell font-semibold">{c.company_name}</td><td className="table-cell">{c.total_debtors}</td><td className="table-cell">{c.active_debtors}</td><td className="table-cell">${c.total_loan_amount?.toLocaleString()}</td><td className="table-cell text-emerald-600 font-semibold">${c.total_recovered?.toLocaleString()}</td><td className="table-cell text-orange-600 font-semibold">${c.total_pending?.toLocaleString()}</td><td className="table-cell"><span className="badge badge-blue">{c.recovery_rate}%</span></td></tr>)}</tbody></table></div>
            </div>
            : <div>
                {tChart&&<div className="card p-6 mb-6"><h3 className="text-sm font-bold text-gray-900 mb-4">Team Recovery</h3><Bar data={tChart} options={{responsive:true,plugins:{legend:{display:false}}}}/></div>}
                <div className="card overflow-hidden"><table className="w-full"><thead><tr>{['Member','Debtors','Recovered','Comms','Success'].map(h=><th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody>{teamData.map(t=><tr key={t.team_member_id} className="table-row"><td className="table-cell"><p className="font-semibold">{t.full_name}</p><p className="text-xs text-gray-400">{t.email}</p></td><td className="table-cell">{t.assigned_debtors}</td><td className="table-cell text-emerald-600 font-semibold">${t.total_recovered?.toLocaleString()}</td><td className="table-cell">{t.total_communications}</td><td className="table-cell"><span className="badge badge-green">{t.success_rate}%</span></td></tr>)}</tbody></table></div>
            </div>}
        </Layout>
    );
};

export default Reports;
