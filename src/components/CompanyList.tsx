import axios from 'axios';
import { Building2, ChevronLeft, MoreVertical } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Company } from '../types';
import CreateCompany from './CreateCompany';

export default function CompanyList({ onNavigateBack }: { onNavigateBack: () => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]); // For filtered results
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [companyToUpdate, setCompanyToUpdate] = useState<Company | null>(null);
    const [searchQuery, setSearchQuery] = useState(''); // For search input

    const companiesPerPage = 3;
    const indexOfLastCompany = currentPage * companiesPerPage;
    const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
    const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
    const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

    useEffect(() => {
        const fetchCompanies = async () => {
            setLoading(true);
            setError(null);
            try {
                // const response = await axios.get('https://sec.pacehrm.com/api/companies');
                const response = await axios.get('http://localhost:5000/api/companies');

                const sortedCompanies = response.data.sort((a: Company, b: Company) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setCompanies(sortedCompanies);
                setFilteredCompanies(sortedCompanies); // Initialize filtered companies
            } catch (err: any) {
                console.error('Error fetching companies:', err);
                setError(err.message || 'Failed to fetch companies. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        // Filter companies based on the search query
        const filtered = companies.filter((company) =>
            company.name.toLowerCase().includes(query)
        );
        setFilteredCompanies(filtered);
        setCurrentPage(1); // Reset to the first page after filtering
    };

    const handleUpdate = (company: Company) => {
        setCompanyToUpdate(company); // Set the company to update
        setShowCreateModal(true); // Open the modal
    };

    const handleDelete = (companyId: string) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                axios.delete(`https://sec.pacehrm.com/api/companies/${companyId}`);
                // axios.delete(`http://localhost:5000/api/companies/${companyId}`);

                setCompanies(companies.filter((company) => company.id !== companyId));
                setFilteredCompanies(filteredCompanies.filter((company) => company.id !== companyId));
                alert('Company deleted successfully.');
            } catch (err) {
                console.error('Error deleting company:', err);
                alert('Failed to delete company. Please try again.');
            }
        }
    };

    const navigate = onNavigateBack; // Use the provided navigation function

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button
                        onClick={navigate} // Call the navigation function
                        className="text-blue-500 mb-4 flex items-center gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-2xl font-semibold">Hi, PaceHrm SuperAdmin!</h1>
                    <p className="text-gray-600">
                        You are a part of the following organizations. Go to the organization which you wish to access now.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                    + New Organization
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search by company name..."
                    className="w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading ? (
                <div className="text-center">Loading companies...</div>
            ) : error ? (
                <div className="text-center text-red-600">{error}</div>
            ) : (
                <>
                    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                        {currentCompanies.map((company) => (
                            <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                {company.logo && typeof company.logo === 'string' ? (
                                                    <img
                                                        src={company.logo}
                                                        alt={`${company.name} Logo`}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <Building2 className="w-8 h-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-lg font-semibold">{company.name}</h2>
                                                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                                        {company.edition}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Organization created on{' '}
                                                    {new Date(company.createdAt).toLocaleString('en-IN', {
                                                        timeZone: 'Asia/Kolkata',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                    })}
                                                </p>
                                                <p className="text-sm text-gray-500">Organization ID: {company.id}</p>
                                                <p className="text-sm text-gray-500">Address: {company.address}</p>
                                                <p className="text-sm mt-2">
                                                    You are an <span className="font-medium">Superadmin</span> in this organization
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 relative">
                                            <a
                                                href={`${company.domain_name}?superAdminID=${encodeURIComponent(company.email)}&password=${encodeURIComponent(company.password)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 text-blue-500 border border-blue-500 rounded hover:bg-blue-50"
                                            >
                                                Go to Organization
                                            </a>
                                            <button
                                                onClick={() => setSelectedCompany(company.id)} // Toggle menu visibility
                                                className="p-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            {selectedCompany === company.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                                                    <button
                                                        onClick={() => handleUpdate(company)}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Update Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(company.id)}
                                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                                                    >
                                                        Delete Company
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded ${currentPage === page
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {showCreateModal && (
                <CreateCompany
                    onClose={() => {
                        setShowCreateModal(false);
                        setCompanyToUpdate(null);
                    }}
                    company={companyToUpdate}
                />
            )}
        </div>
    );
}