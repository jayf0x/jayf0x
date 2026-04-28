import { useState } from "react"
import { useFormStore } from "../store/formStore"
import { useFormQueries } from "../hooks/useFormQueries"
import { useRenderTracker } from "../instrumentation/useRenderTracker"
import { useEventTracker } from "../instrumentation/useEventTracker"

interface FieldProps {
  label: string
  children: React.ReactNode
}

function FieldRow({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white/30 text-[10px] tracking-widest uppercase">{label}</label>
      {children}
    </div>
  )
}

function UsernameField() {
  useRenderTracker("username-field", "UsernameField", "demo-form")
  const { username, setUsername } = useFormStore()
  return (
    <FieldRow label="Username">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="jay"
        className="bg-transparent border border-white/15 text-white text-sm px-3 py-2 outline-none focus:border-white/40 transition-colors placeholder:text-white/15"
      />
    </FieldRow>
  )
}

function EmailField() {
  useRenderTracker("email-field", "EmailField", "demo-form")
  const { email, setEmail } = useFormStore()
  return (
    <FieldRow label="Email">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="bg-transparent border border-white/15 text-white text-sm px-3 py-2 outline-none focus:border-white/40 transition-colors placeholder:text-white/15"
      />
    </FieldRow>
  )
}

function RoleField() {
  useRenderTracker("role-field", "RoleField", "demo-form")
  const { role, setRole } = useFormStore()
  return (
    <FieldRow label="Role">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="bg-[#0a0a0a] border border-white/15 text-white text-sm px-3 py-2 outline-none focus:border-white/40 transition-colors"
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
    </FieldRow>
  )
}

interface SubmitButtonProps {
  submitting: boolean
  done: boolean
}

function SubmitButton({ submitting, done }: SubmitButtonProps) {
  useRenderTracker("submit-btn", "SubmitButton", "demo-form")
  return (
    <button
      type="submit"
      disabled={submitting}
      className="mt-1 px-8 py-3 border border-white/20 text-white text-sm tracking-widest uppercase hover:border-white/60 hover:bg-white/5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {submitting ? "Saving…" : done ? "Saved ✓" : "Save Profile"}
    </button>
  )
}

export function DemoForm() {
  useRenderTracker("demo-form", "DemoForm", "left-panel")
  const { username, email, role, setUsername, setEmail, setRole } = useFormStore()
  const { runProfile, runPerms } = useFormQueries()
  const { track } = useEventTracker("submit-btn")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setDone(false)

    const cascadeId = track()

    setUsername(username, cascadeId)
    setEmail(email, cascadeId)
    setRole(role, cascadeId)

    await Promise.all([runProfile(cascadeId), runPerms(cascadeId)])

    setSubmitting(false)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-[260px]">
      <p className="text-white/20 text-xs tracking-widest uppercase text-center mb-1">
        Just a button?
      </p>
      <UsernameField />
      <EmailField />
      <RoleField />
      <SubmitButton submitting={submitting} done={done} />
      <p className="text-white/15 text-xs text-center leading-relaxed">
        Watch the graph light up →
      </p>
    </form>
  )
}
