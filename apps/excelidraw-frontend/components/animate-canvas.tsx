/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Minus, Pen, Square, Circle, Diamond, MousePointer, Type, Move } from 'lucide-react'

interface User {
  id: string
  name: string
  color: string
  x: number
  y: number
  tool: string
}

interface DrawingElement {
  type: 'rectangle' | 'circle' | 'line' | 'text'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  x2?: number
  y2?: number
  text?: string
  color: string
  strokeWidth: number
  opacity: number
}

const AnimatedCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [users, setUsers] = useState<User[]>([])
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [currentTool, setCurrentTool] = useState('select')

  const tools = [
    { icon: Minus, name: 'zoom-out', active: false },
    { icon: Pen, name: 'pen', active: false },
    { icon: Square, name: 'rectangle', active: false },
    { icon: Circle, name: 'circle', active: false },
    { icon: Diamond, name: 'diamond', active: false },
    { icon: Move, name: 'select', active: true },
    { icon: Type, name: 'text', active: false },
  ]

  // Initialize fake users
  useEffect(() => {
    const fakeUsers: User[] = [
      { id: '1', name: 'Alex', color: '#3b82f6', x: 300, y: 200, tool: 'pen' },
      { id: '2', name: 'Sarah', color: '#ef4444', x: 500, y: 350, tool: 'rectangle' },
      { id: '3', name: 'Mike', color: '#10b981', x: 700, y: 180, tool: 'text' },
    ]
    setUsers(fakeUsers)
  }, [])

  // Animate user cursors
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(prev => prev.map(user => ({
        ...user,
        x: user.x + (Math.random() - 0.5) * 20,
        y: user.y + (Math.random() - 0.5) * 20,
      })))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Drawing animations
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 900
    canvas.height = 500

    let animationFrame = 0

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 0.5
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Animate drawing elements
      const time = Date.now() * 0.001
      
      // Draw animated wireframe
      ctx.strokeStyle = '#f5f5f5'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.lineDashOffset = -time * 10
      
      // Header rectangle
      ctx.strokeRect(150, 80, 600, 60)
      
      // Navigation rectangle
      ctx.strokeRect(150, 160, 300, 40)
      
      // Main content area
      ctx.strokeRect(150, 220, 600, 200)
      
      // Footer buttons
      ctx.strokeRect(200, 350, 100, 40)
      ctx.strokeRect(320, 350, 100, 40)

      ctx.setLineDash([])

      // Draw connecting lines
      ctx.strokeStyle = '#f5f5f5'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(100, 200)
      ctx.lineTo(150, 200)
      ctx.stroke()

      // Draw arrow
      ctx.beginPath()
      ctx.moveTo(140, 195)
      ctx.lineTo(150, 200)
      ctx.lineTo(140, 205)
      ctx.stroke()

      // Draw text
      ctx.fillStyle = '#fff'
      ctx.font = '14px Inter, sans-serif'
      ctx.fillText('Create what you want', 20, 200)

      // Draw user cursors
      users.forEach(user => {
        // Cursor
        ctx.fillStyle = user.color
        ctx.beginPath()
        ctx.moveTo(user.x, user.y)
        ctx.lineTo(user.x + 12, user.y + 4)
        ctx.lineTo(user.x + 5, user.y + 9)
        ctx.lineTo(user.x + 3, user.y + 16)
        ctx.closePath()
        ctx.fill()

        // User label
        ctx.fillStyle = user.color
        ctx.fillRect(user.x + 15, user.y - 8, user.name.length * 8 + 8, 20)
        ctx.fillStyle = '#fff'
        ctx.font = '12px Inter, sans-serif'
        ctx.fillText(user.name, user.x + 19, user.y + 6)
      })

      // Draw animated elements based on time
      if (time % 8 < 2) {
        // Draw rectangle being created
        const progress = (time % 2) / 2
        ctx.strokeStyle = '#f5f5f5'
        ctx.lineWidth = 2
        ctx.strokeRect(500, 280, 80 * progress, 60 * progress)
      } else if (time % 8 < 4) {
        // Draw circle being created
        const progress = ((time % 8) - 2) / 2
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(650, 300, 30 * progress, 0, Math.PI * 2)
        ctx.stroke()
      } else if (time % 8 < 6) {
        // Draw line being drawn
        const progress = ((time % 8) - 4) / 2
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(300, 280)
        ctx.lineTo(300 + 100 * progress, 280 + 50 * progress)
        ctx.stroke()
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [users])

  return (
    <div className="w-full max-w-6xl mt-12 px-4">
      <div className="relative w-full h-auto bg-[#0a0a0a] rounded-lg border border-neutral-700 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-center gap-2 p-4 bg-[#0a0a0a] border-b border-neutral-700">
          {tools.map((tool, index) => (
            <button
              key={tool.name}
              className={`p-2 rounded-md transition-colors ${
                tool.active 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
              onClick={() => setCurrentTool(tool.name)}
            >
              <tool.icon size={16} />
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-auto block"
            style={{ aspectRatio: '900/500' }}
          />
          
          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg flex items-center gap-2 px-3 py-2">
            <button className="text-neutral-600 hover:text-neutral-800">
              <Minus size={16} />
            </button>
            <span className="text-sm font-medium text-neutral-700">100%</span>
            <button className="text-neutral-600 hover:text-neutral-800">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
              </svg>
            </button>
            <span className="text-sm font-medium text-neutral-700">100%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnimatedCanvas
