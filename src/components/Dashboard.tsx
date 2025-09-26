import { useEffect, useState, useRef } from 'react';
import { Building2, Users, TrendingUp, Calendar, BarChart3, PieChart, Activity, Target, Download } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
    ChartDataLabels
);

interface Company {
    id: string;
    name: string;
    company_type: string;
    sector: string;
    service_commences_on: string;
    created_at: string;
    is_active: boolean;
}

interface DashboardStats {
    totalCompanies: number;
    activeCompanies: number;
    inactiveCompanies: number;
    companyTypes: { [key: string]: number };
    sectors: { [key: string]: number };
    yearlyGrowth: { [key: string]: number };
    monthlyGrowth: { [key: string]: number };
    cumulativeGrowth: { [key: string]: number };
    quarterlyGrowth: { [key: string]: number };
    growthRate: number;
    averageMonthlyGrowth: number;
}

export default function Dashboard() {
    const [, setCompanies] = useState<Company[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalCompanies: 0,
        activeCompanies: 0,
        inactiveCompanies: 0,
        companyTypes: {},
        sectors: {},
        yearlyGrowth: {},
        monthlyGrowth: {},
        cumulativeGrowth: {},
        quarterlyGrowth: {},
        growthRate: 0,
        averageMonthlyGrowth: 0
    });
    const [loading, setLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string>('All');
    const [selectedQuarter, setSelectedQuarter] = useState<string>('All');
    const [selectedCumulativeYear, setSelectedCumulativeYear] = useState<string>('All');
    const [selectedCompanyType, setSelectedCompanyType] = useState<string>('All');
    const [selectedSector, setSelectedSector] = useState<string>('All');
    const dashboardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/companies`);
                const companiesData = response.data;
                setCompanies(companiesData);
                
                // Calculate statistics
                const totalCompanies = companiesData.length;
                const activeCompanies = companiesData.filter((c: Company) => c.is_active !== false).length;
                const inactiveCompanies = totalCompanies - activeCompanies;
                
                // Company types analysis
                const companyTypes: { [key: string]: number } = {};
                companiesData.forEach((company: Company) => {
                    const type = company.company_type || 'Unknown';
                    companyTypes[type] = (companyTypes[type] || 0) + 1;
                });
                
                // Sectors analysis
                const sectors: { [key: string]: number } = {};
                companiesData.forEach((company: Company) => {
                    const sector = company.sector || 'Unknown';
                    sectors[sector] = (sectors[sector] || 0) + 1;
                });
                
                // Yearly growth analysis
                const yearlyGrowth: { [key: string]: number } = {};
                companiesData.forEach((company: Company) => {
                    const year = new Date(company.created_at).getFullYear().toString();
                    yearlyGrowth[year] = (yearlyGrowth[year] || 0) + 1;
                });
                
                // Monthly growth analysis (based on service_commences_on)
                const monthlyGrowth: { [key: string]: number } = {};
                companiesData.forEach((company: Company) => {
                    if (company.service_commences_on) {
                        const [year, month] = company.service_commences_on.split('-');
                        const key = `${year}-${month}`;
                        monthlyGrowth[key] = (monthlyGrowth[key] || 0) + 1;
                    }
                });
                
                // Calculate cumulative growth
                const cumulativeGrowth: { [key: string]: number } = {};
                const sortedYears = Object.keys(yearlyGrowth).sort();
                let cumulative = 0;
                sortedYears.forEach(year => {
                    cumulative += yearlyGrowth[year];
                    cumulativeGrowth[year] = cumulative;
                });
                
                // Calculate quarterly growth
                const quarterlyGrowth: { [key: string]: number } = {};
                companiesData.forEach((company: Company) => {
                    const year = new Date(company.created_at).getFullYear();
                    const month = new Date(company.created_at).getMonth();
                    const quarter = Math.floor(month / 3) + 1;
                    const key = `${year}-Q${quarter}`;
                    quarterlyGrowth[key] = (quarterlyGrowth[key] || 0) + 1;
                });
                
                // Calculate growth rate
                const years = Object.keys(yearlyGrowth).sort();
                let growthRate = 0;
                if (years.length >= 2) {
                    const firstYear = yearlyGrowth[years[0]];
                    const lastYear = yearlyGrowth[years[years.length - 1]];
                    growthRate = firstYear > 0 ? ((lastYear - firstYear) / firstYear) * 100 : 0;
                }
                
                // Calculate average monthly growth
                const monthlyValues = Object.values(monthlyGrowth);
                const averageMonthlyGrowth = monthlyValues.length > 0 
                    ? monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length 
                    : 0;
                
                setStats({
                    totalCompanies,
                    activeCompanies,
                    inactiveCompanies,
                    companyTypes,
                    sectors,
                    yearlyGrowth,
                    monthlyGrowth,
                    cumulativeGrowth,
                    quarterlyGrowth,
                    growthRate,
                    averageMonthlyGrowth
                });
            } catch (error) {
                console.error('Failed to fetch companies:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const generatePDF = async () => {
        if (!dashboardRef.current) return;
        
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: dashboardRef.current.scrollWidth,
                height: dashboardRef.current.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            // A4 dimensions in landscape: 297mm x 210mm
            const pdfWidth = 297;
            const pdfHeight = 210;
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Calculate scaling to fit A4
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const scaledWidth = imgWidth * ratio;
            const scaledHeight = imgHeight * ratio;
            
            // Center the image on the page
            const x = (pdfWidth - scaledWidth) / 2;
            const y = (pdfHeight - scaledHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
            
            // Add header
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PaceHRM Analytics Dashboard', pdfWidth / 2, 15, { align: 'center' });
            
            // Add date
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 25, { align: 'center' });
            
            // Add footer
            pdf.setFontSize(8);
            pdf.text('© PaceHRM Super Admin Portal', pdfWidth / 2, pdfHeight - 10, { align: 'center' });

            pdf.save(`PaceHRM-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // Chart configurations
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
            },
            datalabels: {
                display: true,
                color: '#000000',
                font: {
                    size: 11,
                    weight: 'bold' as const,
                },
                formatter: (value: number) => value,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
            },
        },
    };

    const lineChartOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            legend: {
                display: true,
                position: 'top' as const,
            },
        },
        elements: {
            line: {
                tension: 0.4,
            },
        },
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            datalabels: {
                display: true,
                color: '#000000',
                font: {
                    size: 11,
                    weight: 'bold' as const,
                },
                formatter: (value: number, context: any) => {
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${value}\n(${percentage}%)`;
                },
            },
        },
    };

    // Prepare chart data
    const cumulativeGrowthData = {
        labels: selectedCumulativeYear === 'All' 
            ? Object.keys(stats.cumulativeGrowth).sort()
            : [selectedCumulativeYear],
        datasets: [
            {
                label: 'Cumulative Companies',
                data: selectedCumulativeYear === 'All'
                    ? Object.keys(stats.cumulativeGrowth).sort().map(year => stats.cumulativeGrowth[year])
                    : [stats.cumulativeGrowth[selectedCumulativeYear] || 0],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const yearlyGrowthData = {
        labels: selectedYear === 'All' 
            ? Object.keys(stats.yearlyGrowth).sort()
            : [selectedYear],
        datasets: [
            {
                label: 'New Companies',
                data: selectedYear === 'All'
                    ? Object.keys(stats.yearlyGrowth).sort().map(year => stats.yearlyGrowth[year])
                    : [stats.yearlyGrowth[selectedYear] || 0],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1,
            },
        ],
    };

    const quarterlyGrowthData = {
        labels: selectedQuarter === 'All'
            ? Object.keys(stats.quarterlyGrowth).sort()
            : Object.keys(stats.quarterlyGrowth).sort().filter(quarter => 
                selectedQuarter === 'All' || quarter.includes(selectedQuarter)
            ),
        datasets: [
            {
                label: 'Companies by Quarter',
                data: selectedQuarter === 'All'
                    ? Object.keys(stats.quarterlyGrowth).sort().map(quarter => stats.quarterlyGrowth[quarter])
                    : Object.keys(stats.quarterlyGrowth).sort()
                        .filter(quarter => selectedQuarter === 'All' || quarter.includes(selectedQuarter))
                        .map(quarter => stats.quarterlyGrowth[quarter]),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const companyTypesData = {
        labels: selectedCompanyType === 'All'
            ? Object.keys(stats.companyTypes)
            : [selectedCompanyType],
        datasets: [
            {
                data: selectedCompanyType === 'All'
                    ? Object.values(stats.companyTypes)
                    : [stats.companyTypes[selectedCompanyType] || 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const sectorsData = {
        labels: selectedSector === 'All'
            ? Object.keys(stats.sectors)
            : [selectedSector],
        datasets: [
            {
                data: selectedSector === 'All'
                    ? Object.values(stats.sectors)
                    : [stats.sectors[selectedSector] || 0],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(6, 182, 212, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-2 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 py-2" ref={dashboardRef}>
            {/* Header */}
            <div className="mb-2 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 text-sm">Comprehensive overview of your organization data</p>
                </div>
                <button
                    onClick={generatePDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {isGeneratingPDF ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Export PDF
                        </>
                    )}
                </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-600">Total Companies</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.totalCompanies}</p>
                            <p className="text-xs text-blue-500">All registered</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-green-600">Active Companies</p>
                            <p className="text-2xl font-bold text-green-900">{stats.activeCompanies}</p>
                            <p className="text-xs text-green-500">Operational</p>
                        </div>
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-purple-600">Growth Rate</p>
                            <p className="text-2xl font-bold text-purple-900">{stats.growthRate.toFixed(1)}%</p>
                            <p className="text-xs text-purple-500">YoY growth</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm border border-orange-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-orange-600">Monthly Average</p>
                            <p className="text-2xl font-bold text-orange-900">{stats.averageMonthlyGrowth.toFixed(1)}</p>
                            <p className="text-xs text-orange-500">Per month</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
                {/* Cumulative Growth Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                <TrendingUp className="w-3 h-3 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">Cumulative Growth</h3>
                        </div>
                        <select
                            value={selectedCumulativeYear}
                            onChange={(e) => setSelectedCumulativeYear(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                            <option value="All">All</option>
                            {Object.keys(stats.cumulativeGrowth).sort().map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="h-48">
                        <Line data={cumulativeGrowthData} options={lineChartOptions} />
                    </div>
                </div>

                {/* Yearly Growth Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                                <BarChart3 className="w-3 h-3 text-green-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">Yearly Growth</h3>
                        </div>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                            <option value="All">All</option>
                            {Object.keys(stats.yearlyGrowth).sort().map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="h-48">
                        <Bar data={yearlyGrowthData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Secondary Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2">
                {/* Company Types Pie Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                                <PieChart className="w-3 h-3 text-purple-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">Company Types</h3>
                        </div>
                        <select
                            value={selectedCompanyType}
                            onChange={(e) => setSelectedCompanyType(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                            <option value="All">All</option>
                            {Object.keys(stats.companyTypes).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className="h-40">
                        <Pie data={companyTypesData} options={pieChartOptions} />
                    </div>
                </div>

                {/* Sectors Doughnut Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                                <Target className="w-3 h-3 text-orange-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">Sectors</h3>
                        </div>
                        <select
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                            <option value="All">All</option>
                            {Object.keys(stats.sectors).map(sector => (
                                <option key={sector} value={sector}>{sector}</option>
                            ))}
                        </select>
                    </div>
                    <div className="h-40">
                        <Doughnut data={sectorsData} options={pieChartOptions} />
                    </div>
                </div>

                {/* Quarterly Growth Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
                                <Calendar className="w-3 h-3 text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">Quarterly Growth</h3>
                        </div>
                        <select
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                            <option value="All">All</option>
                            {Object.keys(stats.quarterlyGrowth).sort().map(quarter => (
                                <option key={quarter} value={quarter}>{quarter}</option>
                            ))}
                        </select>
                    </div>
                    <div className="h-40">
                        <Bar data={quarterlyGrowthData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
                {/* Growth Insights */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-sm border border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                            <Activity className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Growth Insights</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-white rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">Growth Rate</span>
                                <span className="text-sm font-bold text-blue-600">{stats.growthRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(Math.abs(stats.growthRate), 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">Monthly Average</span>
                                <span className="text-sm font-bold text-green-600">{stats.averageMonthlyGrowth.toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min((stats.averageMonthlyGrowth / 10) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">Active Rate</span>
                                <span className="text-sm font-bold text-purple-600">
                                    {stats.totalCompanies > 0 ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${stats.totalCompanies > 0 ? (stats.activeCompanies / stats.totalCompanies) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-sm border border-green-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                            <Target className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Performance Metrics</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded p-3 text-center">
                                <div className="text-lg font-bold text-blue-600">{stats.totalCompanies}</div>
                                <div className="text-xs text-gray-500">Total</div>
                            </div>
                            <div className="bg-white rounded p-3 text-center">
                                <div className="text-lg font-bold text-green-600">{stats.activeCompanies}</div>
                                <div className="text-xs text-gray-500">Active</div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded p-3 text-center">
                                <div className="text-lg font-bold text-orange-600">{stats.inactiveCompanies}</div>
                                <div className="text-xs text-gray-500">Inactive</div>
                            </div>
                            <div className="bg-white rounded p-3 text-center">
                                <div className="text-lg font-bold text-purple-600">
                                    {Object.keys(stats.yearlyGrowth).length}
                                </div>
                                <div className="text-xs text-gray-500">Years</div>
                            </div>
                        </div>

                        <div className="bg-white rounded p-3">
                            <div className="text-xs font-medium text-gray-600 mb-1">Top Sector</div>
                            <div className="text-sm font-bold text-gray-900">
                                {Object.entries(stats.sectors).length > 0 
                                    ? Object.entries(stats.sectors).reduce((a, b) => stats.sectors[a[0]] > stats.sectors[b[0]] ? a : b)[0]
                                    : 'N/A'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
