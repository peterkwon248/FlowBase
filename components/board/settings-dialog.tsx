// FlowBase V2 — Settings 다이얼로그 (status bar Settings 클릭으로 열림)
//
// 4 탭: General · Members · Appearance · Data.
// - General — workspace name·initial (편집), Storage (read-only stub)
// - Members — mock 멤버/권한 (시드 4명 · role Select · Invite · Remove)
// - Appearance — next-themes Light/Dark/System 카드 토글
// - Data — 전체 store JSON export (Blob 다운로드)
// 백엔드 없는 시점이라 멤버는 mock UX. Phase 2(W11)에서 실 분리.

"use client"

import { useEffect, useRef, useState } from "react"
import {
  Check,
  Download,
  LogIn,
  Monitor,
  Moon,
  Sun,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { selectIsViewer, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import {
  MEMBER_ROLE_LABELS,
  type MemberRole,
  type ThemeAccent,
  type WorkspaceMember,
} from "@/types/flowbase"

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="text-[12px]">
            Customize your workspace.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="w-full">
            <TabsTrigger value="general" data-settings-tab="general">
              General
            </TabsTrigger>
            <TabsTrigger value="members" data-settings-tab="members">
              Members
            </TabsTrigger>
            <TabsTrigger value="appearance" data-settings-tab="appearance">
              Appearance
            </TabsTrigger>
            <TabsTrigger value="data" data-settings-tab="data">
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <GeneralTab onClose={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="members" className="mt-4">
            <MembersTab />
          </TabsContent>
          <TabsContent value="appearance" className="mt-4">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="data" className="mt-4">
            <DataTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ─── General ───────────────────────────────────────
function GeneralTab({ onClose }: { onClose: () => void }) {
  const settings = useFlowBase((s) => s.settings)
  const updateSettings = useFlowBase((s) => s.updateSettings)
  const isViewer = useFlowBase(selectIsViewer)

  const [draftLabel, setDraftLabel] = useState(settings.workspaceLabel)
  const [draftInitial, setDraftInitial] = useState(settings.workspaceInitial)

  // store 값이 외부 변경 시 (다른 머신 sync 등) 동기화
  useEffect(() => {
    setDraftLabel(settings.workspaceLabel)
    setDraftInitial(settings.workspaceInitial)
  }, [settings.workspaceLabel, settings.workspaceInitial])

  const save = () => {
    const label = draftLabel.trim() || "Workspace"
    const initial =
      (draftInitial.trim() || label[0] || "W").slice(0, 1).toUpperCase()
    updateSettings({ workspaceLabel: label, workspaceInitial: initial })
    toast.success("Workspace updated")
    onClose()
  }

  const dirty =
    draftLabel !== settings.workspaceLabel ||
    draftInitial !== settings.workspaceInitial

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ws-label" className="text-[12px]">
          Workspace name
        </Label>
        <Input
          id="ws-label"
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          maxLength={60}
          placeholder="peter's workspace"
          disabled={isViewer}
          title={isViewer ? "Viewers can't edit workspace settings" : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ws-initial" className="text-[12px]">
          Sidebar initial
        </Label>
        <Input
          id="ws-initial"
          value={draftInitial}
          onChange={(e) => setDraftInitial(e.target.value.slice(0, 1))}
          maxLength={1}
          className="w-16 text-center font-semibold uppercase"
          placeholder="P"
          disabled={isViewer}
          title={isViewer ? "Viewers can't edit workspace settings" : undefined}
        />
        <p className="text-[10.5px] text-muted-foreground">
          The single letter shown on the sidebar workspace badge.
        </p>
      </div>

      <div className="border-t border-border-subtle pt-3">
        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Storage
        </div>
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-muted-foreground">Used</span>
          <span className="tabular-nums font-medium">2.1 / 10 GB</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: "21%" }} />
        </div>
        <p className="mt-2 text-[10.5px] text-muted-foreground">
          Storage tracking is currently a placeholder.
        </p>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={save}
          disabled={!dirty || isViewer}
          title={isViewer ? "Viewers can't edit workspace settings" : undefined}
        >
          Save
        </Button>
      </DialogFooter>
    </div>
  )
}

// "last seen" 상대 시간
function relativeLastSeen(iso: string | undefined): string {
  if (!iso) return ""
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

// ─── Members ───────────────────────────────────────
function MembersTab() {
  const members = useFlowBase((s) => s.settings.members)
  const currentUserId = useFlowBase((s) => s.settings.currentUserId)
  const updateMemberRole = useFlowBase((s) => s.updateMemberRole)
  const removeMember = useFlowBase((s) => s.removeMember)
  const addMember = useFlowBase((s) => s.addMember)
  const updateSettings = useFlowBase((s) => s.updateSettings)
  // viewer는 멤버 관리 불가. 단 "Switch to" (currentUserId 변경)는 데모 패턴이라 가드 우회.
  const isViewer = useFlowBase(selectIsViewer)
  const viewerTitle = isViewer ? "Viewers can't manage members" : undefined

  const [inviteOpen, setInviteOpen] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [draftEmail, setDraftEmail] = useState("")
  const [draftRole, setDraftRole] = useState<MemberRole>("member")

  const submitInvite = () => {
    const name = draftName.trim()
    if (!name) {
      toast.error("Name is required")
      return
    }
    addMember({ name, email: draftEmail.trim(), role: draftRole })
    toast.success(`${name} invited as ${MEMBER_ROLE_LABELS[draftRole]}`)
    setDraftName("")
    setDraftEmail("")
    setDraftRole("member")
    setInviteOpen(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setInviteOpen(true)}
          disabled={isViewer}
          title={viewerTitle}
          className="gap-1.5"
          data-invite-trigger
        >
          <UserPlus className="size-3.5" />
          Invite
        </Button>
      </div>

      <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            isCurrent={m.id === currentUserId}
            isViewer={isViewer}
            onRoleChange={(role) => updateMemberRole(m.id, role)}
            onRemove={() => removeMember(m.id)}
            onSwitchTo={() => {
              updateSettings({ currentUserId: m.id })
              toast.success(`Switched to ${m.name} (${m.role})`, {
                description:
                  m.role === "viewer"
                    ? "Viewer — edit buttons will be disabled."
                    : "Test role behavior across the app.",
              })
            }}
          />
        ))}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription className="text-[12px]">
              Add a person to this workspace (mock — no email is sent yet).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name" className="text-[12px]">
                Name
              </Label>
              <Input
                id="invite-name"
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Sora Han"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-[12px]">
                Email
              </Label>
              <Input
                id="invite-email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                placeholder="sora@example.com"
                type="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Role</Label>
              <Select
                value={draftRole}
                onValueChange={(v) => setDraftRole(v as MemberRole)}
              >
                <SelectTrigger data-invite-role>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitInvite} data-invite-submit>
              Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MemberRow({
  member,
  isCurrent,
  isViewer,
  onRoleChange,
  onRemove,
  onSwitchTo,
}: {
  member: WorkspaceMember
  isCurrent: boolean
  isViewer?: boolean
  onRoleChange: (role: MemberRole) => void
  onRemove: () => void
  onSwitchTo: () => void
}) {
  const isOwner = member.role === "owner"
  const lastSeen = relativeLastSeen(member.lastSeenAt)
  const viewerTitle = isViewer ? "Viewers can't manage members" : undefined

  return (
    <div
      data-member-id={member.id}
      className="flex items-center gap-3 rounded-md border border-border-subtle bg-card px-3 py-2"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[12.5px] font-semibold text-primary">
        {member.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate text-[12.5px] font-medium">{member.name}</span>
          {isCurrent && (
            <span className="rounded bg-primary/15 px-1 py-0 text-[9.5px] font-semibold text-primary">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 truncate text-[10.5px] text-muted-foreground">
          <span className="truncate">{member.email}</span>
          {lastSeen && (
            <>
              <span className="opacity-50">·</span>
              <span>{lastSeen}</span>
            </>
          )}
        </div>
      </div>
      {!isCurrent && (
        <button
          type="button"
          title={`Switch to ${member.name} (test role behavior)`}
          onClick={onSwitchTo}
          data-member-switch
          className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <LogIn className="size-3.5" strokeWidth={1.75} />
        </button>
      )}
      {isOwner ? (
        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300">
          Owner
        </span>
      ) : (
        <>
          <Select
            value={member.role}
            onValueChange={(v) => onRoleChange(v as MemberRole)}
            disabled={isViewer}
          >
            <SelectTrigger
              className="h-7 w-[100px] text-[11.5px] disabled:cursor-not-allowed disabled:opacity-50"
              data-member-role
              title={viewerTitle}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            title={viewerTitle ?? "Remove member"}
            onClick={onRemove}
            disabled={isViewer}
            data-member-remove
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Appearance ────────────────────────────────────
function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // mount 전엔 theme=undefined — placeholder만
  const current = mounted ? (theme ?? "system") : "system"

  return (
    <div className="space-y-3">
      <div className="text-[12px] text-muted-foreground">
        Theme applies to the whole workspace. Match system follows your OS
        preference.
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ThemeCard
          id="light"
          label="Light"
          icon={<Sun className="size-4" />}
          active={current === "light"}
          onClick={() => setTheme("light")}
        />
        <ThemeCard
          id="dark"
          label="Dark"
          icon={<Moon className="size-4" />}
          active={current === "dark"}
          onClick={() => setTheme("dark")}
        />
        <ThemeCard
          id="system"
          label="System"
          icon={<Monitor className="size-4" />}
          active={current === "system"}
          onClick={() => setTheme("system")}
        />
      </div>
      <AccentSection />
    </div>
  )
}

// 4 accent presets — 첫 oklch는 light, 두번째는 dark approximation (시각 표시용).
const ACCENT_PRESETS: { id: ThemeAccent; label: string; light: string; dark: string }[] = [
  { id: "purple", label: "Purple", light: "oklch(0.50 0.16 270)", dark: "oklch(0.65 0.18 270)" },
  { id: "blue", label: "Blue", light: "oklch(0.52 0.18 240)", dark: "oklch(0.65 0.20 240)" },
  { id: "emerald", label: "Emerald", light: "oklch(0.50 0.16 155)", dark: "oklch(0.62 0.18 155)" },
  { id: "amber", label: "Amber", light: "oklch(0.62 0.16 75)", dark: "oklch(0.72 0.16 75)" },
]

function AccentSection() {
  const accent = useFlowBase((s) => s.settings.themeAccent ?? "purple")
  const updateSettings = useFlowBase((s) => s.updateSettings)
  const isViewer = useFlowBase(selectIsViewer)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div className="space-y-1.5 border-t border-border-subtle pt-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Accent color
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ACCENT_PRESETS.map((p) => {
          const active = accent === p.id
          const swatch = isDark ? p.dark : p.light
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => updateSettings({ themeAccent: p.id })}
              disabled={isViewer}
              title={isViewer ? "Viewers can't change accent color" : undefined}
              data-accent-preset={p.id}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-md border bg-card px-2 py-2 transition-colors",
                active
                  ? "border-primary bg-foreground/[0.03]"
                  : "border-border-subtle hover:border-border",
                isViewer && "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className="size-6 rounded-full"
                style={{ background: swatch }}
                aria-hidden="true"
              />
              <span className="text-[11px] font-medium">{p.label}</span>
              {active && (
                <Check
                  className="absolute right-1 top-1 size-3 text-primary"
                  strokeWidth={2.5}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ThemeCard({
  id,
  label,
  icon,
  active,
  onClick,
}: {
  id: string
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-theme-card={id}
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-md border bg-card px-3 py-3.5 transition-colors",
        active
          ? "border-primary"
          : "border-border-subtle hover:border-border",
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-md",
          active
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <span className="text-[12.5px] font-medium">{label}</span>
      {active && (
        <Check
          className="absolute right-1.5 top-1.5 size-3.5 text-primary"
          strokeWidth={2.5}
        />
      )}
    </button>
  )
}

// ─── Data ──────────────────────────────────────────
function DataTab() {
  const exportData = useFlowBase((s) => s.exportData)
  const anchorRef = useRef<HTMLAnchorElement>(null)

  const handleExport = () => {
    try {
      const json = exportData()
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = anchorRef.current
      if (!a) return
      a.href = url
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      a.download = `flowbase-export-${date}.json`
      a.click()
      // 다음 tick에 revoke (Safari 호환)
      setTimeout(() => URL.revokeObjectURL(url), 0)
      toast.success("Export downloaded")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Export failed — ${msg}`)
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border-subtle bg-card p-3">
        <div className="mb-1 text-[12.5px] font-medium">Export workspace</div>
        <p className="mb-2.5 text-[11.5px] text-muted-foreground">
          Download a snapshot of all boards, library assets, automations, wiki
          pages, and settings as a JSON file. Useful for backups.
        </p>
        <Button
          size="sm"
          onClick={handleExport}
          className="gap-1.5"
          data-export-trigger
        >
          <Download className="size-3.5" />
          Export JSON
        </Button>
      </div>

      <ImportSection />

      {/* 다운로드 트리거용 숨김 앵커 */}
      <a ref={anchorRef} className="hidden" aria-hidden="true" />
    </div>
  )
}

function ImportSection() {
  const importWorkspace = useFlowBase((s) => s.importWorkspace)
  const isViewer = useFlowBase(selectIsViewer)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "")
        const parsed = JSON.parse(text)
        if (
          !parsed ||
          typeof parsed !== "object" ||
          !parsed.boards ||
          typeof parsed.boards !== "object"
        ) {
          toast.error("Invalid export file — missing boards")
          return
        }
        const boards = parsed.boards as Record<string, unknown>
        const boardCount = Object.keys(boards).length
        const libCount =
          (parsed.library?.optionLists?.length ?? 0) +
          (parsed.library?.fields?.length ?? 0) +
          (parsed.library?.templates?.length ?? 0) +
          (parsed.library?.functions?.length ?? 0) +
          (parsed.library?.dashboards?.length ?? 0)
        const wikiCount = parsed.wikiPages?.length ?? 0
        const autoCount = parsed.automations?.length ?? 0
        const totalMeta = libCount + wikiCount + autoCount
        if (boardCount === 0 && totalMeta === 0) {
          toast.warning("No data to import")
          return
        }
        if (
          !window.confirm(
            `Import:\n${boardCount} board${boardCount === 1 ? "" : "s"}` +
              `${libCount > 0 ? `\n${libCount} library asset${libCount === 1 ? "" : "s"}` : ""}` +
              `${wikiCount > 0 ? `\n${wikiCount} wiki page${wikiCount === 1 ? "" : "s"}` : ""}` +
              `${autoCount > 0 ? `\n${autoCount} automation${autoCount === 1 ? "" : "s"}` : ""}` +
              `\n\nBoards always merge with new ID.\nLibrary/Wiki/Automations skip on ID conflict.`,
          )
        ) {
          return
        }
        const summary = importWorkspace(parsed)
        const totalAdded =
          summary.boards +
          summary.library +
          summary.wiki +
          summary.automations
        const totalSkipped =
          summary.skipped.library +
          summary.skipped.wiki +
          summary.skipped.automations
        const skipBits: string[] = []
        if (summary.skipped.library > 0)
          skipBits.push(`${summary.skipped.library} library`)
        if (summary.skipped.wiki > 0) skipBits.push(`${summary.skipped.wiki} wiki`)
        if (summary.skipped.automations > 0)
          skipBits.push(`${summary.skipped.automations} automation${summary.skipped.automations === 1 ? "" : "s"}`)
        const skipDesc =
          skipBits.length > 0
            ? `Skipped (already exist by ID): ${skipBits.join(", ")}`
            : undefined
        if (totalAdded === 0 && totalSkipped > 0) {
          toast.info("Nothing new to import", {
            description: `All items already exist by ID: ${skipBits.join(", ")}.`,
          })
        } else if (totalAdded === 0) {
          toast.info("Snapshot was empty — nothing to import")
        } else {
          const addedBits =
            `${summary.boards} board${summary.boards === 1 ? "" : "s"}` +
            (summary.library > 0 ? `, ${summary.library} library` : "") +
            (summary.wiki > 0 ? `, ${summary.wiki} wiki` : "") +
            (summary.automations > 0
              ? `, ${summary.automations} automation${summary.automations === 1 ? "" : "s"}`
              : "")
          toast.success(`Imported ${addedBits}`, { description: skipDesc })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        toast.error(`Import failed — ${msg}`)
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="rounded-md border border-border-subtle bg-card p-3">
      <div className="mb-1 text-[12.5px] font-medium">Import workspace</div>
      <p className="mb-2.5 text-[11.5px] text-muted-foreground">
        Import boards, library, wiki, and automations from a previously
        exported JSON. Boards always merge with new IDs; other assets skip on
        ID conflict.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
        data-import-input
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isViewer}
        title={isViewer ? "Viewers can't import data" : undefined}
        className="gap-1.5"
        data-import-trigger
      >
        <Upload className="size-3.5" />
        Choose JSON…
      </Button>
    </div>
  )
}
