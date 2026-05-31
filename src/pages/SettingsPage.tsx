import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ZoomIn, ZoomOut, X } from 'lucide-react'
import { Icons } from '@/components/icons'
import { PasswordField } from '@/components/auth/PasswordField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { changePassword, resendVerification, uploadAvatar, updateUser } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/format'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, refreshUser, refreshSession, logout, avatarVersion } = useAuth()

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset imageLoaded when user id or avatarVersion changes
  const [lastTrigger, setLastTrigger] = useState<string | null>(null)
  const currentTrigger = user?.id ? `${user.id}-${avatarVersion}` : null
  if (currentTrigger !== lastTrigger) {
    setImageLoaded(false)
    setLastTrigger(currentTrigger)
  }

  // Crop & Reposition States
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [displaySize, setDisplaySize] = useState({ width: 300, height: 300 })
  const [isSavingCrop, setIsSavingCrop] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarMsg(null)
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImageSrc(reader.result)
          setScale(1)
          setOffset({ x: 0, y: 0 })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Helper to constrain offsets so the image always covers the 250x250 crop circle
  const constrainOffset = (x: number, y: number, currentScale: number) => {
    const maxLimitX = Math.max(0, (displaySize.width * currentScale) / 2 - 125)
    const maxLimitY = Math.max(0, (displaySize.height * currentScale) / 2 - 125)
    return {
      x: Math.min(maxLimitX, Math.max(-maxLimitX, x)),
      y: Math.min(maxLimitY, Math.max(-maxLimitY, y))
    }
  }

  const handleScaleChange = (newScale: number) => {
    setScale(newScale)
    setOffset((prev) => constrainOffset(prev.x, prev.y, newScale))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      })
    }
  }

  // Mouse move and up global listeners
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const rawX = e.clientX - dragStart.x
      const rawY = e.clientY - dragStart.y
      setOffset(constrainOffset(rawX, rawY, scale))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, scale, displaySize])

  // Touch move and end global listeners
  useEffect(() => {
    if (!isDragging) return

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const rawX = e.touches[0].clientX - dragStart.x
        const rawY = e.touches[0].clientY - dragStart.y
        setOffset(constrainOffset(rawX, rawY, scale))
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragStart, scale, displaySize])

  const handleCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const natW = img.naturalWidth
    const natH = img.naturalHeight
    const r = natW / natH
    
    let displayW = 300
    let displayH = 300
    if (r > 1) {
      displayW = 300 * r
      displayH = 300
    } else {
      displayW = 300
      displayH = 300 / r
    }
    
    setDisplaySize({ width: displayW, height: displayH })
  }

  const handleSaveCrop = async () => {
    if (!selectedImageSrc || !user?.id) return
    setIsSavingCrop(true)
    setUploadingAvatar(true)
    try {
      const img = new Image()
      img.src = selectedImageSrc
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 400, 400)

      ctx.translate(200, 200)

      const S_canvas = 400 / 250

      ctx.translate(offset.x * S_canvas, offset.y * S_canvas)
      ctx.scale(scale * S_canvas, scale * S_canvas)

      ctx.drawImage(
        img,
        -displaySize.width / 2,
        -displaySize.height / 2,
        displaySize.width,
        displaySize.height
      )

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSavingCrop(false)
          setUploadingAvatar(false)
          setAvatarMsg('Failed to process image')
          return
        }
        
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        
        try {
          await uploadAvatar(user.id, croppedFile)
          setAvatarMsg('Profile picture updated!')
          setSelectedImageSrc(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
          await refreshUser()
        } catch (err) {
          setAvatarMsg(err instanceof Error ? err.message : 'Failed to upload photo')
        } finally {
          setIsSavingCrop(false)
          setUploadingAvatar(false)
        }
      }, 'image/jpeg', 0.9)

    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : 'Failed to crop photo')
      setIsSavingCrop(false)
      setUploadingAvatar(false)
    }
  }

  // Name update states
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [updatingName, setUpdatingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<string | null>(null)

  // Initialize Name from user when user object is loaded
  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name)
    }
  }, [user])

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setUpdatingName(true)
    setNameMsg(null)
    try {
      await updateUser(user.id, { full_name: fullName })
      setNameMsg('Name updated successfully!')
      await refreshUser()
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : 'Failed to update name')
    } finally {
      setUpdatingName(false)
    }
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)
  const [pwSubmitting, setPwSubmitting] = useState(false)

  const [sessionMsg, setSessionMsg] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)

  const [verifyMsg, setVerifyMsg] = useState<string | null>(null)
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)
    setPwSubmitting(true)
    try {
      const res = await changePassword(currentPassword, newPassword)
      setPwSuccess(res.message)
      setCurrentPassword('')
      setNewPassword('')
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not change password')
    } finally {
      setPwSubmitting(false)
    }
  }

  async function onRefreshSession() {
    setSessionLoading(true)
    setSessionMsg(null)
    const ok = await refreshSession()
    setSessionMsg(ok ? 'Session refreshed (new access + refresh tokens).' : 'Could not refresh session.')
    setSessionLoading(false)
  }

  async function onResendVerification() {
    if (!user?.email) return
    setVerifyLoading(true)
    setVerifyMsg(null)
    setVerifyToken(null)
    try {
      const res = await resendVerification(user.email)
      setVerifyMsg(res.message)
      if (res.verification_token) setVerifyToken(res.verification_token)
    } catch (err) {
      setVerifyMsg(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="page" style={{ minHeight: 'calc(100vh - var(--header-h))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', flex: 1, width: '100%' }}>
        
        {/* Column 1: Account Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="card card-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="row-between mb-3">
              <span className="h-card">Account</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void refreshUser()}
              >
                <Icons.Refresh size={14} />
                Refresh profile
              </button>
            </div>
            {user ? (
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start', paddingTop: 8, flex: 1 }}>
                {/* Left side: Profile image uploader */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 100 }}>
                  <div 
                    className="avatar" 
                    style={{ 
                      width: 80, 
                      height: 80, 
                      fontSize: 28, 
                      fontWeight: 600, 
                      background: 'var(--accent-2)', 
                      color: 'var(--accent)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%'
                    }}
                  >
                    {user.id ? (
                      <img 
                        src={`/api/v1/users/${user.id}/avatar?v=${avatarVersion}`} 
                        alt={user.full_name || user.email} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          display: imageLoaded ? 'block' : 'none'
                        }}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(false)}
                      />
                    ) : null}
                    {!imageLoaded && (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label 
                    className="btn btn-ghost btn-sm" 
                    style={{ 
                      cursor: 'pointer', 
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      height: 24
                    }}
                  >
                    {uploadingAvatar ? 'Processing…' : 'Change Photo'}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleAvatarChange} 
                      disabled={uploadingAvatar}
                    />
                  </label>
                  {avatarMsg && (
                    <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--accent)', textAlign: 'center', lineHeight: 1.2 }}>
                      {avatarMsg}
                    </span>
                  )}
                </div>

                {/* Right side: standard user data list */}
                <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <form onSubmit={handleUpdateName} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-3)' }}>Email</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', padding: '2px 0' }}>{user.email}</div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label htmlFor="full-name-input" style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-3)' }}>Name</label>
                      <input
                        id="full-name-input"
                        type="text"
                        className="input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your name"
                        required
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--text)',
                          width: '100%',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button 
                        type="submit" 
                        className="btn btn-accent btn-sm"
                        disabled={updatingName || fullName === user.full_name || !fullName.trim()}
                        style={{ alignSelf: 'flex-start', padding: '4px 12px', height: 28, fontSize: 12 }}
                      >
                        {updatingName ? 'Saving…' : 'Save Name'}
                      </button>
                      {nameMsg && (
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>
                          {nameMsg}
                        </span>
                      )}
                    </div>
                  </form>

                  <dl className="settings-dl" style={{ margin: 0, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div>
                      <dt>Verified</dt>
                      <dd>
                        <StatusBadge
                          label={user.is_verified ? 'Yes' : 'No'}
                          tone={user.is_verified ? 'green' : 'amber'}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>Roles</dt>
                      <dd style={{ fontWeight: 500 }}>{user.roles?.length ? user.roles.join(', ') : '—'}</dd>
                    </div>
                    {user.last_login_at ? (
                      <div>
                        <dt>Last login</dt>
                        <dd className="mono muted">{formatDate(user.last_login_at)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            ) : (
              <p className="empty">Loading profile…</p>
            )}
          </section>
        </div>

        {/* Column 2: Session & Security stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="card card-pad">
            <span className="h-card">Session</span>
            <p className="muted" style={{ margin: '8px 0 12px', fontSize: 13 }}>
              Calls <code className="mono">POST /api/v1/auth/refresh-token</code> to rotate tokens.
              Expired access tokens are refreshed automatically on API calls.
            </p>
            <button
              type="button"
              className="btn btn-accent btn-sm"
              disabled={sessionLoading}
              onClick={() => void onRefreshSession()}
            >
              {sessionLoading ? 'Refreshing…' : 'Refresh session'}
            </button>
            {sessionMsg ? (
              <p style={{ marginTop: 12, fontSize: 13 }}>{sessionMsg}</p>
            ) : null}
          </section>

          {!user?.is_verified ? (
            <section className="card card-pad">
              <span className="h-card">Email verification</span>
              <p className="muted" style={{ margin: '8px 0 12px', fontSize: 13 }}>
                Resend a verification token via{' '}
                <code className="mono">POST /api/v1/auth/resend-verification</code>.
              </p>
              <button
                type="button"
                className="btn btn-sm"
                disabled={verifyLoading}
                onClick={() => void onResendVerification()}
              >
                {verifyLoading ? 'Sending…' : 'Resend verification'}
              </button>
              {verifyMsg ? <p style={{ marginTop: 12, fontSize: 13 }}>{verifyMsg}</p> : null}
              {verifyToken ? (
                <p className="mono muted" style={{ marginTop: 8, fontSize: 12, wordBreak: 'break-all' }}>
                  Dev token: {verifyToken}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="card card-pad" style={{ flex: 1, minHeight: 0 }}>
            <span className="h-card">Change password</span>
            <p className="muted" style={{ margin: '8px 0 12px', fontSize: 13 }}>
              Uses <code className="mono">POST /api/v1/auth/change-password</code>. You will be signed out
              after a successful change.
            </p>
            <form className="creds__form" style={{ maxWidth: '100%' }} onSubmit={handleChangePassword}>
              {pwError ? (
                <div className="creds__alert" role="alert">
                  {pwError}
                </div>
              ) : null}
              {pwSuccess ? (
                <div className="card card-pad" style={{ fontSize: 13 }}>
                  {pwSuccess}
                </div>
              ) : null}
              <PasswordField
                label="Current password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <PasswordField
                label="New password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button type="submit" className="submit-btn" disabled={pwSubmitting}>
                {pwSubmitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>
        </div>

      </div>

      {selectedImageSrc && (
        <div 
          className="crop-modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 10, 10, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div 
            className="crop-modal-card card" 
            style={{
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '24px 20px',
              width: 340,
              maxWidth: '100%',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20
            }}
          >
            {/* Modal Header */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="h-card" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Adjust Photo</span>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ minWidth: 28, height: 28, padding: 0, borderRadius: '50%' }}
                onClick={() => {
                  setSelectedImageSrc(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Viewport Frame */}
            <div 
              style={{
                width: 300,
                height: 300,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 12,
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Image to crop */}
              <img
                src={selectedImageSrc}
                alt="Adjust preview"
                onLoad={handleCropImageLoad}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: displaySize.width,
                  height: displaySize.height,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  cursor: 'move',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
              />

              {/* Shading Mask Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: 25,
                  left: 25,
                  width: 250,
                  height: 250,
                  borderRadius: '50%',
                  boxShadow: '0 0 0 9999px rgba(10, 10, 10, 0.75)',
                  border: '2px solid var(--accent)',
                  pointerEvents: 'none',
                  zIndex: 3
                }}
              />

              {/* Drag Event Catchment Overlay */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{
                  position: 'absolute',
                  inset: 0,
                  cursor: 'move',
                  zIndex: 4
                }}
              />
            </div>

            {/* Slider Controls */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
                <ZoomOut size={16} />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: 'var(--border)',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer'
                  }}
                  className="crop-zoom-slider"
                />
                <ZoomIn size={16} />
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ width: '100%', display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setSelectedImageSrc(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                disabled={isSavingCrop}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-accent"
                style={{ flex: 1, background: 'var(--accent)', color: '#fff' }}
                onClick={handleSaveCrop}
                disabled={isSavingCrop}
              >
                {isSavingCrop ? 'Saving…' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
