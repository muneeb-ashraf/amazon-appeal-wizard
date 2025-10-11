"use client";
import * as React from 'react';

// --- TYPE DEFINITIONS ---
type IconProps = {
    className?: string;
};

// Dummy data types
type Appeal = {
    id: string;
    customerName: string;
    email: string;
    issueType: string;
    date: string;
    status: 'Completed' | 'In Progress' | 'Payment Pending' | 'Failed';
};

type User = {
    id: string;
    name: string;
    email: string;
    joinDate: string;
    appealCount: number;
};

// --- SVG ICONS (matched to your app's style) ---

const LogoIcon = ({ className = "h-10 w-auto" }: IconProps) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z" fill="url(#paint0_linear_1_2)" />
        <path d="M13 29V11L22 16L27 13.5V23.5L22 26L13 29Z" fill="white" />
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
        </defs>
    </svg>
);

const DashboardIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);

const AppealsIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);

const UsersIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const SettingsIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);

const AnalyticsIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20V16"></path></svg>
);

const LogoutIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

const DollarSignIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);


// --- DUMMY DATA ---
const dummyAppeals: Appeal[] = [
    { id: 'AZ-79451', customerName: 'John Doe', email: 'john.doe@example.com', issueType: 'Account Suspension', date: '2025-10-11', status: 'Completed' },
    { id: 'AZ-79450', customerName: 'Jane Smith', email: 'jane.smith@example.com', issueType: 'Listing Suspension', date: '2025-10-11', status: 'In Progress' },
    { id: 'AZ-79449', customerName: 'Big Box Retail', email: 'contact@bigbox.com', issueType: 'Funds Withheld', date: '2025-10-10', status: 'Payment Pending' },
    { id: 'AZ-79448', customerName: 'Gadget Guru', email: 'support@gadgetguru.io', issueType: 'Other Issue', date: '2025-10-09', status: 'Completed' },
    { id: 'AZ-79447', customerName: 'Alice Johnson', email: 'alice.j@web.com', issueType: 'Account Suspension', date: '2025-10-08', status: 'Failed' },
];

const dummyUsers: User[] = [
    { id: 'U-001', name: 'John Doe', email: 'john.doe@example.com', joinDate: '2025-10-11', appealCount: 1 },
    { id: 'U-002', name: 'Jane Smith', email: 'jane.smith@example.com', joinDate: '2025-10-11', appealCount: 1 },
    { id: 'U-003', name: 'Big Box Retail', email: 'contact@bigbox.com', joinDate: '2025-10-10', appealCount: 3 },
    { id: 'U-004', name: 'Gadget Guru', email: 'support@gadgetguru.io', joinDate: '2025-10-09', appealCount: 2 },
];

// --- REUSABLE UI COMPONENTS ---

