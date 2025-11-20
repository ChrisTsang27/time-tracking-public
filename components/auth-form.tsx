'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Logged in successfully')
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Check your email for the confirmation link!')
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-[350px] glass-panel border-white/10 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
        <CardHeader>
          <CardTitle className="text-2xl font-bold neon-text text-center">Access Terminal</CardTitle>
          <CardDescription className="text-gray-400 text-center">Enter credentials to proceed</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 transition-colors"
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-blue-50 hover:text-blue-900 transition-all duration-300 font-medium">
                {loading ? 'Processing...' : 'Login'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSignUp} 
                disabled={loading}
                className="w-full border-white/10 text-white hover:bg-white/10 hover:text-white transition-colors"
              >
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
