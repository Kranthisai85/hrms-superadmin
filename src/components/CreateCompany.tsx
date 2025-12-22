import axios from "axios";
import { X, Eye, EyeOff } from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL, LOGO_UPLOAD_URL, EMAIL_SEND_URL } from "../config";

interface CompanyFormData {
  code: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  pf_code: string;
  esi_code: string;
  labour_license: string;
  domain_name: string;
  contact_person: string;
  website: string;
  super_admin_id: string;
  password: string;
  logo: File | null;
  invite_admin: boolean;
  pan_no: string; // Added
  tan_no: string; // Added
  company_type: string; // Added
  sector: string; // Added
  service_commences_on: string; // Added
  /* --- ADD THESE THREE LINES --- */
  module_employee: boolean;
  module_attendance: boolean;
  module_payroll: boolean;
  module_reports: boolean;
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
    pf_code: string;
    esi_code: string;
    labour_license: string;
    domain_name: string;
    contact_person: string;
    website: string;
    super_admin_id: string;
    password: string;
    logo: string;
    invite_admin: boolean; // Added
    pan_no: string; // Added
    tan_no: string; // Added
    company_type: string; // Added
    sector: string; // Added
    service_commences_on: string; // Added
    /* --- ADD THESE FOUR LINES --- */
    module_employee: boolean | number;
    module_attendance: boolean | number;
    module_payroll: boolean | number;
    module_reports: boolean | number;
  } | null; // Optional company for updating
  onCompanyUpdated?: (updatedCompany: any) => void; // Add this line
}

