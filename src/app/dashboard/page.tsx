'use client'

import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  Target, 
  Upload, 
  FileText, 
  Clock, 
  TrendingUp,
  Plus,
  Eye,
  Play,
  Award
} from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Material {
  id: string
  filename: string
  file_size: number
  status: string
  page_count: number
  word_count: number
  created_at: string
}

interface Flashcard {
  id: string
  material_id: string
  front_text: string
  back_text: string
  difficulty_level: string
  created_at: string
  materials: {
    filename: string
  }
}

interface QuizAttempt {
  id: string
  score: number
  total_questions: number
  time_taken_seconds: number
  completed_at: string
  quizzes: {
    title: string
    materials: {
      filename: string
    }
  }
}

interface StudySession {
  id: string
  activity_type: string
  duration_seconds: number
  cards_reviewed: number
  quiz_score: number
  started_at: string
}

export default function Dashboard() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalFlashcards: 0,
    averageQuizScore: 0,
    studyTimeThisWeek: 0
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      await loadDashboardData(user.id)
    }

    checkUser()
  }, [router])

  const loadDashboardData = async (userId: string) => {
    try {
      setLoading(true)
      
      // Load recent materials
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Load recent flashcards
      const { data: flashcardsData } = await supabase
        .from('flashcards')
        .select(`
          *,
          materials(filename)
        `)
        .eq('materials.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Load recent quiz attempts
      const { data: quizAttemptsData } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes(
            title,
            materials(filename)
          )
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5)

      // Load recent study sessions
      const { data: studySessionsData } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(10)

      // Calculate stats
      const { data: allMaterials } = await supabase
        .from('materials')
        .select('id')
        .eq('user_id', userId)

      const { data: allFlashcards } = await supabase
        .from('flashcards')
        .select('flashcards.id')
        .eq('materials.user_id', userId)

      const { data: allQuizAttempts } = await supabase
        .from('quiz_attempts')
        .select('score, total_questions')
        .eq('user_id', userId)

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: weekSessions } = await supabase
        .from('study_sessions')
        .select('duration_seconds')
        .eq('user_id', userId)
        .gte('started_at', weekAgo.toISOString())

      const avgScore = allQuizAttempts?.length > 0 
        ? allQuizAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.total_questions * 100), 0) / allQuizAttempts.length
        : 0

      const weeklyStudyTime = weekSessions?.reduce((sum, session) => sum + session.duration_seconds, 0) || 0

      setMaterials(materialsData || [])
      setFlashcards(flashcardsData || [])
      setQuizAttempts(quizAttemptsData || [])
      setStudySessions(studySessionsData || [])
      setStats({
        totalMaterials: allMaterials?.length || 0,
        totalFlashcards: allFlashcards?.length || 0,
        averageQuizScore: Math.round(avgScore),
        studyTimeThisWeek: Math.round(weeklyStudyTime / 3600)
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your study progress.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/materials"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Material
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Materials</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMaterials}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Flashcards</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalFlashcards}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Quiz Score</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.averageQuizScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Study Time (Week)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.studyTimeThisWeek}h</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Materials */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Materials</h2>
                <Link href="/materials" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {materials.length > 0 ? (
                materials.map((material) => (
                  <div key={material.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                            {material.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(material.file_size)} • {material.page_count} pages
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            material.status === 'processed' 
                              ? 'bg-green-100 text-green-800'
                              : material.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {material.status}
                          </span>
                          <Link
                            href={`/materials/${material.id}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(material.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No materials uploaded yet</p>
                  <Link
                    href="/materials"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Your First Material
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Flashcards */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Flashcards</h2>
                <Link href="/materials" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {flashcards.length > 0 ? (
                flashcards.map((flashcard) => (
                  <div key={flashcard.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                          {flashcard.front_text}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          From: {flashcard.materials.filename}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            flashcard.difficulty_level === 'easy'
                              ? 'bg-green-100 text-green-800'
                              : flashcard.difficulty_level === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {flashcard.difficulty_level}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Link
                          href={`/flashcards/${flashcard.material_id}`}
                          className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
                        >
                          <Play className="w-4 h-4" />
                        </Link>
                        <p className="text-xs text-gray-500">{formatDate(flashcard.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No flashcards created yet</p>
                  <Link
                    href="/materials"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Flashcards
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Quiz Results */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Quiz Results</h2>
                <Link href="/materials" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {quizAttempts.length > 0 ? (
                quizAttempts.map((attempt) => (
                  <div key={attempt.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Award className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                            {attempt.quizzes.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attempt.quizzes.materials.filename}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            (attempt.score / attempt.total_questions) >= 0.8
                              ? 'bg-green-100 text-green-800'
                              : (attempt.score / attempt.total_questions) >= 0.6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {Math.round((attempt.score / attempt.total_questions) * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {attempt.score}/{attempt.total_questions} • {formatDuration(attempt.time_taken_seconds)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(attempt.completed_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No quizzes taken yet</p>
                  <Link
                    href="/materials"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Take Your First Quiz
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/materials"
                  className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors group"
                >
                  <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-blue-900">Upload Material</p>
                </Link>

                <Link
                  href="/goals"
                  className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition-colors group"
                >
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-green-900">Set Goal</p>
                </Link>

                <Link
                  href="/settings"
                  className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors group"
                >
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-purple-900">View Progress</p>
                </Link>

                <Link
                  href="/premium"
                  className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center transition-colors group"
                >
                  <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-yellow-900">Upgrade</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}