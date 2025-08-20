import React, { useState, useEffect } from 'react';
import { simpleAuth, type User } from '../services/simpleAuth';
import { useAuth } from '../contexts/AuthContext';

interface UserData {
  email: string;
  password: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
}

const SimpleUserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<UserData>({
    email: '',
    password: '',
    name: '',
    role: 'user'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const userList = await simpleAuth.getAllUsers();
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await simpleAuth.createUser(formData);
      
      setSuccess('Usuario creado exitosamente');
      setShowCreateForm(false);
      setFormData({ email: '', password: '', name: '', role: 'user' });
      
      // Recargar usuarios
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Error creando usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userEmail}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await simpleAuth.deleteUser(userId);
      setSuccess('Usuario eliminado correctamente');
      
      // Recargar usuarios
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Error eliminando usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
    setError('');
    setSuccess('');
  };

  const generateSecurePassword = () => {
    const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    
    // Asegurar al menos una mayúscula, una minúscula, un número y un símbolo
    password += 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)];
    password += 'abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random() * 24)];
    password += '23456789'[Math.floor(Math.random() * 8)];
    password += '!@#$%&*'[Math.floor(Math.random() * 7)];
    
    // Completar con caracteres aleatorios hasta 12 caracteres
    for (let i = 4; i < 12; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword();
    setNewPassword(generated);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !newPassword.trim()) {
      setError('La contraseña es obligatoria');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await simpleAuth.changePassword(selectedUser.id, newPassword);
      
      setSuccess(`✅ Contraseña actualizada para ${selectedUser.email}: "${newPassword}"`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Error cambiando contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario actual es superadmin
  if (!currentUser || !simpleAuth.canManageUsers()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-red-800 font-medium text-lg mb-2">Acceso Denegado</h3>
          <p className="text-red-700">No tienes permisos para gestionar usuarios.</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h2>
            <p className="text-gray-600 mt-1">Administra los usuarios del sistema SENPA</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Volver
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {showCreateForm ? 'Cancelar' : '+ Crear Usuario'}
            </button>
          </div>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800 font-medium">✅ {success}</p>
          </div>
        )}

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="usuario@senpa.gov.do"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre y apellido"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'superadmin' | 'admin' | 'user' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Usuario (solo lectura)</option>
                    <option value="admin">Administrador (acceso completo)</option>
                    <option value="superadmin">Superadministrador (gestión usuarios)</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Usuarios del Sistema</h3>
            <p className="text-sm text-gray-600 mt-1">Total: {users.length} usuarios</p>
          </div>
          
          {loading && users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'superadmin' 
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'superadmin' ? '👑 Superadmin' : user.role === 'admin' ? '🔑 Administrador' : '👤 Usuario'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleChangePassword(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50"
                        disabled={loading}
                        title="Cambiar contraseña"
                      >
                        🔑 Cambiar
                      </button>
                      
                      {user.id !== currentUser.id ? (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-300 rounded-md hover:bg-red-50"
                          disabled={loading}
                        >
                          Eliminar
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm px-3 py-1 bg-gray-100 rounded-md">
                          (Tú)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-blue-800 font-medium mb-2">ℹ️ Información</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Solo los superadministradores pueden gestionar usuarios</li>
            <li>• Los usuarios pueden acceder al dashboard con permisos de lectura</li>
            <li>• Los administradores tienen acceso completo excepto gestión de usuarios</li>
            <li>• Los superadministradores tienen acceso total incluyendo gestión de usuarios</li>
            <li>• No puedes eliminar tu propia cuenta</li>
            <li>• Puedes cambiar la contraseña de cualquier usuario</li>
          </ul>
        </div>
      </div>

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cambiar Contraseña
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Usuario: <strong>{selectedUser.name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Email: <strong>{selectedUser.email}</strong>
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                      title="Generar contraseña segura"
                    >
                      🎲 Generar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Usa el botón "Generar" para crear una contraseña segura automáticamente
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading || !newPassword.trim()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
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

export default SimpleUserManagement;