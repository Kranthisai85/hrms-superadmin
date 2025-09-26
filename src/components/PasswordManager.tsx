import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Copy, Eye, EyeOff, Edit, Trash2, Shield, Key } from 'lucide-react';

interface PasswordEntry {
    id: string;
    siteName: string;
    url: string;
    username: string;
    password: string;
    mobile?: string;
    email?: string;
}

interface PasswordManagerProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    companyName: string;
}

export default function PasswordManager({ isOpen, onClose, companyId, companyName }: PasswordManagerProps) {
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [showAddPassword, setShowAddPassword] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [passwordVisibility, setPasswordVisibility] = useState<{ [key: string]: boolean }>({});
    const [editingPassword, setEditingPassword] = useState<string | null>(null);

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        siteName: '',
        url: '',
        username: '',
        password: '',
        mobile: '',
        email: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, companyId]);

    const loadData = () => {
        // Load passwords from localStorage
        const savedPasswords = localStorage.getItem(`passwords_${companyId}`);
        if (savedPasswords) {
            setPasswords(JSON.parse(savedPasswords));
        }
    };

    const savePasswords = (newPasswords: PasswordEntry[]) => {
        setPasswords(newPasswords);
        localStorage.setItem(`passwords_${companyId}`, JSON.stringify(newPasswords));
    };


    const handleAddPassword = () => {
        console.log('handleAddPassword called', passwordForm);
        console.log('Form validation:', {
            siteName: passwordForm.siteName,
            url: passwordForm.url,
            username: passwordForm.username,
            password: passwordForm.password
        });
        
        if (!passwordForm.siteName || !passwordForm.url || !passwordForm.username || !passwordForm.password) {
            console.log('Validation failed - missing required fields');
            alert('Please fill in all required fields');
            return;
        }

        const newPassword: PasswordEntry = {
            id: Date.now().toString(),
            ...passwordForm
        };

        console.log('Adding new password:', newPassword);
        const updatedPasswords = [...passwords, newPassword];
        savePasswords(updatedPasswords);
        setPasswordForm({ siteName: '', url: '', username: '', password: '', mobile: '', email: '' });
        setShowAddPassword(false);
        console.log('Password added successfully, modal closed');
    };

    const handleUpdatePassword = () => {
        if (!editingPassword) return;

        const updatedPasswords = passwords.map(p => 
            p.id === editingPassword ? { ...p, ...passwordForm } : p
        );
        savePasswords(updatedPasswords);
        setEditingPassword(null);
        setPasswordForm({ siteName: '', url: '', username: '', password: '', mobile: '', email: '' });
    };

    const handleDeletePassword = (id: string) => {
        if (confirm('Are you sure you want to delete this password entry?')) {
            const updatedPasswords = passwords.filter(p => p.id !== id);
            savePasswords(updatedPasswords);
        }
    };


    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        alert(`${type} copied to clipboard!`);
    };

    const togglePasswordVisibility = (id: string) => {
        setPasswordVisibility(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const startEditPassword = (password: PasswordEntry) => {
        setPasswordForm(password);
        setEditingPassword(password.id);
    };

    const filteredPasswords = passwords.filter(password =>
        password.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Password Manager</h2>
                                <p className="text-sm text-gray-500">{companyName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search passwords by site name, URL, or username..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        console.log('Add Password button clicked');
                                        setShowAddPassword(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Password
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-4">
                            {filteredPasswords.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Shield className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No passwords found</h4>
                                    <p className="text-gray-500 mb-4">
                                        {searchQuery ? 'No passwords match your search criteria.' : 'Start by adding your first password entry.'}
                                    </p>
                                    {!searchQuery && (
                                        <button
                                            onClick={() => {
                                                console.log('Add First Password button clicked');
                                                setShowAddPassword(true);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add First Password
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="h-full overflow-y-auto">
                                        <div className="space-y-2 p-4">
                                            {filteredPasswords.map(password => (
                                                <div key={password.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-medium text-gray-900 truncate">{password.siteName}</h4>
                                                            <span className="text-xs text-gray-500 truncate">{password.url}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span className="truncate">
                                                                <span className="font-medium">User:</span> {password.username}
                                                            </span>
                                                            <span className="truncate">
                                                                <span className="font-medium">Pass:</span> {passwordVisibility[password.id] ? password.password : '••••••••'}
                                                            </span>
                                                            {password.mobile && (
                                                                <span className="truncate">
                                                                    <span className="font-medium">Mobile:</span> {password.mobile}
                                                                </span>
                                                            )}
                                                            {password.email && (
                                                                <span className="truncate">
                                                                    <span className="font-medium">Email:</span> {password.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => togglePasswordVisibility(password.id)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title={passwordVisibility[password.id] ? 'Hide password' : 'Show password'}
                                                        >
                                                            {passwordVisibility[password.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(password.username, 'Username')}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Copy username"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(password.password, 'Password')}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Copy password"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => startEditPassword(password)}
                                                            className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit password"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePassword(password.id)}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete password"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Password Modal */}
            {console.log('Modal condition:', showAddPassword, editingPassword)}
            {(showAddPassword || editingPassword) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Key className="w-4 h-4 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {editingPassword ? 'Edit Password Entry' : 'Add New Password Entry'}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Name *</label>
                                    <input
                                        type="text"
                                        value={passwordForm.siteName}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, siteName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter site name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                                    <input
                                        type="url"
                                        value={passwordForm.url}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                    <input
                                        type="text"
                                        value={passwordForm.username}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, username: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        value={passwordForm.password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={passwordForm.mobile}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, mobile: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter mobile number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={passwordForm.email}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter email address"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => {
                                        setShowAddPassword(false);
                                        setEditingPassword(null);
                                        setPasswordForm({ siteName: '', url: '', username: '', password: '', mobile: '', email: '' });
                                    }}
                                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        console.log('Modal Add Password button clicked');
                                        if (editingPassword) {
                                            handleUpdatePassword();
                                        } else {
                                            handleAddPassword();
                                        }
                                    }}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    {editingPassword ? 'Update Password' : 'Add Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
}
