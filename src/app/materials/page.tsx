'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Upload, File, Clock, Check, X, Trash2, Eye, Download, FileText, BookOpen } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Material {
  id: string
  filename: string
  file_path: string
  file_size: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  extracted_text: string
  page_count: number
  word_count: number
  created_at: string
  updated_at: string
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (err) {
      console.error('Error fetching materials:', err)
      setError('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.includes('pdf')) {
      setError('Only PDF files are supported')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `materials/${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data, error: dbError } = await supabase
        .from('materials')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          status: 'uploading'
        })
        .select()
        .single()

      if (dbError) throw dbError

      const response = await fetch(`/api/materials/process/${data.id}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to start processing')
      }

      setSuccess('File uploaded successfully! Processing will begin shortly.')
      await fetchMaterials()
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      await supabase.storage.from('materials').remove([filePath])
      const { error } = await supabase.from('materials').delete().eq('id', id)
      if (error) throw error
      
      setMaterials(materials.filter(m => m.id !== id))
      setSuccess('Material deleted successfully')
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete material')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500 animate-spin" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />
      default:
        return <File className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Ready'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Materials</h1>
          <p className="text-gray-600">Upload PDFs and transform them into interactive learning experiences</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-8 transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && document.getElementById('file-input')?.click()}
        >
          <div className="text-center">
            <Upload className={`w-12 h-12 mx-auto mb-4 ${uploading ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {uploading ? 'Uploading...' : 'Upload your study materials'}
            </h3>
            <p className="text-gray-600 mb-4">
              {uploading ? 'Please wait while we upload your file' : 'Drop PDF files here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">PDF files up to 50MB</p>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No materials yet</h3>
            <p className="text-gray-600 mb-6">Upload your first PDF to get started with AI-powered learning</p>
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              disabled={uploading}
            >
              Upload Your First PDF
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Materials ({materials.length})</h2>
            {materials.map((material) => (
              <div key={material.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(material.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{material.filename}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          Status: <span className="ml-1 font-medium">{getStatusText(material.status)}</span>
                        </span>
                        <span>{formatFileSize(material.file_size)}</span>
                        {material.page_count > 0 && <span>{material.page_count} pages</span>}
                        {material.word_count > 0 && <span>{material.word_count.toLocaleString()} words</span>}
                        <span>Uploaded {formatDate(material.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {material.status === 'completed' && (
                      <>
                        <Link
                          href={`/materials/${material.id}`}
                          className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </Link>
                        <Link
                          href={`/flashcards/${material.id}`}
                          className="bg-green-50 text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center space-x-1"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Study</span>
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(material.id, material.file_path)}
                      className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                {material.status === 'processing' && (
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Processing your material... This may take a few minutes.</p>
                  </div>
                )}
                {material.status === 'failed' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      Processing failed. Please try uploading the file again or contact support if the issue persists.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}