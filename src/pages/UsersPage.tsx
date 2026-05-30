import { useCallback, useEffect, useState } from 'react'
import { 
  Search, 
  Trash2, 
  Shield, 
  RefreshCw, 
  Loader2, 
  X, 
  Check, 
  AlertCircle,
  UserPlus,
  Mail,
  Key,
  Filter
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getUsers, updateUser, deleteUser, createUser } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/context/AuthContext'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'private_user' | 'user'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all')

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editRoles, setEditRoles] = useState<string[]>([])
  const [editUpdating, setEditUpdating] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState(false)

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addFullName, setAddFullName] = useState('')
  const [addUsername, setAddUsername] = useState('')
  const [addIsActive, setAddIsActive] = useState(true)
  const [addIsVerified, setAddIsVerified] = useState(true)
  const [addRoles, setAddRoles] = useState<string[]>(['user'])
  const [addCreating, setAddCreating] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState(false)

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getUsers({ limit: 100 })
      setUsers(res.users)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users list')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Open Edit User modal
  const openEditModal = (user: any) => {
    setSelectedUser(user)
    setEditFullName(user.full_name || '')
    setEditUsername(user.username || '')
    setEditIsActive(user.is_active)
    setEditRoles(user.roles || [])
    setEditError(null)
    setEditSuccess(false)
    setEditModalOpen(true)
  }

  // Toggle role in Edit state
  const handleEditRoleToggle = (roleName: string) => {
    setEditRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    )
  }

  // Submit Edit User form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setEditUpdating(true)
    setEditError(null)
    setEditSuccess(false)
    try {
      await updateUser(selectedUser.id, {
        full_name: editFullName.trim() || undefined,
        username: editUsername.trim() || undefined,
        is_active: editIsActive,
        role_names: editRoles,
      })
      setEditSuccess(true)
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                full_name: editFullName.trim(),
                username: editUsername.trim(),
                is_active: editIsActive,
                roles: editRoles,
              }
            : u
        )
      )
      setTimeout(() => {
        setEditModalOpen(false)
      }, 800)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to save user changes')
    } finally {
      setEditUpdating(false)
    }
  }

  // Toggle role in Add User state
  const handleAddRoleToggle = (roleName: string) => {
    setAddRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    )
  }

  // Submit Add User form
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addEmail.trim() || !addPassword) {
      setAddError('Email and Password are required.')
      return
    }
    setAddCreating(true)
    setAddError(null)
    setAddSuccess(false)
    try {
      await createUser({
        email: addEmail.trim(),
        password: addPassword,
        full_name: addFullName.trim() || undefined,
        username: addUsername.trim() || undefined,
        is_active: addIsActive,
        is_verified: addIsVerified,
        role_names: addRoles,
      })
      setAddSuccess(true)
      // Reset form
      setAddEmail('')
      setAddPassword('')
      setAddFullName('')
      setAddUsername('')
      setAddIsActive(true)
      setAddIsVerified(true)
      setAddRoles(['user'])
      void load() // Reload list
      setTimeout(() => {
        setAddModalOpen(false)
      }, 1000)
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setAddCreating(false)
    }
  }

  // Open Delete confirmation
  const openDeleteConfirm = (user: any) => {
    setUserToDelete(user)
    setDeleteError(null)
    setDeleteConfirmOpen(true)
  }

  // Confirm delete user
  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteUser(userToDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setDeleteConfirmOpen(false)
      setUserToDelete(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete user account')
    } finally {
      setDeleting(false)
    }
  }

  // 1. FILTER OUT CURRENT USER SO LOGGED-IN USER DOES NOT SHOW
  const activeManagedUsers = users.filter(
    (u) => u.id !== currentUser?.id && u.email !== currentUser?.email
  )

  // 2. APPLY SEARCH & FILTERS
  const filtered = activeManagedUsers.filter((u) => {
    // Search text match
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || (
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    )

    // Role filter match
    const matchesRole = filterRole === 'all' || (u.roles || []).includes(filterRole)

    // Status filter match
    const status = u.is_active ? 'active' : 'suspended'
    const matchesStatus = filterStatus === 'all' || status === filterStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  // Get user avatar background color dynamically
  const getAvatarColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colors = [
      'var(--violet-bg)',
      'var(--accent-2)',
      'var(--success-bg)',
      'oklch(70% 0.12 40 / 0.14)',
      'oklch(60% 0.14 200 / 0.1)'
    ]
    const textColors = [
      'var(--violet)',
      'var(--accent-strong)',
      'var(--success)',
      'oklch(45% 0.12 40)',
      'oklch(40% 0.14 200)'
    ]
    const index = hash % colors.length
    return { bg: colors[index], text: textColors[index] }
  }

  return (
    <div className="page fade-in">
      {/* Search & Actions Control Bar */}
      <div className="card card-pad mb-3">
        <div className="row gap-8 flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row gap-8 flex-wrap" style={{ flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
              <input
                type="search"
                className="input"
                style={{ paddingLeft: 32, height: 32 }}
                placeholder="Search other users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={13} className="muted" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Role Filter */}
            <div className="row gap-6">
              <Filter size={12} className="muted" />
              <select 
                className="input" 
                style={{ width: 120, height: 32, fontSize: 12 }}
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value as any)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="private_user">Private User</option>
                <option value="user">Standard User</option>
              </select>
            </div>

            {/* Status Filter */}
            <select 
              className="input" 
              style={{ width: 110, height: 32, fontSize: 12 }}
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="row gap-8">
            <button 
              type="button" 
              className="btn btn-ghost btn-sm" 
              style={{ height: 32 }}
              onClick={() => void load()} 
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              Refresh
            </button>
            <button 
              type="button" 
              className="btn btn-accent btn-sm" 
              style={{ height: 32 }}
              onClick={() => {
                setAddModalOpen(true)
                setAddError(null)
                setAddSuccess(false)
              }}
            >
              <UserPlus size={13} />
              Add User
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card card-pad creds__alert mb-3" role="alert">
          {error}
        </div>
      ) : null}

      {/* Users Count summary banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px 10px', fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>
        <span>Showing other accounts under system administration</span>
        <span>{filtered.length} user{filtered.length === 1 ? '' : 's'} matched</span>
      </div>

      {/* Premium Table View */}
      <div className="table-wrap" style={{ border: '1px solid var(--border)', background: 'var(--bg-elev)', borderRadius: 'var(--radius-lg)' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>User Account</th>
              <th>Status</th>
              <th>System Roles</th>
              <th>Registered on</th>
              <th>Last Activity</th>
              <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty" style={{ padding: '80px 0' }}>
                  <div className="row gap-8" style={{ justifyContent: 'center' }}>
                    <Loader2 size={18} className="spin accent" />
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>Fetching database records…</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty" style={{ padding: '80px 20px', fontSize: 13.5, color: 'var(--text-3)' }}>
                  {activeManagedUsers.length === 0 
                    ? "Your database doesn't have other users yet. Click 'Add User' to register one."
                    : "No users matched your query. Refine your search term or select another filter."
                  }
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const nameStr = u.full_name || u.email
                const avatarTheme = getAvatarColor(nameStr)
                return (
                  <tr key={u.id} className="clickable-row" onClick={() => openEditModal(u)}>
                    <td style={{ paddingLeft: 20, paddingTop: 12, paddingBottom: 12 }}>
                      <div className="row gap-8" style={{ alignItems: 'center' }}>
                        {/* Dynamic Avatar */}
                        <div 
                          className="avatar" 
                          style={{ 
                            background: avatarTheme.bg, 
                            color: avatarTheme.text, 
                            fontWeight: 700, 
                            fontSize: 12.5,
                            border: 'none',
                            width: 32,
                            height: 32
                          }}
                        >
                          {nameStr.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{u.full_name || 'System User'}</span>
                            {u.username && (
                              <span className="mono muted" style={{ fontSize: 10.5, fontWeight: 400, background: 'var(--bg-sunk)', padding: '1px 5px', borderRadius: 4 }}>
                                @{u.username}
                              </span>
                            )}
                          </div>
                          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge
                        label={u.is_active ? 'Active' : 'Suspended'}
                        tone={u.is_active ? 'green' : 'red'}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(u.roles || []).map((role: string) => (
                          <StatusBadge
                            key={role}
                            label={role}
                            tone={role === 'admin' ? 'violet' : role === 'private_user' ? 'blue' : 'gray'}
                          />
                        ))}
                        {(u.roles || []).length === 0 && <span className="muted" style={{ fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>{formatDate(u.created_at)}</td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {u.last_login_at ? formatDate(u.last_login_at) : 'Never active'}
                    </td>
                    <td style={{ paddingRight: 20 }} onClick={(e) => e.stopPropagation()}>
                      <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ height: 28, fontSize: 12 }}
                          onClick={() => openEditModal(u)}
                        >
                          <Shield size={12} />
                          Edit Roles
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--danger)', width: 28, height: 28 }}
                          onClick={() => openDeleteConfirm(u)}
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== MODAL: ADD NEW USER ==================== */}
      {addModalOpen && (
        <div className="modal-backdrop" onClick={() => !addCreating && setAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={18} className="accent" />
                <h2 className="modal-title">Register New User Account</h2>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-icon" 
                style={{ width: 28, height: 28 }}
                onClick={() => setAddModalOpen(false)}
                disabled={addCreating}
              >
                <X size={15} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {addError && (
                  <div className="creds__alert" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{addError}</span>
                  </div>
                )}

                {addSuccess && (
                  <div className="card card-pad" style={{ background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <Check size={16} style={{ flexShrink: 0 }} />
                    <span>User created and indexed successfully!</span>
                  </div>
                )}

                {/* Email Address */}
                <div className="field">
                  <label htmlFor="add_email">Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="add_email"
                      type="email"
                      className="input"
                      style={{ paddingLeft: 32 }}
                      placeholder="user@company.com"
                      required
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      disabled={addCreating}
                    />
                    <Mail size={13} className="muted" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {/* Password */}
                <div className="field">
                  <label htmlFor="add_password">Initial Password * (min 8 characters)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="add_password"
                      type="password"
                      className="input"
                      style={{ paddingLeft: 32 }}
                      placeholder="••••••••••••"
                      required
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      disabled={addCreating}
                    />
                    <Key size={13} className="muted" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                {/* Full Name & Username in 2-col row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label htmlFor="add_fullname">Full Name</label>
                    <input
                      id="add_fullname"
                      type="text"
                      className="input"
                      placeholder="John Doe"
                      value={addFullName}
                      onChange={(e) => setAddFullName(e.target.value)}
                      disabled={addCreating}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="add_username">Username</label>
                    <input
                      id="add_username"
                      type="text"
                      className="input"
                      placeholder="johndoe"
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                      disabled={addCreating}
                    />
                  </div>
                </div>

                {/* Switches / Checkboxes */}
                <div style={{ display: 'flex', gap: 24, padding: '4px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input 
                      type="checkbox"
                      style={{ accentColor: 'var(--accent)' }}
                      checked={addIsActive}
                      onChange={(e) => setAddIsActive(e.target.checked)}
                      disabled={addCreating}
                    />
                    <span>Account Active</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input 
                      type="checkbox"
                      style={{ accentColor: 'var(--accent)' }}
                      checked={addIsVerified}
                      onChange={(e) => setAddIsVerified(e.target.checked)}
                      disabled={addCreating}
                    />
                    <span>Email Verified</span>
                  </label>
                </div>

                {/* Security Roles Checkboxes */}
                <div className="field">
                  <label>Assign Roles</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {['user', 'private_user', 'admin'].map((role) => {
                      const isSelected = addRoles.includes(role)
                      return (
                        <div 
                          key={role} 
                          className="card" 
                          style={{ 
                            flex: 1, 
                            minWidth: 100, 
                            padding: '8px 12px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8, 
                            cursor: 'pointer',
                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                            background: isSelected ? 'var(--accent-2)' : 'var(--bg-elev)'
                          }}
                          onClick={() => handleAddRoleToggle(role)}
                        >
                          <input 
                            type="checkbox" 
                            style={{ pointerEvents: 'none', accentColor: 'var(--accent)' }}
                            checked={isSelected}
                            readOnly
                          />
                          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{role}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setAddModalOpen(false)}
                  disabled={addCreating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-accent" 
                  disabled={addCreating}
                  style={{ minWidth: 100 }}
                >
                  {addCreating ? (
                    <>
                      <Loader2 size={13} className="spin" />
                      Creating…
                    </>
                  ) : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT USER & ROLES ==================== */}
      {editModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={() => !editUpdating && setEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} className="accent" />
                <h2 className="modal-title">Edit User Privileges & Profile</h2>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-icon" 
                style={{ width: 28, height: 28 }}
                onClick={() => setEditModalOpen(false)}
                disabled={editUpdating}
              >
                <X size={15} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {editError && (
                  <div className="creds__alert" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} />
                    <span>{editError}</span>
                  </div>
                )}

                {editSuccess && (
                  <div className="card card-pad" style={{ background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <Check size={16} />
                    <span>User settings saved successfully!</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>User ID</div>
                    <div className="mono" style={{ fontSize: 11.5, marginTop: 2, color: 'var(--text-3)' }}>{selectedUser.id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Email Address</div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 2 }}>{selectedUser.email}</div>
                  </div>
                </div>

                {/* Edit Profile Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label htmlFor="edit_fullname">Full Name</label>
                    <input
                      id="edit_fullname"
                      type="text"
                      className="input"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      disabled={editUpdating}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="edit_username">Username</label>
                    <input
                      id="edit_username"
                      type="text"
                      className="input"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      disabled={editUpdating}
                    />
                  </div>
                </div>

                {/* Active Status Toggle */}
                <div style={{ padding: '4px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input 
                      type="checkbox"
                      style={{ accentColor: 'var(--accent)' }}
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      disabled={editUpdating}
                    />
                    <span style={{ fontWeight: 600 }}>Enable User Account (Active)</span>
                  </label>
                  <p className="muted" style={{ fontSize: 11.5, marginTop: 4, marginLeft: 22 }}>
                    If un-checked, this user's account will be deactivated and all active JWT sessions will be locked.
                  </p>
                </div>

                {/* Edit Roles checkboxes */}
                <div className="field">
                  <label>Edit Permissions & Roles</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    {['user', 'private_user', 'admin'].map((role) => {
                      const isSelected = editRoles.includes(role)
                      return (
                        <div 
                          key={role} 
                          className="card card-pad" 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: 12, 
                            cursor: 'pointer',
                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                            background: isSelected ? 'var(--accent-2)' : 'var(--bg-elev)',
                            margin: 0
                          }}
                          onClick={() => handleEditRoleToggle(role)}
                        >
                          <input 
                            type="checkbox" 
                            style={{ marginTop: 2, pointerEvents: 'none', accentColor: 'var(--accent)' }}
                            checked={isSelected}
                            readOnly
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{role}</div>
                            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                              {role === 'admin' 
                                ? 'Full system developer access. Manage accounts, toggle suspension, delete profiles, S3 triggers.' 
                                : role === 'private_user' 
                                ? 'Access public documents and internal/restricted S3 knowledge base chunks.'
                                : 'Default regular client. Restriced to search, match, and read public document indices.'
                              }
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setEditModalOpen(false)}
                  disabled={editUpdating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-accent" 
                  disabled={editUpdating}
                  style={{ minWidth: 100 }}
                >
                  {editUpdating ? (
                    <>
                      <Loader2 size={13} className="spin" />
                      Saving…
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DELETE CONFIRMATION ==================== */}
      {deleteConfirmOpen && userToDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteConfirmOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={16} />
                <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Delete User Account</h2>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-icon" 
                style={{ width: 28, height: 28, color: 'var(--danger)' }}
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
              >
                <X size={15} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 20 }}>
              {deleteError && (
                <div className="creds__alert mb-3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}

              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
                Are you absolutely sure you want to permanently delete the account for <strong>{userToDelete.full_name || 'this user'}</strong> (<code>{userToDelete.email}</code>)?
              </p>
              <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                This action is irreversible. All access tokens and active refresh sessions for this user will be revoked immediately.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-accent" 
                style={{ background: 'var(--danger)', color: '#fff' }}
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