const StatusBadge = ({ status }: { status: Appeal['status'] }) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block";
    const statusClasses = {
        'Completed': 'bg-green-100 text-green-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Payment Pending': 'bg-yellow-100 text-yellow-800',
        'Failed': 'bg-red-100 text-red-800',
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const KpiCard = ({ title, value, icon: Icon, change, changeType }: { title: string; value: string; icon: React.ElementType; change?: string; changeType?: 'increase' | 'decrease' }) => (
    <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
            </div>
            <div className="bg-indigo-100 text-indigo-600 rounded-lg p-3">
                <Icon className="w-6 h-6" />
            </div>
        </div>
        {change && (
             <p className={`text-sm mt-2 flex items-center ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {changeType === 'increase' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />}
                </svg>
                {change}
             </p>
        )}
    </div>
);


// --- DASHBOARD VIEWS ---

const DashboardView = () => (
    <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Revenue" value="$1,750" icon={DollarSignIcon} change="+12.5%" changeType="increase" />
            <KpiCard title="Appeals Submitted" value="5" icon={AppealsIcon} change="+2 this week" changeType="increase" />
            <KpiCard title="New Users" value="4" icon={UsersIcon} />
            <KpiCard title="Conversion Rate" value="85%" icon={SettingsIcon} change="-1.2%" changeType="decrease"/>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200/80">
            <div className="p-6">
                 <h2 className="text-xl font-bold text-slate-800">Recent Appeals</h2>
                 <p className="text-sm text-slate-500 mt-1">An overview of the latest submissions.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Appeal ID</th>
                            <th scope="col" className="px-6 py-3">Customer</th>
                            <th scope="col" className="px-6 py-3">Issue Type</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyAppeals.map(appeal => (
                            <tr key={appeal.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{appeal.id}</th>
                                <td className="px-6 py-4">{appeal.customerName}</td>
                                <td className="px-6 py-4">{appeal.issueType}</td>
                                <td className="px-6 py-4">{appeal.date}</td>
                                <td className="px-6 py-4"><StatusBadge status={appeal.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const AppealsView = () => (
     <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Manage Appeals</h1>
         <div className="bg-white rounded-xl shadow-md border border-slate-200/80">
            <div className="p-6">
                 <h2 className="text-xl font-bold text-slate-800">All Submitted Appeals</h2>
                 <p className="text-sm text-slate-500 mt-1">Search, view, and manage all customer appeal submissions.</p>
            </div>
            <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Appeal ID</th>
                            <th scope="col" className="px-6 py-3">Customer</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyAppeals.map(appeal => (
                            <tr key={appeal.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{appeal.id}</th>
                                <td className="px-6 py-4">{appeal.customerName}</td>
                                <td className="px-6 py-4">{appeal.email}</td>
                                <td className="px-6 py-4"><StatusBadge status={appeal.status} /></td>
                                <td className="px-6 py-4">
                                    <button className="font-medium text-indigo-600 hover:underline">View Details</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const UsersView = () => (
     <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-6">User Management</h1>
         <div className="bg-white rounded-xl shadow-md border border-slate-200/80">
            <div className="p-6">
                 <h2 className="text-xl font-bold text-slate-800">All Users</h2>
                 <p className="text-sm text-slate-500 mt-1">View and manage all registered users.</p>
            </div>
            <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">User ID</th>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Appeals</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyUsers.map(user => (
                            <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{user.id}</th>
                                <td className="px-6 py-4">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">{user.appealCount}</td>
                                <td className="px-6 py-4">
                                    <button className="font-medium text-indigo-600 hover:underline">View Profile</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const AnalyticsView = () => {
    const revenueData = [
        { day: 'Mon', amount: 350 }, { day: 'Tue', amount: 0 }, { day: 'Wed', amount: 700 },
        { day: 'Thu', amount: 350 }, { day: 'Fri', amount: 350 }, { day: 'Sat', amount: 0 }, { day: 'Sun', amount: 0 }
    ];
    const maxRevenue = Math.max(...revenueData.map(d => d.amount));

    const appealTypes = dummyAppeals.reduce((acc, appeal) => {
        acc[appeal.issueType] = (acc[appeal.issueType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const totalAppeals = dummyAppeals.length;
    const appealTypeData = Object.entries(appealTypes).map(([name, count]) => ({ name, count, percentage: (count / totalAppeals) * 100 }));

    const colors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'];

    const circumference = 2 * Math.PI * 45; // 2 * pi * radius

    let accumulatedPercentage = 0;
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Analytics</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-6">
                    <h2 className="text-xl font-bold text-slate-800">Revenue Last 7 Days</h2>
                    <div className="mt-6 flex justify-between items-end h-64 space-x-4">
                        {revenueData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center justify-end">
                                <div className="text-xs font-bold text-indigo-600">${data.amount}</div>
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-lg hover:opacity-80 transition-opacity"
                                    style={{ height: `${(data.amount / maxRevenue) * 90}%` }}
                                ></div>
                                <div className="text-sm font-medium text-slate-500 mt-2">{data.day}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Appeals by Type Pie Chart */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-6">
                    <h2 className="text-xl font-bold text-slate-800">Appeals by Type</h2>
                    <div className="mt-6 flex items-center justify-center space-x-8">
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                {appealTypeData.map((data, index) => {
                                    const strokeDasharray = `${(data.percentage / 100) * circumference} ${circumference}`;
                                    const strokeDashoffset = -accumulatedPercentage / 100 * circumference;
                                    accumulatedPercentage += data.percentage;
                                    return (
                                        <circle
                                            key={index}
                                            cx="50" cy="50" r="45"
                                            fill="transparent"
                                            stroke={colors[index % colors.length]}
                                            strokeWidth="10"
                                            strokeDasharray={strokeDasharray}
                                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', strokeDashoffset }}
                                        />
                                    );
                                })}
                            </svg>
                        </div>
                        <div className="space-y-2">
                            {appealTypeData.map((data, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[index % colors.length] }}></div>
                                    <span className="text-sm font-medium text-slate-700">{data.name} ({data.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- LAYOUT & MAIN COMPONENTS ---

const Sidebar = ({ activeView, setActiveView, onLogout }: { activeView: string; setActiveView: (view: string) => void; onLogout: () => void; }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
        { id: 'appeals', label: 'Appeals', icon: AppealsIcon },
        { id: 'users', label: 'Users', icon: UsersIcon },
        { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
    ];

    return (
        <div className="w-64 bg-slate-800 text-slate-200 flex flex-col h-screen fixed">
            <div className="flex items-center justify-center p-6 border-b border-slate-700">
                <LogoIcon className="h-10 w-auto" />
                <span className="text-xl font-bold ml-3 text-white">Admin Panel</span>
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                            activeView === item.id 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                            : 'hover:bg-slate-700'
                        }`}
                    >
                        <item.icon className="w-5 h-5 mr-4" />
                        <span className="font-semibold">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-700">
                 <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors hover:bg-slate-700"
                >
                    <LogoutIcon className="w-5 h-5 mr-4" />
                    <span className="font-semibold">Logout</span>
                </button>
            </div>
        </div>
    );
};

const LoginPage = ({ onLogin, error }: { onLogin: (p: {u: string, p: string}) => void; error: string | null }) => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin({u: username, p: password});
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
                    <div className="flex flex-col items-center mb-6">
                        <LogoIcon className="h-12 w-auto" />
                        <h1 className="text-2xl font-bold text-slate-800 mt-4">Admin Login</h1>
                        <p className="text-slate-500">Welcome to AmzAppeal Pro</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                            >
                                Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [loginError, setLoginError] = React.useState<string | null>(null);
    const [activeView, setActiveView] = React.useState('dashboard');

    const handleLogin = ({u: username, p: password}: {u: string, p: string}) => {
        // Dummy authentication logic. Replace with your actual auth logic.
        if (username === 'admin@amazonappeal.ai' && password === '1DontForget2!') {
            setIsLoggedIn(true);
            setLoginError(null);
        } else {
            setLoginError('Invalid email or password.');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        // Maybe also clear any auth tokens here
    };
    
    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView />;
            case 'appeals': return <AppealsView />;
            case 'users': return <UsersView />;
            case 'analytics': return <AnalyticsView />;
            default: return <DashboardView />;
        }
    };

    if (!isLoggedIn) {
        return <LoginPage onLogin={handleLogin} error={loginError} />;
    }

    return (
        <div className="bg-slate-100 font-sans antialiased">
            <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
            <main className="ml-64 p-8 min-h-screen">
                {renderView()}
            </main>
        </div>
    );
}