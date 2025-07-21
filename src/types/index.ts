export interface Company {
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
  edition: string;
  created_at: string;
  // Add missing fields for CreateCompany compatibility
  invite_admin: number;
  pan_no: string;
  tan_no: string;
  company_type: string;
  sector: string;
}

export interface User {
  email: string;
  password: string;
}

export type PageType = 'home' | 'companies' | 'create' | 'users' | 'roles';

export interface Permission {
  all: boolean;
  create: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ModulePermission extends Permission {
  name: string;
  subModules?: ModulePermission[];
}

export interface Role {
  id: string;
  name: string;
  type: 'admin' | 'manager' | 'employee' | 'custom';
  permissions: {
    [key: string]: Permission;
  };
  createdAt: string;
  updatedAt: string;
}