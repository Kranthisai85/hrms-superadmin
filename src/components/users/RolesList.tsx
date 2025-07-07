import React, { useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Role, ModulePermission } from '../../types';

const initialRoles: Role[] = [
  { id: '1', name: 'Super Admin', type: 'admin', permissions: {}, createdAt: '2024-03-10', updatedAt: '2024-03-10' },
  { id: '2', name: 'Company Admin', type: 'admin', permissions: {}, createdAt: '2024-03-10', updatedAt: '2024-03-10' },
  { id: '3', name: 'Manager', type: 'manager', permissions: {}, createdAt: '2024-03-10', updatedAt: '2024-03-10' },
  { id: '4', name: 'Employee', type: 'employee', permissions: {}, createdAt: '2024-03-10', updatedAt: '2024-03-10' },
];

const mainNavigation = [
  'Home',
  'Masters',
  'User Roles',
  'Hiring',
  'Employee',
  'Attendance',
  'Payroll',
  'Reports',
  'Assets',
  "Comm's",
  'Utilities'
];

const mastersNavigation = [
  'Enterprise',
  'Company',
  'Branch',
  'Department',
  'Designation',
  'SubDepartment',
  'Grade',
  'EmploymentType',
  'EmploymentStatus'
];

export default function RolesList() {
  const [roles, setRoles] = useState(initialRoles);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    type: 'custom',
    permissions: {}
  });

  const handleSelectAllForPage = (page: string) => {
    setNewRole((prev) => {
      const currentPermissions = prev.permissions || {};
      const currentAll = currentPermissions[page]?.all || false;
      return {
        ...prev,
        permissions: {
          ...currentPermissions,
          [page]: {
            all: !currentAll,
            create: !currentAll,
            view: !currentAll,
            edit: !currentAll,
            delete: !currentAll
          }
        }
      };
    });
  };

  const handleTogglePermission = (page: string, action: keyof ModulePermission) => {
    setNewRole((prev) => {
      const currentPermissions = prev.permissions || {};
      const updatedPermissions = {
        ...currentPermissions,
        [page]: {
          ...currentPermissions[page],
          // [action]: !currentPermissions[page]?.[action]
        }
      };

      // updatedPermissions[page].all = ['create', 'view', 'edit', 'delete'].every(
      //   (a) => updatedPermissions[page][a as keyof ModulePermission]
      // );

      return {
        ...prev,
        permissions: updatedPermissions
      };
    });
  };

  const toggleModule = (moduleName: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((name) => name !== moduleName)
        : [...prev, moduleName]
    );
  };

  const handleSave = () => {
    if (editingRole) {
      setRoles(
        roles.map((role) =>
          role.id === editingRole.id
            ? { ...editingRole, ...newRole, updatedAt: new Date().toISOString() }
            : role
        )
      );
    } else {
      const role: Role = {
        id: (roles.length + 1).toString(),
        name: newRole.name || '',
        type: newRole.type || 'custom',
        permissions: newRole.permissions || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setRoles([...roles, role]);
    }
    setShowModal(false);
    setNewRole({ name: '', type: 'custom', permissions: {} });
    setEditingRole(null);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setNewRole(role);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setRoles(roles.filter((role) => role.id !== id));
  };

  const currentRoles = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return roles.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, roles, itemsPerPage]);

  const totalPages = Math.ceil(roles.length / itemsPerPage);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage user roles and permissions</p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setShowModal(true);
          }}
          className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Role
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRoles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{role.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{role.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 capitalize">{role.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(role)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentRoles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Shield className="w-8 h-8 mb-2" />
                      <p>No roles found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, roles.length)}
                  </span>{' '}
                  of <span className="font-medium">{roles.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRole ? 'Edit Role' : 'Add New Role'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingRole(null); }}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Type
                  </label>
                  <select
                    value={newRole.type}
                    onChange={(e) => setNewRole({ ...newRole, type: e.target.value as Role['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="text-sm font-medium text-gray-900">Module Permissions</h3>
                </div>

                <div className="divide-y divide-gray-200">
                  {mainNavigation.map((module) => (
                    <div key={module} className="bg-white">
                      <div className="grid grid-cols-6 gap-4 px-4 py-3 items-center">
                        <div className="col-span-2 flex items-center gap-2">
                          {module === 'Masters' && (
                            <button
                              onClick={() => toggleModule(module)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {expandedModules.includes(module) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <span className="text-sm font-medium">{module}</span>
                        </div>
                        <div className="text-center">
                          <input
                            type="checkbox"
                            checked={newRole.permissions?.[module]?.all || false}
                            onChange={() => handleSelectAllForPage(module)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="text-center">
                          <input
                            type="checkbox"
                            checked={newRole.permissions?.[module]?.create || false}
                            onChange={() => handleTogglePermission(module, 'create')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="text-center">
                          <input
                            type="checkbox"
                            checked={newRole.permissions?.[module]?.view || false}
                            onChange={() => handleTogglePermission(module, 'view')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="text-center">
                          <input
                            type="checkbox"
                            checked={newRole.permissions?.[module]?.edit || false}
                            onChange={() => handleTogglePermission(module, 'edit')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {module === 'Masters' && expandedModules.includes(module) && (
                        <div className="bg-gray-50 border-t">
                          {mastersNavigation.map((subModule) => (
                            <div key={subModule} className="grid grid-cols-6 gap-4 px-4 py-3 items-center pl-8">
                              <div className="col-span-2">
                                <span className="text-sm">{subModule}</span>
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={newRole.permissions?.[subModule]?.all || false}
                                  onChange={() => handleSelectAllForPage(subModule)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={newRole.permissions?.[subModule]?.create || false}
                                  onChange={() => handleTogglePermission(subModule, 'create')}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={newRole.permissions?.[subModule]?.view || false}
                                  onChange={() => handleTogglePermission(subModule, 'view')}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={newRole.permissions?.[subModule]?.edit || false}
                                  onChange={() => handleTogglePermission(subModule, 'edit')}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => { setShowModal(false); setEditingRole(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingRole ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}