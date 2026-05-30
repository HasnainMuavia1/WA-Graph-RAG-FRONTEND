import { useCallback, useEffect, useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { 
  Upload, 
  X, 
  Search, 
  Filter, 
  FileText, 
  Check, 
  AlertCircle,
  Calendar,
  Layers,
  Globe,
  Loader2,
  RefreshCw,
  Trash2,
  Eye
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getDocuments, getDocumentDetails, uploadDocument, deleteDocument } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { DocumentMetadata } from '@/types/api'

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterAccess, setFilterAccess] = useState<'all' | 'public' | 'private'>('all')

  // Modals state
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)

  // Document details view state
  const [viewDocDetails, setViewDocDetails] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState<DocumentMetadata | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // File Upload form state
  const [file, setFile] = useState<File | null>(null)
  const [accessLevel, setAccessLevel] = useState('public')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getDocuments({ limit: 100 })
      setDocuments(res.documents)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Drag and drop event handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setUploadSuccess(false)
      setUploadError(null)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadSuccess(false)
      setUploadError(null)
    }
  }

  const onUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setUploadError('Please select a file to upload.')
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      await uploadDocument(file, accessLevel)
      setUploadSuccess(true)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      void load() // Refresh list
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const openDocViewer = async (docId: string) => {
    setViewOpen(true)
    setLoadingDetails(true)
    setDetailsError(null)
    setViewDocDetails(null)
    try {
      const details = await getDocumentDetails(docId)
      setViewDocDetails(details)
    } catch (e) {
      setDetailsError(e instanceof Error ? e.message : 'Failed to load document content')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Open Delete confirmation
  const openDeleteConfirm = (doc: DocumentMetadata) => {
    setDocToDelete(doc)
    setDeleteError(null)
    setDeleteConfirmOpen(true)
  }

  // Confirm delete document
  const handleConfirmDelete = async () => {
    if (!docToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteDocument(docToDelete.id)
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id))
      setDeleteConfirmOpen(false)
      setDocToDelete(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = documents.filter((d) => {
    // 1. Search Query filter
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || (
      d.title.toLowerCase().includes(q) ||
      d.source.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q)
    )

    // 2. Access Level filter
    const level = d.metadata?.access_level ?? 'public'
    const matchesAccess = filterAccess === 'all' || level === filterAccess

    return matchesSearch && matchesAccess
  })

  return (
    <div className="page fade-in">
      {/* Search & Actions Control Bar (Consistent layout, no double headers!) */}
      <div className="card card-pad mb-3">
        <div className="row gap-8 flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row gap-8 flex-wrap" style={{ flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
              <input
                type="search"
                className="input"
                style={{ paddingLeft: 32, height: 32 }}
                placeholder="Search documents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={13} className="muted" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Access Filter dropdown */}
            <div className="row gap-6">
              <Filter size={12} className="muted" />
              <select 
                className="input" 
                style={{ width: 120, height: 32, fontSize: 12 }}
                value={filterAccess} 
                onChange={(e) => setFilterAccess(e.target.value as any)}
              >
                <option value="all">All Access</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
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
                setUploadOpen(true)
                setUploadSuccess(false)
                setUploadError(null)
                setFile(null)
              }}
            >
              <Upload size={13} />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card card-pad creds__alert mb-3" role="alert">
          {error}
        </div>
      ) : null}

      {/* Summary line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px 10px', fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>
        <span>Showing ingested knowledge base files</span>
        <span>{filtered.length} document{filtered.length === 1 ? '' : 's'} matched</span>
      </div>

      {/* Main Table view */}
      <div className="table-wrap" style={{ border: '1px solid var(--border)', background: 'var(--bg-elev)', borderRadius: 'var(--radius-lg)' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>Document Title</th>
              <th>Source path / S3 key</th>
              <th>Access</th>
              <th>Chunks</th>
              <th>Updated</th>
              <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty" style={{ padding: '80px 0' }}>
                  <div className="row gap-8" style={{ justifyContent: 'center' }}>
                    <Loader2 size={18} className="spin accent" />
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>Fetching document list…</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty" style={{ padding: '80px 20px', fontSize: 13.5, color: 'var(--text-3)' }}>
                  No matching documents found. Click "Upload Document" to index your first file.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const access = String(doc.metadata?.access_level ?? 'public')
                return (
                  <tr key={doc.id} className="clickable-row" onClick={() => void openDocViewer(doc.id)}>
                    <td style={{ paddingLeft: 20, paddingTop: 12, paddingBottom: 12 }}>
                      <div className="row gap-8" style={{ alignItems: 'center' }}>
                        {/* Beautiful Blue Document Icon Avatar */}
                        <div 
                          className="avatar" 
                          style={{ 
                            background: 'var(--accent-2)', 
                            color: 'var(--accent)', 
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FileText size={15} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                            {doc.title}
                          </div>
                          <div className="mono muted" style={{ fontSize: 10.5, marginTop: 2 }}>
                            ID: {doc.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="mono truncate" style={{ maxWidth: 240, color: 'var(--text-2)', fontSize: 12.5 }}>
                      {doc.source}
                    </td>
                    <td>
                      <StatusBadge
                        label={access}
                        tone={access === 'private' ? 'violet' : 'blue'}
                      />
                    </td>
                    <td className="mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
                      {doc.chunk_count ?? '0'}
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {formatDate(doc.updated_at)}
                    </td>
                    <td style={{ paddingRight: 20 }} onClick={(e) => e.stopPropagation()}>
                      <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ height: 28, fontSize: 12 }}
                          onClick={() => void openDocViewer(doc.id)}
                        >
                          <Eye size={12} />
                          View Text
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--danger)', width: 28, height: 28 }}
                          onClick={() => openDeleteConfirm(doc)}
                          title="Delete Document"
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

      {/* ==================== MODAL: UPLOAD DOCUMENT ==================== */}
      {uploadOpen && (
        <div className="modal-backdrop" onClick={() => !uploading && setUploadOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Upload & Index Document</h2>
              <button 
                type="button" 
                className="btn btn-ghost btn-icon" 
                style={{ width: 28, height: 28 }}
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
              >
                <X size={15} />
              </button>
            </div>
            
            <form onSubmit={onUploadSubmit}>
              <div className="modal-body">
                {uploadError && (
                  <div className="creds__alert mb-3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="card card-pad mb-3" style={{ background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={16} style={{ flexShrink: 0 }} />
                    <span>Document uploaded and indexed successfully!</span>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div 
                  className={`upload-dropzone ${dragActive ? 'dragover' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.xlsx,.xls,.pptx,.csv,.tsv,.json,.jsonl,.html,.htm,.txt,.md,.py,.js,.ts,.yaml,.yml,.toml,.xml"
                  />
                  <div className="avatar" style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-elev)' }}>
                    <Upload size={20} className="muted" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 13.5 }}>
                      Drag & drop your file here, or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>browse</span>
                    </p>
                    <p className="muted" style={{ fontSize: 11.5, marginTop: 4, marginBottom: 0 }}>
                      Supports PDF, Word, Excel, PPT, CSV, Text, HTML, JSON, markdown etc.
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="upload-file-info fade-in">
                    <div className="row gap-8" style={{ minWidth: 0 }}>
                      <FileText size={16} className="accent" />
                      <div style={{ minWidth: 0 }}>
                        <div className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-icon" 
                      style={{ width: 24, height: 24 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      disabled={uploading}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {/* Access Level Selector */}
                <div className="field mt-3">
                  <label htmlFor="access_level">Access Level Control</label>
                  <select 
                    id="access_level"
                    className="input mt-3"
                    style={{ height: 34 }}
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    disabled={uploading}
                  >
                    <option value="public">Public (Everyone can search/access)</option>
                    <option value="private">Private (Restricted to authorized users and Admins)</option>
                  </select>
                </div>

                {uploading && (
                  <div className="fade-in">
                    <div className="upload-progress-bar">
                      <div className="upload-progress-fill" style={{ width: '75%' }}></div>
                    </div>
                    <p className="muted" style={{ fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                      Parsing, chunking, and generating vector embeddings…
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setUploadOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-accent" 
                  disabled={!file || uploading}
                  style={{ minWidth: 100 }}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={13} className="spin" />
                      Indexing…
                    </>
                  ) : 'Index File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DOCUMENT VIEWER ==================== */}
      {viewOpen && (
        <div className="modal-backdrop" onClick={() => setViewOpen(false)}>
          <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} className="accent" />
                <h2 className="modal-title truncate" style={{ maxWidth: 450 }}>
                  {viewDocDetails?.title || 'Document Content Viewer'}
                </h2>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-icon" 
                style={{ width: 28, height: 28 }}
                onClick={() => setViewOpen(false)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              {loadingDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 12 }}>
                  <Loader2 size={24} className="spin accent" />
                  <span className="muted">Fetching document full content and facts…</span>
                </div>
              ) : detailsError ? (
                <div className="creds__alert" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} />
                  <span>{detailsError}</span>
                </div>
              ) : viewDocDetails ? (
                <div className="fade-in">
                  
                  {/* Info Cards Row */}
                  <div className="doc-info-grid">
                    <div className="doc-info-card">
                      <label><Globe size={11} className="muted" style={{ marginRight: 4 }} /> Access level</label>
                      <span className="val" style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {viewDocDetails.access_level || 'Public'}
                      </span>
                    </div>
                    <div className="doc-info-card">
                      <label><Layers size={11} className="muted" style={{ marginRight: 4 }} /> Chunks generated</label>
                      <span className="val" style={{ fontFamily: 'var(--mono)' }}>
                        {viewDocDetails.chunks?.length || 0} chunks
                      </span>
                    </div>
                    <div className="doc-info-card">
                      <label><Calendar size={11} className="muted" style={{ marginRight: 4 }} /> Ingested Date</label>
                      <span className="val">
                        {formatDate(viewDocDetails.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="field mb-3">
                    <label>Source path / S3 key</label>
                    <div className="input mono" style={{ height: 32, display: 'flex', alignItems: 'center', background: 'var(--bg-sunk)', fontSize: 11.5, wordBreak: 'break-all' }}>
                      {viewDocDetails.source}
                    </div>
                  </div>

                  {/* Document Raw Text Viewer */}
                  <div className="field">
                    <label>Document Parsed text ({viewDocDetails.content?.length || 0} characters)</label>
                    <div className="doc-content-view">
                      {viewDocDetails.content || '(No text content found)'}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="empty">No document data found.</p>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => setViewOpen(false)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DELETE DOCUMENT CONFIRMATION ==================== */}
      {deleteConfirmOpen && docToDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteConfirmOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={16} />
                <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Delete Ingested Document</h2>
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
                Are you absolutely sure you want to permanently delete the document <strong>{docToDelete.title || 'this file'}</strong>?
              </p>
              <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                This action is irreversible. All generated PostgreSQL chunks and associated Neo4j knowledge graph nodes will be scrubbed immediately from the system.
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
                {deleting ? 'Deleting…' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
