"use client"

import { useState } from "react"
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Download,
  Key,
  Globe,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface SettingItemProps {
  icon: React.ElementType
  title: string
  description: string
  children?: React.ReactNode
}

function SettingItem({ icon: Icon, title, description, children }: SettingItemProps) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-border/40 last:border-0">
      <div className="flex gap-3">
        <div className="p-2 rounded-md bg-muted/50">
          <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function SettingsSection() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-surface">
        <div>
          <h2 className="text-lg font-semibold">설정</h2>
          <p className="text-xs text-muted-foreground">계정 및 앱 설정을 관리합니다</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="h-9">
            <TabsTrigger value="profile" className="gap-1.5 text-xs px-3">
              <User className="w-3.5 h-3.5" strokeWidth={1.5} />
              프로필
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs px-3">
              <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
              알림
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs px-3">
              <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
              보안
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-xs px-3">
              <Palette className="w-3.5 h-3.5" strokeWidth={1.5} />
              외관
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5 text-xs px-3">
              <Database className="w-3.5 h-3.5" strokeWidth={1.5} />
              데이터
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">프로필 정보</CardTitle>
                <CardDescription className="text-xs">
                  공개 프로필 정보를 수정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <Button variant="outline" size="sm" className="text-xs h-7 border-border/60">
                      사진 변경
                    </Button>
                    <p className="text-[10px] text-muted-foreground">JPG, PNG 최대 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs">이름</Label>
                    <Input id="name" defaultValue="홍길동" className="border-border/60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">이메일</Label>
                    <Input id="email" type="email" defaultValue="hong@example.com" className="border-border/60" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs">소개</Label>
                  <Input id="bio" placeholder="간단한 자기소개..." className="border-border/60" />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" className="h-8 text-xs">변경사항 저장</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">알림 설정</CardTitle>
                <CardDescription className="text-xs">
                  알림 수신 방법을 설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingItem
                  icon={Bell}
                  title="이메일 알림"
                  description="중요한 업데이트를 이메일로 받습니다"
                >
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </SettingItem>
                <SettingItem
                  icon={Bell}
                  title="푸시 알림"
                  description="브라우저 푸시 알림을 받습니다"
                >
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </SettingItem>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">보안 설정</CardTitle>
                <CardDescription className="text-xs">
                  계정 보안을 강화합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingItem
                  icon={Key}
                  title="비밀번호 변경"
                  description="마지막 변경: 30일 전"
                >
                  <Button variant="outline" size="sm" className="h-7 text-xs border-border/60">
                    변경
                  </Button>
                </SettingItem>
                <SettingItem
                  icon={Shield}
                  title="2단계 인증"
                  description="SMS 또는 인증 앱으로 추가 보안"
                >
                  <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                </SettingItem>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">외관 설정</CardTitle>
                <CardDescription className="text-xs">
                  앱의 테마와 언어를 설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingItem
                  icon={Palette}
                  title="테마"
                  description="라이트, 다크 또는 시스템 설정"
                >
                  <Select defaultValue="system">
                    <SelectTrigger className="w-32 h-8 text-xs border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">라이트</SelectItem>
                      <SelectItem value="dark">다크</SelectItem>
                      <SelectItem value="system">시스템</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingItem>
                <SettingItem
                  icon={Globe}
                  title="언어"
                  description="인터페이스 언어 설정"
                >
                  <Select defaultValue="ko">
                    <SelectTrigger className="w-32 h-8 text-xs border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingItem>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">데이터 관리</CardTitle>
                <CardDescription className="text-xs">
                  데이터 내보내기 및 삭제
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingItem
                  icon={Download}
                  title="데이터 내보내기"
                  description="모든 데이터를 JSON 또는 CSV로 내보내기"
                >
                  <Button variant="outline" size="sm" className="h-7 text-xs border-border/60">
                    내보내기
                  </Button>
                </SettingItem>
                <SettingItem
                  icon={Database}
                  title="계정 삭제"
                  description="모든 데이터가 영구적으로 삭제됩니다"
                >
                  <Button variant="destructive" size="sm" className="h-7 text-xs">
                    삭제
                  </Button>
                </SettingItem>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
