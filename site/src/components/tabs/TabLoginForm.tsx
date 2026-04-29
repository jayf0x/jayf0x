import { useState } from "react"
import { useRenderTracker } from "../../instrumentation/useRenderTracker"
import { useEventTracker } from "../../instrumentation/useEventTracker"
import { useAuthStore } from "../../store/authStore"
import { useLoginQuery } from "../../hooks/useTabQueries"
import { useRegistryStore } from "../../store/registryStore"

function UsernameField() {
  useRenderTracker("login-username", "UsernameField", "login-form")
  const { username, setUsername } = useAuthStore()
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white/30 text-[10px] tracking-widest uppercase">Username</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="admin"
        autoComplete="username"
        className="bg-transparent border border-white/15 text-white text-sm px-3 py-2 outline-none focus:border-white/40 transition-colors placeholder:text-white/15"
      />
    </div>
  )
}

function PasswordField() {
  useRenderTracker("login-password", "PasswordField", "login-form")
  const { password, setPassword } = useAuthStore()
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white/30 text-[10px] tracking-widest uppercase">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        className="bg-transparent border border-white/15 text-white text-sm px-3 py-2 outline-none focus:border-white/40 transition-colors placeholder:text-white/15"
      />
    </div>
  )
}

function LoginSubmit({ loading, done }: { loading: boolean; done: boolean }) {
  useRenderTracker("login-submit", "LoginSubmit", "login-form")
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 px-8 py-3 border border-white/20 text-white text-sm tracking-widest uppercase hover:border-white/60 hover:bg-white/5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading ? "Signing in…" : done ? "Signed in ✓" : "Sign In"}
    </button>
  )
}

export function TabLoginForm() {
  useRenderTracker("login-form", "LoginForm", "left-panel")
  const { username, password, setUsername, setPassword } = useAuthStore()
  const { run } = useLoginQuery()
  const { track } = useEventTracker("login-submit")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setDone(false)
    const cascadeId = track()
    // view → method (exact action nodes, not store root)
    const reg = useRegistryStore.getState()
    reg.registerEdge("login-submit", "set-auth-user")
    reg.registerEdge("login-submit", "set-auth-pass")
    // view → query
    reg.registerEdge("login-submit", "q-login-key")
    setUsername(username, cascadeId)
    setPassword(password, cascadeId)
    await run(cascadeId)
    setLoading(false)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-[260px]">
      <UsernameField />
      <PasswordField />
      <LoginSubmit loading={loading} done={done} />
    </form>
  )
}
