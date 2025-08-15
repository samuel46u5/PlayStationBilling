import React, { useState } from "react";
import {
  Plus,
  Search,
  User,
  Shield,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { db } from "../lib/supabase";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "users" | "roles" | "sessions" | "logs"
  >("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null); // Untuk modal edit user

  // State for users, roles, sessions, logs
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  // Fetch all data from Supabase on mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await db.select("users");
        setUsers(data || []);
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const data = await db.select("roles");
        setRoles(data || []);
      } catch {
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };
    // const fetchSessions = async () => {
    //   setLoadingSessions(true);
    //   try {
    //     const data = await db.select("sessions");
    //     setSessions(data || []);
    //   } catch {
    //     setSessions([]);
    //   } finally {
    //     setLoadingSessions(false);
    //   }
    // };
    // const fetchLogs = async () => {
    //   setLoadingLogs(true);
    //   try {
    //     const data = await db.select("logs");
    //     setLogs(data || []);
    //   } catch {
    //     setLogs([]);
    //   } finally {
    //     setLoadingLogs(false);
    //   }
    // };
    fetchUsers();
    fetchRoles();
    // fetchSessions();
    // fetchLogs();
  }, []);

  const getSessionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "terminated":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderSessionsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
        <p className="text-gray-600">Monitor user login sessions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingSessions ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    Memuat sesi login...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    Tidak ada sesi aktif.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => {
                  const user = users.find((u) => u.id === session.userId);
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user?.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user?.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(session.loginTime).toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.ipAddress}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSessionStatusColor(
                            session.status
                          )}`}
                        >
                          {session.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-red-600 hover:text-red-900">
                          Terminate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
        <p className="text-gray-600">
          Monitor user activities and system events
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {loadingLogs ? (
            <div className="text-center text-gray-500 py-8">
              Memuat log aktivitas...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Tidak ada log aktivitas.
            </div>
          ) : (
            logs.map((log) => {
              const user = users.find((u) => u.id === log.userId);
              return (
                <div
                  key={log.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {log.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>User: {user?.fullName}</span>
                          <span>Module: {log.module}</span>
                          <span>IP: {log.ipAddress}</span>
                        </div>
                        {log.metadata && (
                          <div className="mt-2 text-sm text-gray-500">
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // Helper: filter users by search, role, status
  const filteredUsers = () => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole =
        selectedRole === "all" || user.role_id === selectedRole;
      const matchesStatus =
        selectedStatus === "all" || user.status === selectedStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          User & Role Management
        </h1>
        <p className="text-gray-600">Kelola pengguna, role, dan akses sistem</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "users", label: "Users", icon: User },
              { id: "roles", label: "Roles", icon: Shield },
              { id: "sessions", label: "Sessions", icon: Clock },
              { id: "logs", label: "Activity Logs", icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Users</h2>
              <p className="text-gray-600">Daftar seluruh pengguna sistem</p>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Cari nama, username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="all">Semua Role</option>
                {roles.map((role: any) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <select
                className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                onClick={() => setShowAddUserForm(true)}
              >
                <Plus className="h-4 w-4" /> Tambah User
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mt-4">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-8">
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : filteredUsers().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-8">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers().map((user: any) => {
                    const role = roles.find((r: any) => r.id === user.role_id);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {user.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          @{user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {user?.role_id || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {user.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            className="text-blue-600 hover:underline mr-3"
                            onClick={() => setEditUser(user)}
                          >
                            Edit
                          </button>
                          <button className="text-red-600 hover:underline">
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="text-center text-gray-500 py-8">
          (TODO: Implement Roles tab)
        </div>
      )}
      {activeTab === "sessions" && renderSessionsTab()}
      {activeTab === "logs" && renderLogsTab()}

      {/* Add User Modal */}
      {showAddUserForm && (
        <AddUserModal
          roles={roles}
          onClose={() => setShowAddUserForm(false)}
          onUserAdded={() => {
            setShowAddUserForm(false);
            (async () => {
              setLoadingUsers(true);
              try {
                const data = await db.select("users");
                setUsers(data || []);
              } catch {
                setUsers([]);
              } finally {
                setLoadingUsers(false);
              }
            })();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          roles={roles}
          onClose={() => setEditUser(null)}
          onUserUpdated={async () => {
            setEditUser(null);
            setLoadingUsers(true);
            try {
              const data = await db.select("users");
              setUsers(data || []);
            } catch {
              setUsers([]);
            } finally {
              setLoadingUsers(false);
            }
          }}
        />
      )}

      {/* Add Role Modal */}
      {showAddRoleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tambah Role Baru
              </h2>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter role name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the role"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4">
                    <div className="space-y-2">
                      {(roles[0]?.permissions || []).map((permission: any) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-2"
                        >
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">
                            {permission.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </form>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddRoleForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Create Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {users.length}
          </h3>
          <p className="text-gray-600 text-sm">Total Users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {users.filter((u) => u.status === "active").length}
          </h3>
          <p className="text-gray-600 text-sm">Active Users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {roles.length}
          </h3>
          <p className="text-gray-600 text-sm">Total Roles</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {sessions.filter((s) => s.status === "active").length}
          </h3>
          <p className="text-gray-600 text-sm">Active Sessions</p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

interface AddUserModalProps {
  roles: any[];
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  roles,
  onClose,
  onUserAdded,
}) => {
  const [fullName, setFullName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [roleId, setRoleId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !username || !email || !roleId || !password) {
      setError("Semua field wajib diisi!");
      return;
    }

    setLoading(true);

    try {
      // 1. Buat user di auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Failed to create auth user");
      }

      // 2. Insert user ke database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          username,
          full_name: fullName,
          email,
          phone: phone || null,
          role_id: roleId,
          status: "active",
        })
        .select()
        .single();

      if (userError) {
        // Rollback: delete auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Database error: ${userError.message}`);
      } else {
        await Swal.fire({
          icon: "success",
          title: "User berhasil ditambahkan",
          text: `User ${fullName} telah berhasil ditambahkan ke sistem.`,
        });
        onUserAdded();
      }
    } catch (err: any) {
      setError(err.message || "Gagal menambah user.");
      console.error("User insert error:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal menambah user",
        text: err.message || "Terjadi kesalahan saat menambahkan user baru.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tambah User Baru
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+62 8xx-xxxx-xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                disabled={loading}
              >
                <option value="">Select role</option>
                {roles
                  .filter((r: any) => !r.isSystem)
                  .map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- EditUserModal interface & component ---
interface EditUserModalProps {
  user: any;
  roles: any[];
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  roles,
  onClose,
  onUserUpdated,
}) => {
  const [fullName, setFullName] = React.useState(user.full_name || "");
  const [username, setUsername] = React.useState(user.username || "");
  const [email, setEmail] = React.useState(user.email || "");
  const [phone, setPhone] = React.useState(user.phone || "");
  const [roleId, setRoleId] = React.useState(user.role_id || "");
  const [status, setStatus] = React.useState(user.status || "active");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName || !username || !email || !roleId) {
      setError("Semua field wajib diisi!");
      return;
    }
    setLoading(true);
    try {
      // Update user di table users
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          username,
          email,
          phone: phone || null,
          role_id: roleId,
          status,
        })
        .eq("id", user.id);
      if (updateError) {
        throw new Error(updateError.message);
      }
      await Swal.fire({
        icon: "success",
        title: "User berhasil diupdate",
        text: `User ${fullName} telah diperbarui.`,
      });
      onUserUpdated();
    } catch (err: any) {
      setError(err.message || "Gagal mengupdate user.");
      Swal.fire({
        icon: "error",
        title: "Gagal mengupdate user",
        text: err.message || "Terjadi kesalahan saat update user.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Edit User
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                disabled={loading}
              >
                <option value="">Select role</option>
                {roles
                  .filter((r: any) => !r.isSystem)
                  .map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Update User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
// Fallback uuid v4 generator for browsers that do not support crypto.randomUUID
function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Polyfill: generates a RFC4122 version 4 UUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
