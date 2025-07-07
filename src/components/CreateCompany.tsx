import axios from 'axios';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CompanyFormData {
    code: string;
    name: string;
    address: string;
    email: string;
    phone: string;
    pfCode: string;
    esiCode: string;
    labourLicense: string;
    domainName: string;
    contactPerson: string;
    website: string;
    superAdminId: string;
    password: string;
    logo: File | null;
    inviteAdmin: boolean;
}

interface CreateCompanyProps {
    onClose: () => void;
    company?: {
        id: string;
        code: string;
        name: string;
        address: string;
        email: string;
        phone: string;
        pfCode: string;
        esiCode: string;
        labourLicense: string;
        domainName: string;
        contactPerson: string;
        website: string;
        superAdminID: string;
        password: string;
        logo: string;
    } | null; // Optional company for updating
}

export default function CreateCompany({ onClose, company }: CreateCompanyProps) {
    const [formData, setFormData] = useState<CompanyFormData>({
        code: '',
        name: '',
        address: '',
        email: '',
        phone: '',
        pfCode: '',
        esiCode: '',
        labourLicense: '',
        domainName: '',
        contactPerson: '',
        website: '',
        superAdminId: '',
        password: '',
        logo: null,
        inviteAdmin: false, // Checkbox for sending email
    });

    useEffect(() => {
        if (company) {
            setFormData({
                code: company.code || '',
                name: company.name || '',
                address: company.address || '',
                email: company.email || '',
                phone: company.phone || '',
                pfCode: company.pfCode || '',
                esiCode: company.esiCode || '',
                labourLicense: company.labourLicense || '',
                domainName: company.domainName || '',
                contactPerson: company.contactPerson || '',
                website: company.website || '',
                superAdminId: company.superAdminID || '',
                password: company.password || '',
                logo: null, // Logo cannot be pre-filled
                inviteAdmin: false,
            });
        }
    }, [company]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({
                ...prev,
                logo: e.target.files![0],
            }));
        }
    };

    const uploadLogo = async (logo: File): Promise<string | null> => {
        const logoFormData = new FormData();
        logoFormData.append('file', logo);

        try {
            const response = await axios.post('https://sec.pacehrm.com/api/logo', logoFormData, {
                // const response = await axios.post('http://localhost:5000/api/logo', logoFormData, {

                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.fileUrl; // Return the uploaded logo URL
        } catch (err: any) {
            setError('Failed to upload logo. Please try again.');
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Validation for 'code' field
        if (!formData.code) {
            setError('Code is required.');
            setIsSubmitting(false);
            return;
        }

        let logoUrl = null;

        // Upload the logo if it exists
        if (formData.logo) {
            logoUrl = await uploadLogo(formData.logo);
            if (!logoUrl) {
                setIsSubmitting(false);
                return;
            }
        }

        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'logo') {
                formDataToSend.append('logo', logoUrl || ''); // Use the uploaded logo URL
            } else if (value !== null && value !== undefined) {
                formDataToSend.append(key, value);
            }
        });

        try {
            let response;
            if (company) {
                // Update company if `company` prop is provided
                response = await axios.put(
                    `https://sec.pacehrm.com/api/companies/${company.id}`,
                    // `http://localhost:5000/api/companies/${company.id}`,

                    Object.fromEntries(formDataToSend.entries()),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                alert('Company updated successfully!');
            } else {
                // Create a new company
                response = await axios.post('https://sec.pacehrm.com/api/companies', formDataToSend, {
                    // response = await axios.post('http://localhost:5000/api/companies', formDataToSend, {

                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                alert('Company created successfully!');
            }

            // Send email if `inviteAdmin` is checked
            if (formData.inviteAdmin) {
                await axios.post('https://sec.pacehrm.com/api/email/send', {
                    to: formData.email,
                    companyName: formData.name,
                    subdomain: formData.domainName,
                    email: formData.email,
                    password: formData.password,
                    sendEmail: true,
                });
                alert('Invitation email sentttt successfully!');
            }

            window.location.reload(); // Reload the page after successful creation or update
        } catch (err: any) {
            setError('Failed to save company or send email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            code: '',
            name: '',
            address: '',
            email: '',
            phone: '',
            pfCode: '',
            esiCode: '',
            labourLicense: '',
            domainName: '',
            contactPerson: '',
            website: '',
            superAdminId: '',
            password: '',
            logo: null,
            inviteAdmin: false,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-md max-h-[90vh] overflow-auto">
                <div className="p-2 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h1 className="text-lg font-bold text-gray-900">Company General Information</h1>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {/* Left Column */}
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Code:</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Code"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Address:</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Address"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Email"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Phone:</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Phone"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">PF Code:</label>
                                <input
                                    type="text"
                                    name="pfCode"
                                    value={formData.pfCode}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="PF Code"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">ESI Code:</label>
                                <input
                                    type="text"
                                    name="esiCode"
                                    value={formData.esiCode}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="ESI Code"
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Labour License:</label>
                                <input
                                    type="text"
                                    name="labourLicense"
                                    value={formData.labourLicense}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Labour License"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Domain Name:</label>
                                <input
                                    type="text"
                                    name="domainName"
                                    value={formData.domainName}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Domain Name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Contact Person:</label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Contact Person"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Website:</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Website"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Super Admin ID:</label>
                                <input
                                    type="text"
                                    name="superAdminId"
                                    value={formData.superAdminId}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Super Admin ID"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Password:</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Password"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">Upload Logo:</label>
                                <input
                                    type="file"
                                    name="logo"
                                    onChange={handleFileChange}
                                    className="w-full text-xs"
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="inviteAdmin"
                                checked={formData.inviteAdmin}
                                onChange={handleInputChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-700">Invite Admin</span>
                        </label>
                    </div>

                    {error && (
                        <div className="mt-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="mt-3 flex gap-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {company ? (isSubmitting ? 'Updating...' : 'Update') : (isSubmitting ? 'Saving...' : 'Save')}
                        </button>
                        <button
                            type="button"
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Save & New
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Delete
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}