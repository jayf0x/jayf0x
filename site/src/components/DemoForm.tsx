import { useState } from "react"
import { queue } from "../instrumentation/queue"
import { useRegistryStore } from "../store/registryStore"
import { useFormStore } from "../store/formStore"
import { useFormQueries } from "../hooks/useFormQueries"

// Register render-tree nodes
const reg = useRegistryStore.getState()
reg.registerNode({ id: "left-panel",      label: "LeftPanel",     type: "COMPONENT", slab: "RENDER_TREE" })
reg.registerNode({ id: "demo-form",       label: "DemoForm",      type: "COMPONENT", slab: "RENDER_TREE", parentId: "left-panel" })
reg.registerNode({ id: "username-field",  label: "UsernameField", type: "COMPONENT", slab: "RENDER_TREE", parentId: "demo-form" })
reg.registerNode({ id: "email-field",     label: "EmailField",    type: "COMPONENT", slab: "RENDER_TREE", parentId: "demo-form" })
reg.registerNode({ id: "role-field",      label: "RoleField",     type: "COMPONENT", slab: "RENDER_TREE", parentId: "demo-form" })
reg.registerNode({ id: "submit-btn",      label: "SubmitButton",  type: "COMPONENT", slab: "RENDER_TREE", parentId: "demo-form" })

reg.registerEdge("left-panel",     "demo-form")
reg.registerEdge("demo-form",      "username-field")
reg.registerEdge("demo-form",      "email-field")
reg.registerEdge("demo-form",      "role-field")
reg.registerEdge("demo-form",      "submit-btn")

export function DemoForm() {
  const { username, email, role, setUsername, setEmail, setRole } = useFormStore()
  const { runProfile, runPerms } = useFormQueries()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setDone(false)

    const cascadeId = queue.newCascade()
    queue.emit("USER_EVENT", "submit-btn", cascadeId)

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

      <div className="flex flex-col gap-1">
        <label className="text-white/30 text-[10px] tracking-widest uppercase">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="jay"
          className="bg-transparent border border-white/15 text-white text-sm px-3 py-2 outline-none focus:border-white/40 transition-colors placeholder:text-white/15"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-white/30 text-[10px] tracking-widest uppercase">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="bg-transparent border border-white/15 text-white text-sm px-3 py-2 outline-none focus:border-white/40 transition-colors placeholder:text-white/15"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-white/30 text-[10px] tracking-widest uppercase">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-[#0a0a0a] border border-white/15 text-white text-sm px-3 py-2 outline-none focus:border-white/40 transition-colors"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 px-8 py-3 border border-white/20 text-white text-sm tracking-widest uppercase hover:border-white/60 hover:bg-white/5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Saving…" : done ? "Saved ✓" : "Save Profile"}
      </button>

      <p className="text-white/15 text-xs text-center leading-relaxed">
        Watch the graph light up →
      </p>
    </form>
  )
}
