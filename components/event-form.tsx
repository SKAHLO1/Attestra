"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface EventFormProps {
  onSubmit: (data: any) => void
}

export default function EventForm({ onSubmit }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    badgeImage: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onSubmit(formData)
      setFormData({ name: "", description: "", badgeImage: "" })
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
        <CardDescription>Deploy a new microchain for your event</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Name</label>
            <Input
              placeholder="e.g., Linera Hackathon 2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              placeholder="Brief description of your event"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Badge Image URI</label>
            <Input
              placeholder="ipfs://QmXxxx or https://..."
              value={formData.badgeImage}
              onChange={(e) => setFormData({ ...formData, badgeImage: e.target.value })}
              className="bg-input"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              Deploy Microchain
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
