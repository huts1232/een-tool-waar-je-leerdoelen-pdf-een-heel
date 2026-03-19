'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { BookOpen, Zap, Target, Brain, Upload, Play, Check, Star, ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface User {
  id: string
  email: string
}

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({ id: user.id, email: user.email || '' })
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name) {
      setAuthError('Please fill in all fields')
      return
    }

    setAuthLoading(true)
    setAuthError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user preferences
        await supabase.from('user_preferences').insert({
          user_id: data.user.id,
          tts_voice: 'default',
          tts_speed: 1.0,
          default_flashcard_count: 20,
          default_quiz_count: 10,
          theme: 'light'
        })

        setUser({ id: data.user.id, email: data.user.email || '' })
        router.push('/dashboard')
      }
    } catch (error: any) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setAuthError('Please fill in all fields')
      return
    }

    setAuthLoading(true)
    setAuthError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' })
        router.push('/dashboard')
      }
    } catch (error: any) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const resetAuthForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setAuthError('')
    setShowPassword(false)
  }

  const openAuthModal = (mode: 'login' | 'signup') => {
    resetAuthForm()
    setAuthMode(mode)
  }

  const closeAuthModal = () => {
    resetAuthForm()
    setAuthMode(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">StudyBoost AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openAuthModal('login')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Transform Your
              <span className="text-blue-600 block">Study Materials</span>
              Into Learning Gold
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Upload any textbook or PDF and instantly get personalized flashcards, interactive quizzes, 
              and AI-powered study sessions. StudyBoost AI makes learning efficient and engaging.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg flex items-center"
              >
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <div className="text-sm text-gray-500">
                No credit card required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Master Any Subject
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI analyzes your content and creates personalized learning experiences that adapt to your pace and style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
              <div className="bg-blue-600 rounded-full p-3 w-fit mb-4">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Upload</h3>
              <p className="text-gray-600">
                Upload textbooks, PDFs, or notes. Our AI extracts and processes content instantly.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
              <div className="bg-green-600 rounded-full p-3 w-fit mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Flashcards</h3>
              <p className="text-gray-600">
                Get personalized flashcards with key concepts and definitions generated automatically.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
              <div className="bg-purple-600 rounded-full p-3 w-fit mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Quizzes</h3>
              <p className="text-gray-600">
                Test your knowledge with AI-generated quizzes that adapt to your learning progress.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl">
              <div className="bg-orange-600 rounded-full p-3 w-fit mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Learning Goals</h3>
              <p className="text-gray-600">
                Set study goals and track your progress with detailed analytics and insights.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl">
              <div className="bg-pink-600 rounded-full p-3 w-fit mb-4">
                <Play className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Audio Learning</h3>
              <p className="text-gray-600">
                Listen to your flashcards and study materials with high-quality text-to-speech.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl">
              <div className="bg-indigo-600 rounded-full p-3 w-fit mb-4">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Analytics</h3>
              <p className="text-gray-600">
                Get insights into your learning patterns and areas that need more attention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Start Learning in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Your Content</h3>
              <p className="text-gray-600">
                Drag and drop your textbooks, PDFs, or study materials. We support all major formats.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Creates Study Materials</h3>
              <p className="text-gray-600">
                Our AI analyzes your content and generates flashcards, quizzes, and study sessions automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Learn & Track Progress</h3>
              <p className="text-gray-600">
                Study with personalized materials and track your progress with detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Affordable Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $0<span className="text-lg text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>5 materials per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Basic flashcards</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Simple quizzes</span>
                </li>
              </ul>
              <button
                onClick={() => openAuthModal('signup')}
                className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Get Started Free
              </button>
            </div>

            <div className="bg-blue-600 p-8 rounded-2xl text-white relative">
              <div className="absolute top-4 right-4">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium</h3>
              <div className="text-4xl font-bold mb-6">
                $9.99<span className="text-lg text-blue-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span>Unlimited materials</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span>AI-powered flashcards</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span>Advanced quizzes</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span>Learning goals</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span>Audio learning</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span>Progress analytics</span>
                </li>
              </ul>
              <button
                onClick={() => openAuthModal('signup')}
                className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Start Premium Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students who are already studying smarter with StudyBoost AI
          </p>
          <button
            onClick={() => openAuthModal('signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Get Started Free Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-8">
            <Brain className="h-8 w-8 text-blue-400 mr-2" />
            <span className="text-2xl font-bold">StudyBoost AI</span>
          </div>
          <p className="text-center text-gray-400">
            © 2024 StudyBoost AI. All rights reserved. Transform your learning today.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <button
                onClick={closeAuthModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={authMode === 'signup' ? handleSignUp : handleSignIn}>
              {authMode === 'signup' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {authLoading ? 'Please wait...' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}