export default function CreateCompany({
  onClose,
  company,
  onCompanyUpdated,
}: CreateCompanyProps): JSX.Element {
  const [formData, setFormData] = useState<CompanyFormData>({
    code: "",
    name: "",
    address: "",
    email: "",
    phone: "",
    pf_code: "",
    esi_code: "",
    labour_license: "",
    domain_name: "",
    contact_person: "",
    website: "",
    super_admin_id: "",
    password: "",
    logo: null,
    invite_admin: false,
    pan_no: "", // Added
    tan_no: "", // Added
    company_type: "", // Added
    sector: "", // Added
    service_commences_on: "", // Added
    module_employee: true, // Default: enabled
    module_attendance: false, // Default: disabled
    module_payroll: false, // Default: disabled
    module_reports: false, // Default: disabled
  });
  // Add logoPreview state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Helper function to safely convert database values to boolean
  const toBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      return value === "1" || value.toLowerCase() === "true";
    }
    return false;
  };

  useEffect(() => {
    if (company) {
      setFormData({
        code: company.code || "",
        name: company.name || "",
        address: company.address || "",
        email: company.email || "",
        phone: company.phone || "",
        pf_code: company.pf_code || "",
        esi_code: company.esi_code || "",
        labour_license: company.labour_license || "",
        domain_name: company.domain_name || "",
        contact_person: company.contact_person || "",
        website: company.website || "",
        super_admin_id: company.super_admin_id || "",
        password: company.password || "",
        logo: null, // Always null initially
        invite_admin: toBoolean(company.invite_admin),
        pan_no: company.pan_no || "",
        tan_no: company.tan_no || "",
        company_type: company.company_type || "",
        sector: company.sector || "",
        service_commences_on: company.service_commences_on || "",
        module_employee: toBoolean(company.module_employee),
        module_attendance: toBoolean(company.module_attendance),
        module_payroll: toBoolean(company.module_payroll),
        module_reports: toBoolean(company.module_reports),
      });
      // Set logo preview to existing logo if present
      setLogoPreview(company.logo ? company.logo : null);
    } else {
      setLogoPreview(null);
    }
  }, [
    company?.id,
    company?.module_employee,
    company?.module_attendance,
    company?.module_payroll,
    company?.module_reports,
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Separate useEffect to monitor formData changes for modules
  useEffect(() => {
    console.log("formData modules changed:", {
      module_employee: formData.module_employee,
      module_attendance: formData.module_attendance,
      module_payroll: formData.module_payroll,
      module_reports: formData.module_reports,
    });
  }, [
    formData.module_employee,
    formData.module_attendance,
    formData.module_payroll,
    formData.module_reports,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        logo: file,
      }));
      // Show preview
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (logo: File): Promise<string | null> => {
    const logoFormData = new FormData();
    logoFormData.append("file", logo);

    try {
      const response = await axios.post(LOGO_UPLOAD_URL, logoFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.fileUrl;
    } catch (err: any) {
      setError("Failed to upload logo. Please try again.");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // PAN/TAN validation
    const panRegex = /^[A-Za-z0-9]{10}$/;
    if (!formData.pan_no || !panRegex.test(formData.pan_no)) {
      setError("Company PAN No must be 10 alphanumeric characters.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.tan_no || !panRegex.test(formData.tan_no)) {
      setError("Company TAN No must be 10 alphanumeric characters.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.company_type) {
      setError("Company Type is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.sector) {
      setError("Sector is required.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.code) {
      setError("Code is required.");
      setIsSubmitting(false);
      return;
    }

    // Website URL validation (optional field - only validate if filled)
    if (formData.website && formData.website.trim() !== "") {
      // Allow: http://, https://, www., or plain domain names
      const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+(\/.*)?$/i;
      if (!urlRegex.test(formData.website.trim())) {
        setError("Please enter a valid website URL (e.g., www.example.com, https://example.com, or example.com)");
        setIsSubmitting(false);
        return;
      }
    }

    let logoUrl = null;
    // If a new logo is uploaded, upload it
    if (formData.logo) {
      logoUrl = await uploadLogo(formData.logo);
      if (!logoUrl) {
        setIsSubmitting(false);
        return;
      }
    } else if (company && company.logo) {
      // If editing and no new logo, keep the existing logo
      logoUrl = company.logo;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "logo") {
        formDataToSend.append("logo", logoUrl || "");
      } else if (key === "invite_admin") {
        formDataToSend.append("invite_admin", value ? "1" : "0");
      } else if (
        key === "module_employee" ||
        key === "module_attendance" ||
        key === "module_payroll" ||
        key === "module_reports"
      ) {
        const boolValue = value ? "1" : "0";
        formDataToSend.append(key, boolValue);
        console.log(
          `Appending ${key}: ${value} (boolean) -> ${boolValue} (string)`
        );
      } else if (value !== null && value !== undefined) {
        formDataToSend.append(key, value as string); // Added 'as string' to match your original
      }
    });

    try {
      let response;
      if (company) {
        // Update company if `company` prop is provided
        // Convert FormData to plain object for JSON
        const plainData: any = {};
        formDataToSend.forEach((v, k) => {
          plainData[k] = v;
        });
        console.log("Sending update request with data:", plainData);
        response = await axios.put(
          `${API_BASE_URL}/companies/${company.id}`,
          plainData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Update response:", response.data);
        alert("Company updated successfully!");
        if (onCompanyUpdated) {
          onCompanyUpdated(response.data.company || response.data); // Call callback with updated company
        }
        localStorage.setItem(
          "companyData",
          JSON.stringify(response.data.company || response.data)
        );
      } else {
        // Create a new company
        response = await axios.post(
          `${API_BASE_URL}/companies`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        alert("Company created successfully!");
      }

      // Send email if `inviteAdmin` is checked
      if (formData.invite_admin) {
        await axios.post(EMAIL_SEND_URL, {
          to: formData.email,
          companyName: formData.name,
          subdomain: formData.domain_name,
          email: formData.email,
          password: formData.password,
          sendEmail: true,
        });
        alert("Invitation email sent successfully!");
      }
    } catch (err: any) {
      if (
        axios.isAxiosError(err) &&
        err.response &&
        err.response.data &&
        err.response.data.error
      ) {
        setError(err.response.data.error);
      } else {
        setError("Failed to save company or send email. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      code: "",
      name: "",
      address: "",
      email: "",
      phone: "",
      pf_code: "",
      esi_code: "",
      labour_license: "",
      domain_name: "",
      contact_person: "",
      website: "",
      super_admin_id: "",
      password: "",
      logo: null,
      invite_admin: false,
      pan_no: "", // Added
      tan_no: "", // Added
      company_type: "", // Added
      sector: "", // Added
      service_commences_on: "", // Added
      module_employee: true, // Default: enabled
      module_attendance: false, // Default: disabled
      module_payroll: false, // Default: disabled
      module_reports: false, // Default: disabled
    });
    setLogoPreview(null);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[95vh] flex flex-col">
        <div className="p-2 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h1 className="pl-6 text-2xl font-semibold text-gray-800">
            {company ? `Editing - ${company.name}` : "Create Company"}
          </h1>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form id="company-form" onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {[
                { name: "code", label: "Code", type: "text", required: true },
                { name: "name", label: "Name", type: "text" },
                { name: "address", label: "Address", type: "text" },
                { name: "email", label: "Email", type: "email" },
                { name: "phone", label: "Phone", type: "tel" },
                { name: "pf_code", label: "PF Code", type: "text" },
                { name: "esi_code", label: "ESI Code", type: "text" },
              ].map((field) => (
                <div key={field.name} className="relative">
                  <input
                    type={field.type}
                    name={field.name}
                    value={
                      formData[field.name as keyof CompanyFormData] as string
                    }
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer"
                    placeholder=" "
                    required={field.required}
                  />
                  <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-600 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:bg-white transition-all">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {[
                {
                  name: "labour_license",
                  label: "Labour License",
                  type: "text",
                },
                { name: "domain_name", label: "Domain Name", type: "text" },
                {
                  name: "contact_person",
                  label: "Contact Person",
                  type: "text",
                },
                { name: "website", label: "Website", type: "text" },
                // { name: 'super_admin_id', label: 'Super Admin ID', type: 'text' },
              ].map((field) => (
                <div key={field.name} className="relative">
                  <input
                    type={field.type}
                    name={field.name}
                    value={
                      formData[field.name as keyof CompanyFormData] as string
                    }
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer"
                    placeholder=" "
                  />
                  <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-600 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:bg-white transition-all">
                    {field.label}
                  </label>
                </div>
              ))}

              {/* Password field with eye toggle */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-600 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:bg-white transition-all">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Upload Logo:
                </label>
                <input
                  type="file"
                  name="logo"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                  accept="image/*"
                />
                {/* Logo preview */}
                {logoPreview && (
                  <div className="mt-2">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-20 w-auto rounded border border-gray-200 shadow"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Additional Fields Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PAN No */}
              <div className="relative">
                <input
                  type="text"
                  name="pan_no"
                  value={formData.pan_no}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer"
                  placeholder=" "
                  maxLength={10}
                  required
                />
                <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-600 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:bg-white transition-all">
                  Company PAN No<span className="text-red-500">*</span>
                </label>
              </div>
              {/* TAN No */}
              <div className="relative">
                <input
                  type="text"
                  name="tan_no"
                  value={formData.tan_no}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer"
                  placeholder=" "
                  maxLength={10}
                  required
                />
                <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-600 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:bg-white transition-all">
                  Company TAN No<span className="text-red-500">*</span>
                </label>
              </div>
              {/* Company Type Dropdown */}
              <div className="relative">
                <select
                  name="company_type"
                  value={formData.company_type}
                  onChange={handleSelectChange}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer appearance-none"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="LLP">LLP</option>
                  <option value="Sole Proprietorship">
                    Sole Proprietorship
                  </option>
                </select>
                <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-600 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:bg-white transition-all">
                  Company Type<span className="text-red-500">*</span>
                </label>
              </div>
              {/* Sector Dropdown */}
              <div className="relative">
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleSelectChange}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer appearance-none"
                  required
                >
                  <option value="">Select Sector</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Retail">Retail</option>
                </select>
                <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-600 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:bg-white transition-all">
                  Sector<span className="text-red-500">*</span>
                </label>
              </div>
              {/* Service Commences On */}
              <div className="relative">
                <input
                  type="month"
                  name="service_commences_on"
                  value={formData.service_commences_on}
                  onChange={handleInputChange}
                  // min={new Date().toISOString().slice(0, 7)}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer"
                  required
                />
                <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-600 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:bg-white transition-all">
                  Service Commences On<span className="text-red-500">*</span>
                </label>
              </div>{" "}
              {/* <-- THIS DIV NOW CLOSES CORRECTLY */}
            </div>{" "}
            {/* <-- This closes the "grid" div */}
          </div>{" "}
          {/* <-- This closes the "Additional Information" div */}
          {/* Module Access Control - Available for both Create and Edit */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Module Access Control
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="module_employee"
                  checked={formData.module_employee}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Employee Module</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="module_attendance"
                  checked={formData.module_attendance}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Attendance Module
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="module_payroll"
                  checked={formData.module_payroll}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Payroll Module</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="module_reports"
                  checked={formData.module_reports}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Reports Module</span>
              </label>
            </div>
          </div>
          <div className="mt-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="invite_admin"
                checked={formData.invite_admin}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Invite Admin via Email
              </span>
            </label>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </form>
        
        <div className="p-6 border-t border-gray-200 flex justify-between items-center sticky bottom-0 bg-white z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-all"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {!company?.id && (
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 transition-all"
              >
                Reset Form
              </button>
            )}
            <button
              type="submit"
              form="company-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:bg-blue-400"
            >
              {company?.id
                ? isSubmitting
                  ? "Updating..."
                  : "Update Company"
                : isSubmitting
                ? "Saving..."
                : "Create Company"}
            </button>
            {/* {company?.id && (
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all"
              >
                Delete Company
              </button>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}
