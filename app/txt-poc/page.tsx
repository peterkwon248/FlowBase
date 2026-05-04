"use client"

import { useMemo, useState, type ChangeEvent, type DragEvent } from "react"
import { FileText, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { parseTextBlocks } from "@/lib/parsers/txt-block-parser"

const CATEGORY_TONE: Record<string, string> = {
  "연락처": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  "가격": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  "사용법": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  "제품 스펙": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
  "품질/검수": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
  "CS/응대": "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900",
  "계정/인증": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900",
  "기타": "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
}

export default function TxtPocPage() {
  const [rawText, setRawText] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [dragOver, setDragOver] = useState(false)

  const blocks = useMemo(
    () => (rawText ? parseTextBlocks(rawText) : []),
    [rawText],
  )

  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>()
    blocks.forEach((b) => counts.set(b.category, (counts.get(b.category) ?? 0) + 1))
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [blocks])

  const readFile = async (file: File) => {
    const text = await file.text()
    setRawText(text)
    setFileName(file.name)
  }

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await readFile(file)
  }

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await readFile(file)
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">.txt 블록 → 표 (PoC)</h1>
        <p className="text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1 py-0.5 text-xs">***</code> 로 구분된 블록 텍스트를 표로 변환합니다.{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{`<제목>`}</code> 형태 헤더가 있으면 제목으로 추출하고,
          키워드로 카테고리를 추론합니다.
        </p>
      </header>

      <Card>
        <CardContent className="p-3">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-10 transition ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm">
              .txt 파일을 끌어다 놓거나 아래 버튼으로 선택하세요.
            </div>
            <label>
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={onPick}
                className="hidden"
              />
              <Button asChild variant="outline" size="sm">
                <span>파일 선택</span>
              </Button>
            </label>
            {fileName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> {fileName}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {blocks.length > 0 && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">블록 {blocks.length}개</CardTitle>
              <CardDescription>카테고리 분포 (AI 추천 — 사람 확정 전)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {categoryStats.map(([cat, n]) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className={CATEGORY_TONE[cat] ?? CATEGORY_TONE["기타"]}
                >
                  {cat} · {n}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-72">제목</TableHead>
                    <TableHead className="w-28">카테고리</TableHead>
                    <TableHead>내용</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map((b) => (
                    <TableRow key={b.id} className="align-top">
                      <TableCell className="text-xs text-muted-foreground">
                        {b.id}
                      </TableCell>
                      <TableCell className="font-medium">{b.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={CATEGORY_TONE[b.category] ?? CATEGORY_TONE["기타"]}
                        >
                          {b.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {b.body || <span className="italic">(내용 없음)</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
