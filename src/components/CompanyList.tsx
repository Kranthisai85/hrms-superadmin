import axios from 'axios';
import { Building2, ChevronLeft, MoreVertical, Star, Key } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { Company } from '../types';
import CreateCompany from './CreateCompany';
import PasswordManager from './PasswordManager';
import { API_BASE_URL } from '../config';
import { RelativeTime } from './RelativeTime';

// CompanyMenu component for action popup
function CompanyMenu({ onUpdate, onDelete, onDeactivate, onActivate, onToggleFavorite, onClose, isActive, isFavorite }: { 
    onUpdate: () => void; 
    onDelete: () => void; 
    onDeactivate: () => void;
    onActivate: () => void;
    onToggleFavorite: () => void;
    onClose: () => void;
    isActive: boolean;
    isFavorite: boolean;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    return (
        <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <button
                onClick={onUpdate}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
            >
                Update Details
            </button>
            <button
                onClick={onToggleFavorite}
                className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors"
            >
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            {isActive ? (
                <button
                    onClick={onDeactivate}
                    className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                >
                    Deactivate Company
                </button>
            ) : (
                <button
                    onClick={onActivate}
                    className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                >
                    Activate Company
                </button>
            )}
            <button
                onClick={onDelete}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
            >
                Delete Company
            </button>
        </div>
    );
}

// ConfirmDialog component for delete confirmation
function ConfirmDialog({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-2">Delete Company?</h2>
                <p className="text-gray-600 mb-4">Are you sure you want to delete this company? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

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
    const [, setUpdateLoading] = useState(false); // For update modal loading
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [companyIdToDelete, setCompanyIdToDelete] = useState<string | null>(null);
    const [favoriteCompanies, setFavoriteCompanies] = useState<Set<string>>(new Set());
    const [showPasswordManager, setShowPasswordManager] = useState(false);
    const [selectedCompanyForPassword, setSelectedCompanyForPassword] = useState<Company | null>(null);
    const companiesPerPage = 10; // 10 companies per page
    const indexOfLastCompany = currentPage * companiesPerPage;
    const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
    const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
    const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

    useEffect(() => {
        const fetchCompanies = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/companies`);

                const sortedCompanies = response.data.sort((a: Company, b: Company) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
                setCompanies(sortedCompanies);
                setFilteredCompanies(sortedCompanies); // Initialize filtered companies
            } catch (err: any) {
                if (axios.isAxiosError(err) && err.response && err.response.data && err.response.data.error) {
                    setError(err.response.data.error);
                } else {
                    setError('Failed to fetch companies. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('favoriteCompanies');
        if (savedFavorites) {
            setFavoriteCompanies(new Set(JSON.parse(savedFavorites)));
        }

        fetchCompanies();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        // Filter companies based on the search query
        const filtered = companies.filter((company) =>
            company.name.toLowerCase().includes(query)
        );
        
        // Sort filtered companies with favorites first
        const sortedFiltered = filtered.sort((a, b) => {
            const aIsFavorite = favoriteCompanies.has(a.id);
            const bIsFavorite = favoriteCompanies.has(b.id);
            
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setFilteredCompanies(sortedFiltered);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleUpdate = async (company: Company) => {
        setUpdateLoading(true);
        try {
            // Fetch latest company details from backend
            const response = await axios.get(`${API_BASE_URL}/companies/${company.id}`);
            setCompanyToUpdate(response.data); // Set the latest company data
            setShowCreateModal(true); // Open the modal
        } catch (err) {
            alert('Failed to fetch latest company details.');
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleDelete = (companyId: string) => {
        setCompanyIdToDelete(companyId);
        setShowConfirmDialog(true);
    };
    const confirmDelete = () => {
        if (!companyIdToDelete) return;
        axios.delete(`${API_BASE_URL}/companies/${companyIdToDelete}`)
            .then((response) => {
                setCompanies(companies.filter((company) => company.id !== companyIdToDelete));
                setFilteredCompanies(filteredCompanies.filter((company) => company.id !== companyIdToDelete));
                setShowConfirmDialog(false);
                setCompanyIdToDelete(null);
                alert(response.data.message || 'Company deleted successfully.');
            })
            .catch((err) => {
                if (axios.isAxiosError(err) && err.response && err.response.data) {
                    const errorData = err.response.data;
                    if (errorData.hasUsers) {
                        // Show cascade delete confirmation
                        if (confirm(`${errorData.error}\n\nDo you want to delete the company and all ${errorData.userCount} associated users?`)) {
                            // Proceed with cascade delete
                            axios.delete(`${API_BASE_URL}/companies/${companyIdToDelete}?cascade=true`)
                                .then((response) => {
                                    setCompanies(companies.filter((company) => company.id !== companyIdToDelete));
                                    setFilteredCompanies(filteredCompanies.filter((company) => company.id !== companyIdToDelete));
                                    setShowConfirmDialog(false);
                                    setCompanyIdToDelete(null);
                                    alert(response.data.message || 'Company and users deleted successfully.');
                                })
                                .catch((cascadeErr) => {
                                    if (axios.isAxiosError(cascadeErr) && cascadeErr.response && cascadeErr.response.data && cascadeErr.response.data.error) {
                                        setError(cascadeErr.response.data.error);
                                    } else {
                                        setError('Failed to delete company and users. Please try again.');
                                    }
                                    setShowConfirmDialog(false);
                                    setCompanyIdToDelete(null);
                                });
                        } else {
                            setShowConfirmDialog(false);
                            setCompanyIdToDelete(null);
                        }
                    } else {
                        setError(errorData.error);
                        setShowConfirmDialog(false);
                        setCompanyIdToDelete(null);
                    }
                } else {
                    setError('Failed to delete company. Please try again.');
                    setShowConfirmDialog(false);
                    setCompanyIdToDelete(null);
                }
            });
    };
    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setCompanyIdToDelete(null);
    };

    const handleDeactivate = async (companyId: string) => {
        try {
            await axios.patch(`${API_BASE_URL}/companies/${companyId}`, { is_active: false });
            setCompanies(companies.map(c => c.id === companyId ? { ...c, is_active: false } : c));
            setFilteredCompanies(filteredCompanies.map(c => c.id === companyId ? { ...c, is_active: false } : c));
            alert('Company deactivated successfully.');
        } catch (err) {
            alert('Failed to deactivate company.');
        }
    };

    const handleActivate = async (companyId: string) => {
        try {
            await axios.patch(`${API_BASE_URL}/companies/${companyId}`, { is_active: true });
            setCompanies(companies.map(c => c.id === companyId ? { ...c, is_active: true } : c));
            setFilteredCompanies(filteredCompanies.map(c => c.id === companyId ? { ...c, is_active: true } : c));
            alert('Company activated successfully.');
        } catch (err) {
            alert('Failed to activate company.');
        }
    };

    const handleToggleFavorite = (companyId: string) => {
        const newFavorites = new Set(favoriteCompanies);
        if (newFavorites.has(companyId)) {
            newFavorites.delete(companyId);
        } else {
            newFavorites.add(companyId);
        }
        setFavoriteCompanies(newFavorites);
        localStorage.setItem('favoriteCompanies', JSON.stringify(Array.from(newFavorites)));
        
        // Re-sort companies with favorites first
        const sortedCompanies = companies.sort((a, b) => {
            const aIsFavorite = newFavorites.has(a.id);
            const bIsFavorite = newFavorites.has(b.id);
            
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setCompanies(sortedCompanies);
        
        // Re-sort filtered companies
        const sortedFiltered = filteredCompanies.sort((a, b) => {
            const aIsFavorite = newFavorites.has(a.id);
            const bIsFavorite = newFavorites.has(b.id);
            
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setFilteredCompanies(sortedFiltered);
    };

    const handlePasswordManager = (company: Company) => {
        setSelectedCompanyForPassword(company);
        setShowPasswordManager(true);
    };

    // Callback to update company in state after update
    const handleCompanyUpdated = (updatedCompany: Company) => {
        setCompanies((prev) => prev.map((c) => c.id === updatedCompany.id ? updatedCompany : c));
        setFilteredCompanies((prev) => prev.map((c) => c.id === updatedCompany.id ? updatedCompany : c));
        setShowCreateModal(false);
        setCompanyToUpdate(null);
    };

    const navigate = onNavigateBack; // Use the provided navigation function

    return (
        <div className="w-full px-4 py-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <button
                        onClick={navigate}
                        className="text-blue-600 mb-3 flex items-center gap-2 text-sm font-medium hover:text-blue-700 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                            <p className="text-gray-600 text-sm">Manage and monitor all organizations in your system</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                    <Building2 className="w-4 h-4" />
                    New Organization
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative w-1/4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search organizations..."
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading organizations...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4">
                        <div className="space-y-3">
                            {currentCompanies.map((company) => (
                                <div key={company.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-300">
                                    <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                        {company.logo && typeof company.logo === 'string' && company.logo.trim() !== '' ? (
                                            <img
                                                src={company.logo}
                                                alt={`${company.name} Logo`}
                                                className="w-full h-full object-contain rounded-lg p-1"
                                                style={{
                                                    filter: 'contrast(1.1) brightness(1.05)',
                                                    imageRendering: 'high-quality'
                                                }}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    target.nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <Building2 className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">{company.name}</h3>
                                            {favoriteCompanies.has(company.id) && (
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                            )}
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                                                {company.edition}
                                            </span>
                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                                                Superadmin
                                            </span>
                                            {(company as any).is_active === false && (
                                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <span className="truncate">
                                                <span className="font-medium">ID:</span> {company.id}
                                            </span>
                                            <span className="whitespace-nowrap">
                                                <span className="font-medium">Created:</span> <RelativeTime date={company.created_at} />
                                            </span>
                                            {company.company_type && (
                                                <span className="whitespace-nowrap">
                                                    <span className="font-medium">Type:</span> {company.company_type}
                                                </span>
                                            )}
                                            {company.sector && (
                                                <span className="whitespace-nowrap">
                                                    <span className="font-medium">Sector:</span> {company.sector}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button
                                            onClick={() => handlePasswordManager(company)}
                                            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                            title="Password Manager"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <a
                                            href={`https://${company.domain_name}?companyId=${encodeURIComponent(company.id)}&superAdminID=${encodeURIComponent(company.email)}&password=${encodeURIComponent(company.password)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                                        >
                                            Access Organization
                                        </a>
                                        <div className="relative">
                                            <button
                                                onClick={() => setSelectedCompany(company.id)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {selectedCompany === company.id && (
                                                <CompanyMenu
                                                    onUpdate={() => {
                                                        setSelectedCompany(null);
                                                        handleUpdate(company);
                                                    }}
                                                    onDelete={() => {
                                                        setSelectedCompany(null);
                                                        handleDelete(company.id);
                                                    }}
                                                    onDeactivate={() => {
                                                        setSelectedCompany(null);
                                                        handleDeactivate(company.id);
                                                    }}
                                                    onActivate={() => {
                                                        setSelectedCompany(null);
                                                        handleActivate(company.id);
                                                    }}
                                                    onToggleFavorite={() => {
                                                        setSelectedCompany(null);
                                                        handleToggleFavorite(company.id);
                                                    }}
                                                    onClose={() => setSelectedCompany(null)}
                                                    isActive={(company as any).is_active !== false}
                                                    isFavorite={favoriteCompanies.has(company.id)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
                    
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-gray-300"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const startPage = Math.max(1, currentPage - 2);
                            const page = startPage + i;
                            if (page > totalPages) return null;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-gray-300"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreateCompany
                    onClose={() => {
                        setShowCreateModal(false);
                        setCompanyToUpdate(null);
                    }}
                    company={
                        companyToUpdate
                            ? { 
                                ...companyToUpdate, 
                                invite_admin: Boolean(companyToUpdate.invite_admin),
                                service_commences_on: (companyToUpdate as any).service_commences_on || ''
                              }
                            : null
                    }
                    onCompanyUpdated={handleCompanyUpdated}
                />
            )}
            <ConfirmDialog
                open={showConfirmDialog}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            
            {showPasswordManager && selectedCompanyForPassword && (
                <PasswordManager
                    isOpen={showPasswordManager}
                    onClose={() => {
                        setShowPasswordManager(false);
                        setSelectedCompanyForPassword(null);
                    }}
                    companyId={selectedCompanyForPassword.id}
                    companyName={selectedCompanyForPassword.name}
                />
            )}
        </div>
    );
}