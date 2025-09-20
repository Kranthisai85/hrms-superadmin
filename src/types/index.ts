export interface Company {
  id: string;
  code: string;
  name: string;
  address: string;
  // Note: These fields are now stored in different tables
  email: string;              // From employees.email
  phone: string;              // From employees.phone  
  contact_person: string;     // From employees.first_name
  password: string;           // From users.password (admin)
  // Company-specific fields
  pf_code: string;
  esi_code: string;
  labour_license: string;
  domain_name: string;
  website: string;
  super_admin_id: string;
  logo: string;
  edition: string;
  created_at: string;
  // Additional fields
  invite_admin: number;
  pan_no: string;
  tan_no: string;
  company_type: string;
  sector: string;
  employee_id?: string;       // Optional employee ID
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