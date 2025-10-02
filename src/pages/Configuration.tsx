import React, { useState, useEffect } from 'react';
import { Settings, Plus, CreditCard as Edit2, Trash2, Users, Package, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CatalogItem {
  id: string;
  name: string;
  category: 'parts' | 'supplies' | 'tools' | 'fuel' | 'other';
  default_unit: string;
  default_min_quantity: number;
  default_max_quantity: number;
  description: string | null;
  is_active: boolean;
}

interface UserRole {
  id: string;
  name: string;
  description: string | null;
  permissions: {
    dashboard: boolean;
    buses: boolean;
    passengers: boolean;
    inventory: boolean;
    expenses: boolean;
    reports: boolean;
    configuration: boolean;
  };
}

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface RoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  user?: User;
  role?: UserRole;
}

const Configuration: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'users'>('catalog');
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const [catalogFormData, setCatalogFormData] = useState({
    name: '',
    category: 'parts' as CatalogItem['category'],
    default_unit: 'pieces',
    default_min_quantity: 10,
    default_max_quantity: 1000,
    description: '',
    is_active: true
  });

  const [assignRoleId, setAssignRoleId] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: {
      dashboard: true,
      buses: true,
      passengers: true,
      inventory: true,
      expenses: true,
      reports: true,
      configuration: false,
      tracking: true,
      hr: false
    }
  });

  const categoryNames = {
    parts: 'Repuestos',
    supplies: 'Suministros',
    tools: 'Herramientas',
    fuel: 'Combustible',
    other: 'Otros'
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadCatalogItems(),
      loadRoles(),
      loadUsers(),
      loadRoleAssignments()
    ]);
    setLoading(false);
  };

  const loadCatalogItems = async () => {
    try {
      const { data, error } = await supabase
        .from('item_catalog')
        .select('*')
        .order('name');

      if (error) throw error;
      setCatalogItems(data || []);
    } catch (error) {
      console.error('Error loading catalog:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error loading users');

      const { users: allUsers } = await response.json();

      if (allUsers) {
        const userList: User[] = allUsers.map((u: any) => ({
          id: u.id,
          email: u.email || '',
          created_at: u.created_at
        }));
        setUsers(userList);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadRoleAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setRoleAssignments(data || []);
    } catch (error) {
      console.error('Error loading role assignments:', error);
    }
  };

  const handleCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (selectedCatalogItem) {
        const { error } = await supabase
          .from('item_catalog')
          .update({
            ...catalogFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedCatalogItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('item_catalog')
          .insert([catalogFormData]);

        if (error) throw error;
      }

      setShowCatalogModal(false);
      setSelectedCatalogItem(null);
      resetCatalogForm();
      loadCatalogItems();
    } catch (error) {
      console.error('Error saving catalog item:', error);
      alert('Error al guardar el artículo del catálogo');
    }
  };

  const handleDeleteCatalogItem = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este artículo del catálogo?')) return;

    try {
      const { error } = await supabase
        .from('item_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCatalogItems();
    } catch (error) {
      console.error('Error deleting catalog item:', error);
      alert('Error al eliminar el artículo');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newUserEmail || !newUserPassword) return;

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword
      });

      if (signUpError) throw signUpError;

      if (signUpData.user && assignRoleId) {
        const { error: assignError } = await supabase
          .from('user_role_assignments')
          .insert([{
            user_id: signUpData.user.id,
            role_id: assignRoleId,
            assigned_by: user.id
          }]);

        if (assignError) throw assignError;
      }

      setShowUserModal(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setAssignRoleId('');
      await loadData();
      alert('Usuario creado exitosamente');
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Error al crear el usuario: ' + error.message);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (selectedRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({
            name: roleFormData.name,
            description: roleFormData.description,
            permissions: roleFormData.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRole.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert([{
            name: roleFormData.name,
            description: roleFormData.description,
            permissions: roleFormData.permissions
          }]);

        if (error) throw error;
      }

      setShowRoleModal(false);
      setSelectedRole(null);
      resetRoleForm();
      loadRoles();
      alert(selectedRole ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente');
    } catch (error: any) {
      console.error('Error saving role:', error);
      alert('Error al guardar el rol: ' + error.message);
    }
  };

  const handleRemoveRoleAssignment = async (assignmentId: string) => {
    if (!confirm('¿Está seguro de remover esta asignación de rol?')) return;

    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      loadRoleAssignments();
    } catch (error) {
      console.error('Error removing role assignment:', error);
      alert('Error al remover la asignación');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('¿Está seguro de eliminar este rol? Esto eliminará todas las asignaciones asociadas.')) return;

    try {
      const { error: assignmentsError } = await supabase
        .from('user_role_assignments')
        .delete()
        .eq('role_id', roleId);

      if (assignmentsError) throw assignmentsError;

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      await loadData();
      alert('Rol eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting role:', error);
      alert('Error al eliminar el rol: ' + error.message);
    }
  };

  const resetCatalogForm = () => {
    setCatalogFormData({
      name: '',
      category: 'parts',
      default_unit: 'pieces',
      default_min_quantity: 10,
      default_max_quantity: 1000,
      description: '',
      is_active: true
    });
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: {
        dashboard: true,
        buses: true,
        passengers: true,
        inventory: true,
        expenses: true,
        reports: true,
        configuration: false,
        tracking: true,
        hr: false
      }
    });
  };

  const openEditCatalogModal = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setCatalogFormData({
      name: item.name,
      category: item.category,
      default_unit: item.default_unit,
      default_min_quantity: item.default_min_quantity,
      default_max_quantity: item.default_max_quantity,
      description: item.description || '',
      is_active: item.is_active
    });
    setShowCatalogModal(true);
  };

  const getUserRoles = (userId: string) => {
    return roleAssignments
      .filter(assignment => assignment.user_id === userId)
      .map(assignment => roles.find(role => role.id === assignment.role_id))
      .filter(role => role !== undefined) as UserRole[];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'catalog'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Catálogo de Artículos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Artículos del Catálogo</h2>
                <button
                  onClick={() => {
                    setSelectedCatalogItem(null);
                    resetCatalogForm();
                    setShowCatalogModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Agregar Artículo
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad Mín/Máx
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {catalogItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500">{item.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {categoryNames[item.category]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.default_unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.default_min_quantity} / {item.default_max_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditCatalogModal(item)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCatalogItem(item.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Usuarios</h2>
                <button
                  onClick={() => {
                    setNewUserEmail('');
                    setNewUserPassword('');
                    setAssignRoleId('');
                    setShowUserModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Crear Usuario
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Creación
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((usr) => {
                      const userRoles = getUserRoles(usr.id);
                      const userAssignments = roleAssignments.filter(a => a.user_id === usr.id);

                      return (
                        <tr key={usr.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{usr.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {userRoles.map((role) => (
                                <span
                                  key={role.id}
                                  className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                                >
                                  {role.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(usr.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {userAssignments.map((assignment) => (
                                <button
                                  key={assignment.id}
                                  onClick={() => handleRemoveRoleAssignment(assignment.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Remover rol"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Roles Disponibles</h2>
                  <button
                    onClick={() => {
                      setSelectedRole(null);
                      resetRoleForm();
                      setShowRoleModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Crear Rol
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRole(role);
                            setRoleFormData({
                              name: role.name,
                              description: role.description || '',
                              permissions: role.permissions
                            });
                            setShowRoleModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar rol"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar rol"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Permisos:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(role.permissions).map(([module, allowed]) => (
                          allowed && (
                            <span
                              key={module}
                              className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded"
                            >
                              {module}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCatalogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedCatalogItem ? 'Editar Artículo' : 'Agregar Artículo al Catálogo'}
              </h2>
              <form onSubmit={handleCatalogSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={catalogFormData.name}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={catalogFormData.category}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, category: e.target.value as CatalogItem['category'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {Object.entries(categoryNames).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad por Defecto
                    </label>
                    <input
                      type="text"
                      value={catalogFormData.default_unit}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, default_unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Mínima por Defecto
                    </label>
                    <input
                      type="number"
                      value={catalogFormData.default_min_quantity}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, default_min_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Máxima por Defecto
                    </label>
                    <input
                      type="number"
                      value={catalogFormData.default_max_quantity}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, default_max_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mt-8">
                      <input
                        type="checkbox"
                        checked={catalogFormData.is_active}
                        onChange={(e) => setCatalogFormData({ ...catalogFormData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Activo</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={catalogFormData.description}
                    onChange={(e) => setCatalogFormData({ ...catalogFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCatalogModal(false);
                      setSelectedCatalogItem(null);
                      resetCatalogForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {selectedCatalogItem ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Crear Nuevo Usuario</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignar Rol
                  </label>
                  <select
                    value={assignRoleId}
                    onChange={(e) => setAssignRoleId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar rol...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false);
                      setNewUserEmail('');
                      setNewUserPassword('');
                      setAssignRoleId('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Crear Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
              </h2>
              <form onSubmit={handleSaveRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Rol
                  </label>
                  <input
                    type="text"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permisos de Módulos
                  </label>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {Object.entries(roleFormData.permissions).map(([module, allowed]) => (
                      <label key={module} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowed}
                          onChange={(e) => setRoleFormData({
                            ...roleFormData,
                            permissions: {
                              ...roleFormData.permissions,
                              [module]: e.target.checked
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">{module}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedRole(null);
                      resetRoleForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {selectedRole ? 'Actualizar Rol' : 'Crear Rol'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuration;
