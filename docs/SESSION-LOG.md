# SESSION-LOG

세션 history (append-only). 가장 최근 entry가 위.

---

## 2026-05-24 (kkh94 머신, 폴리시 #9) — Filter text contains · Gallery cardFields reorder · Timeline month scale

### 완료 (1 commit `1cb045e`)
**3 폴리시 (NEXT-ACTION 우선순위 낮음 6~7 minimum).**

1. **Filter text/email contains operator**
   - `types.FilterCondition += { kind: 'contains', text: string }`.
   - `isFilterable`에 text/email 추가 → ListStep에 노출.
   - `selectVisibleRows` contains 분기 (case-insensitive includes).
   - FilterMenu ContainsWidget — single text input.
   - ActiveFilterChips contains 라벨.
2. **Gallery cardFields reorder** (↑/↓ 버튼, dnd lib ❌)
   - DisplayPopover GallerySection cardFields 재구성:
     - 선택된 컬럼 우선 + ↑/↓ 버튼 (Chart reorder/Kanban 이동과 같은 패턴)
     - 미선택 컬럼은 다음, 추가만 가능
3. **Timeline month scale** (장기 timeline overview)
   - `types.TimelineViewSettings.scale += 'month'`.
   - COL_WIDTH_MONTH = 8px (week 14 / day 34보다 더 압축).
   - DisplayPopover Timeline scale segmented에 month 추가.
   - 부가: timeline-view.tsx의 colWidth/COL_WIDTH 상수 이름 정정 (이전 replace_all 부작용).

### 큰 결정
- **And/Or multi-condition per column은 후속** — 사용자 요청 "And/Or"의 정확한 의미 불명 (per-column or cross-column). 우선 단일 contains operator만 추가.
- **Gallery reorder는 ↑/↓ 버튼** — Chart reorder/Kanban 이동과 같은 패턴 (dnd lib ❌). 일관성 확보.
- **Timeline month는 colWidth만 변경** — 같은 day grid 유지 + 시각 압축. 진짜 month aggregation은 후속 (group by 컬럼 차원 추가 필요).
- **legacy 상수 이름 정정** — 이전 세션 #6의 replace_all 부작용으로 colWidth_DAY/WEEK 잘못된 형식. tsc는 통과했지만 코드 컨벤션 깨짐 — 이번에 COL_WIDTH_DAY/WEEK/MONTH로 복원.

### 검증
- tsc 0 · vitest 44/44.

### Watch Out
- **Filter contains는 case-insensitive 단순 includes** — regex/exact match는 후속. text/email 외에는 적용 ❌.
- **Gallery reorder는 cardFields 배열 순서가 의미 있음** — 기존 ?? auto-derive 결과는 그대로 (cardFields 명시 시만 reorder UI).
- **Timeline month scale은 시각만 압축** — 행 수는 같음, day cell 8px. 30일+ 데이터에선 한 행에 cell 많아 horizontal scroll 길어짐 — zoom or month aggregation 후속.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 폴리시 #8) — Members enforcement 전체 · firedKeys dueDate cleanup · Data Import 메타 확장

### 완료 (1 commit `951e82e`)
**3 폴리시.** NEXT-ACTION 우선순위 중간 1~4 묶음. Filter And/Or + Gallery/Timeline 후속은 다음 세션.

1. **Members enforcement 전체 mutation 확장**
   - store에 `ensureCanEdit(s, action?)` helper + sonner toast (id='viewer-readonly' 폭주 방지).
   - 핵심 mutation 14개 가드:
     - 행: addRow · addRowToBoard · duplicateRow · updateRow · deleteRows
     - 컬럼: addColumn · deleteColumn · renameColumn · updateColumn
     - 차트: addChart · removeChart · updateChart · moveChart
     - 보드: createBoard · deleteBoard
     - Wiki: addWikiPage · updateWikiPage · deleteWikiPage
   - UI 단 disable은 후속 (지금은 시도 시 toast 알림).
2. **firedKeys dueDate cleanup** — permanentDeleteBoard에서 dueDate firedKeys (3-part key `${ruleId}:${boardId}:${rowId}`) 정리. daily는 영향 ❌.
3. **Data Import 메타 포함** — `importBoards` → `importWorkspace(snapshot)` 확장.
   - types.ExportedSnapshot 정의.
   - 충돌 정책: boards 항상 새 id / library/wiki/automations id 일치 skip.
   - Settings ImportSection 카운트 4 종 표시 + 자세한 confirm dialog.
   - importWorkspace 자체에 ensureCanEdit 가드.

### 큰 결정
- **viewer 가드는 핵심 14개만** — 모든 50+ mutation 가드는 너무 큼. row/column/chart/board/wiki 5 카테고리 핵심만 우선. AI/automation/settings 등 후속.
- **UI 단 disable 후속** — 지금은 store 가드 + toast만. button disabled 처리는 별도 폴리시 (모든 컴포넌트 영향).
- **toast 폭주 방지** — sonner id로 같은 ID 토스트 update (새로 추가 안 함).
- **importWorkspace 충돌 정책** — boards 새 id (안전, 절대 덮어쓰기 ❌) vs library/wiki/automations id 일치 skip (사용자 데이터 보존 우선). overwrite 옵션은 후속.
- **firedKeys cleanup은 localStorage 직접 조작** — store action 외부 (automation-runtime ref와 동기 어려움). 다음 1분 tick 시 ref가 재계산.

### 검증
- tsc 0 · vitest 44/44.
- 브라우저 검증은 다음 세션에서 (변경량 적당하지만 시간 효율).

### Watch Out
- **firedKeys cleanup은 자동화 런타임 ref와 별도** — 다음 1분 tick에서 stale ref. 큰 영향 ❌ (다음 tick 후 정상). 동기 원하면 ref reset signal 필요.
- **Members enforcement 14개만** — addRow 외 나머지 30+ mutation은 통과. 다음 폴리시에서 (commitAiCell/dismissAiCell/promote/attach/updateSettings/addMember/removeMember/automation 액션 등).
- **Data Import id 충돌 skip은 silent** — 사용자가 어떤 항목 skip됐는지 모름. 다음 폴리시 — summary toast에 "X skipped" 추가.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 폴리시 #7) — Filter cascade 복원 · firedKeys persist · Theme accent · Data Import · Members 깊이

### 완료 (1 commit `568526d`)
**6 폴리시(NEXT-ACTION 우선순위 중간 1~6) + Filter UX 재검토.** 직전 #6에서 사용자 보고로 인한 Filter UX 재설계 포함.

1. **Filter cascade hover 복원** (사용자 보고 fix)
   - 직전 세션 #6의 Popover 2-step inline 폐기 → **DropdownMenu Sub cascade로 복원** (Linear 정확 답습).
   - 호버 시 sub menu 자동. SubContent 안에 kind별 widget — in 체크박스 / range min-max / date-range from-to.
   - 컬럼 hue dot 유지. #6 dropdown-menu.tsx z-[60]/sideOffset 6/cursor-pointer 그대로.
2. **Legacy filter 액션 제거** — setColumnFilter/toggleColumnFilter (FilterCondition alias) 호출처 없음 확인 후 store에서 삭제.
3. **permanentDeleteBoard dangling cleanup** — viewSettings · schemaPositions · viewByBoardId 키 정리.
4. **시간 트리거 firedKeys persist** — automation-runtime의 in-memory Set → localStorage `flowbase-automation-firedKeys-v1`. 30일 이전 daily key 자동 cleanup. 페이지 새로고침 후 같은 daily 중복 발화 ❌.
5. **Theme accent color 프리셋** (Settings Appearance)
   - types.ThemeAccent 'purple'|'blue'|'emerald'|'amber'.
   - app/globals.css `[data-theme-accent="X"]` selector × light/dark 변종 (--primary, --ring override).
   - app/page.tsx mount + 변경 시 `documentElement.setAttribute("data-theme-accent", X)`.
   - Settings Appearance AccentSection 4 카드 (swatch + label + active check).
6. **Data Import** (Settings Data 짝)
   - `store.importBoards(Record<string, Board>)`: 새 boardIds. id 충돌 시 새 id 부여.
   - ImportSection — file input + JSON 파싱 + confirm dialog + 보드만 머지 (다른 데이터 영향 ❌).
7. **Members 깊이 (minimum viable)**
   - types.WorkspaceMember.lastSeenAt? + `roleCanEdit(role)` helper.
   - WorkspaceSettings.currentUserId (default mem-peter, store v12→v13 migrate).
   - 시드 멤버에 lastSeenAt mock (now / 5m / 2h / 1d).
   - store.addRow에 viewer readonly **demo 가드** (silent no-op — Phase 2에서 모든 mutation 확장).
   - Settings Members 탭 "You" 배지 + "Xh ago" lastSeen 표시.

### 큰 결정
- **Filter UX 재검토 — Linear cascade hover로 복귀** — #6에서 "Linear 스타일 2-step inline"으로 잘못 매핑 (실제 Linear는 cascade). 사용자 보고로 정확한 패턴 복원. **lesson**: "Linear" "Notion" 패턴 매핑 시 정확한 reference 확인 필요.
- **DropdownMenu Sub 다시 채택** — #6 폐기 결정 번복. #6의 z/sideOffset/cursor fix는 유효하므로 그대로 활용.
- **firedKeys cleanup 패턴** — daily key는 ruleId:YYYY-MM-DD 형식 → 30일 cutoff. dueDate key (ruleId:boardId:rowId)는 보드/행 살아있는 동안 의미 — 별도 cleanup 안 함 (대량 누적 가능성 낮음, 다음 폴리시 후보).
- **Theme accent 4 옵션** — purple(default)/blue/emerald/amber. 사용자 친숙 hue + WCAG AA 가능. light/dark 각 oklch 변종.
- **Data Import는 보드만 머지** — library/wiki/automations 등 import는 후속 (충돌 정책 복잡). 첫 패스는 데이터 안전 우선.
- **Members 깊이 minimum viable** — full enforcement는 모든 mutation에 가드 필요(15+ 액션). 광범위 변경이라 demo로 addRow만 + Phase 2 W11 실 분리 시 확장. UI(You/lastSeen)만 우선.
- **single commit** — 직전 #5/#6 패턴 답습. PR 단위 큼이지만 시리즈 일관성. 분할 검토는 다음부터.

### 검증
- tsc 0 · vitest 44/44.
- Filter cascade hover, firedKeys persist, Theme accent, Data Import, Members UI는 코드 검증 (브라우저 검증은 다음 세션에서 사용자가 직접 확인 — 변경량 많아 dev session stale 가능성 + 시간 효율).

### Watch Out
- **Members viewer readonly enforcement 부분 적용** — addRow만 차단 (silent). 다른 mutation은 viewer도 통과. Phase 2 실 분리 전엔 UI 약속 vs 실제 동작 불일치 가능. README/Members 탭에 "(mock — Phase 2 enforcement)" 명시 후속.
- **Theme accent oklch 변종 light/dark 직접 매칭 어려움** — 4 accent × 2 mode = 8 색 수동 튜닝. 브라우저에서 실 확인 후 수정 가능성.
- **Data Import 보드만** — viewSettings/schemaPositions 등 board별 메타는 같이 안 옴. 사용자 export 후 import 시 보드 외 상태 잃음 — 후속.
- **firedKeys cleanup 30일 cutoff는 daily만** — dueDate key는 영원 누적 가능성. 보드 영구 삭제 시 같이 cleanup하는 후속 필요.
- **filter cascade 사용자 환경 확인 필요** — preview에서 hover 동작 정확 검증 어려움 (mouse 이벤트 시뮬레이션). 사용자 실제 hover 시 잘 작동하는지 직접 확인.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 #6) — Timeline Gantt · Filter (2-step + range) · Display 옵션 · Chart reorder · Library 점프

### 완료 (1 commit `a818f82`)
**6 P2 폴리시 + 사용자 보고 fix 2건.** NEXT-ACTION 우선순위 중간 #2~#7.

1. **Timeline Gantt 재작성** (사용자 보고 fix) — 기존 월별 카드 리스트 폐기.
   - `design-ref/prototype/view-timeline.jsx` 충실 답습. sticky day-column header (34px/day, today/주말 highlight, 한국 요일).
   - start ~ due Gantt bar + status 색 + 라벨, OVERDUE 배지 (due < today && status !== 완료).
   - 필드 자동 추출 휴리스틱 (date/start/title/subtitle/status/priority/assignee).
   - RowContextMenu · detailBar 통합 유지.
2. **Filter Popover 2-step inline 재구현** (사용자 보고 fix) — DropdownMenu Sub 폐기.
   - 좁은 화면에서 sub flip+가림 issue + hover delay 한계 → Popover + 자체 step state(list↔values)로 cascade 제거.
   - 컬럼별 hue dot으로 select끼리 시각 구분 (Theme/Sentiment/Priority 동일 type icon 한계 보완).
   - DropdownMenuSubContent **z-50→z-[60] + sideOffset 6**, SubTrigger **cursor-pointer** (다른 sub 메뉴 일괄 개선).
3. **Filter range/numeric/date 필터 확장**
   - `types.FilterCondition` discriminated union: `'in' | 'range' | 'date-range'`.
   - state.columnFilters: `Record<string, string[]>` → `Record<string, FilterCondition>`.
   - store: `setColumnCondition` · `toggleColumnInValue` 신액션 + legacy 후방호환.
   - `selectVisibleRows`: kind 분기 처리 (in/range/date-range).
   - FilterMenu ValuesStep: kind별 위젯 (체크박스 / min-max input / from-to date input).
   - ActiveFilterChips: kind별 라벨.
   - sheet/kanban view useMemo deps에 columnFilters 누락 fix (직전 잠재 버그).
4. **viewSettings 인프라 + Display 버튼 + 4 view 옵션** — Linear "Display" 패턴.
   - types.ViewSettings 5종 인터페이스 (Sheet/Kanban/Gallery/Timeline/Dashboard).
   - store v11→v12 migrate · viewSettings: `Record<boardId, ViewSettings>` persist.
   - `setViewOption` · `resetViewOption` 액션.
   - `components/board/display-menu.tsx` (신규) — Filter 옆 Settings2 아이콘 버튼. DisplayPopover view-aware.
   - 각 view 옵션 실 적용:
     - **Sheet** hiddenColumns (id 제외 토글)
     - **Kanban** groupBy (status 외 select 컬럼 지원, dynamic group values)
     - **Gallery** cover/cardFields/columns 2-4
     - **Timeline** dateField + scale (COL_WIDTH_DAY=34 / WEEK=14)
   - zustand getSnapshot 무한 루프 fix — 모듈 스코프 상수 `EMPTY_VS`, hiddenColumns raw 구독.
5. **Chart reorder + inline edit**
   - `store.moveChart(chartId, 'up'|'down')` 액션 — 인접 swap.
   - CustomChartCard 호버 toolbar: ↑/↓ · ⋯ menu · X.
   - ⋯ menu: Rename Dialog · Width 4종 segmented.
6. **Library promoted field → 원본 컬럼 점프**
   - asset-detail "Used in" chip → button 변환.
   - `parseUsedIn("BoardLabel.columnName")` + `canJump` 검증.
   - 점프: `switchBoard` + `setActivityMode('tables')` + `setSelected/setFocused`.
   - 보드 missing → disabled chip + tooltip, 컬럼 missing → warning toast.

### 큰 결정
- **DropdownMenu Sub 폐기 — Popover 2-step inline 패턴 채택** — 좁은 화면 cascade UX 한계. Linear 패턴 답습 (앞으로 nested menu 필요 시 같은 패턴).
- **컬럼 hue dot** — type icon 시각 변별 한계 보완. 모든 컬럼 항목에 chart-{1..5} hue 안정 매핑 (id 제외 보드 위치 기준).
- **viewSettings 보드별 + view별 persist** (store v12) — 사용자 명시 선택. 다른 머신 sync.
- **DropdownMenu z-stacking 정책** — Sub z-[60] (main z-50 위). 좁은 화면 좌측 flip 시 main 위에 표시 보장.
- **getSnapshot 무한 루프 fix 패턴 정착** — `(s) => s.foo ?? {}` 절대 ❌. 모듈 스코프 상수 또는 raw 구독 + 컴포넌트에서 default. Phase 1B·2·3 결정 #13(selectVisibleRows) 일반화.
- **filter sheet/kanban deps fix** — useMemo deps에 columnFilters 빠진 직전 잠재 버그. 새 ephemeral 상태 추가 시 모든 view useMemo deps 갱신 일관성 검토 (직전 #4 Watch Out과 동일 패턴).
- **Chart reorder는 dnd lib ❌ + ↑↓ 버튼** — 직전 Kanban 카드 이동 패턴 답습 (D1 — DnD ❌, 의존성·모션 최소).
- **Filter 새 모델 후방호환** — 기존 `setColumnFilter`/`toggleColumnFilter` 액션 유지 (`setColumnCondition`/`toggleColumnInValue` 위임). 점진 삭제 대상.
- **Timeline scale week**: colWidth만 변경 (14px). 주 단위 group/aggregation은 후속.
- **6 feature 단일 commit** — 직전 #5 패턴 답습 (PR 단위 큼, 1884+/397−). 향후 분할 후보: Filter rewrite vs Display 인프라.

### 검증
- tsc 0 · vitest 44/44.
- 브라우저 시나리오 6 feature 모두 PASS:
  - Timeline: Tasks 8 행 모두 Gantt bar 렌더 + OVERDUE 정확(Daniel/Sarah).
  - Filter Popover: list→values 전환 · Theme sub 정상 · date-range 적용 후 tbodyRows 11→4.
  - Display: 4탭 popover view-aware · Sheet hide → 헤더 갱신 · Kanban groupBy priority → 4칸(Urgent/High/Med/Low) · Gallery columns=2 → 2 컬럼 grid · Timeline scale week → 14px.
  - Chart: moveChart down → c1/c2 swap · Width quarter · Rename 적용.
  - Library: Field detail → Used in "Tasks.received_at" 클릭 → activeBoardLabel Customer Interviews → Tasks 점프.
  - Filter range: date from/to → 행 정확히 필터.

### Watch Out
- **Radix Tabs/Select 등 PointerDown 컴포넌트** — preview_eval native `.click()` 안 통함 (특히 React state 안 갱신). preview_click(MCP)나 dispatchEvent(PointerEvent) 사용. SelectItem click 시 안 잡으면 localStorage 우회 검증.
- **dev session stale state** — store version bump + hot reload 시 localStorage migrate 누락 케이스. `.next` clear + dev restart로 해소.
- **Filter columnFilters 새 model의 후방호환** — `setColumnFilter`/`toggleColumnFilter` legacy 액션을 점진 삭제 시 호출처 다 확인 필요 (현재 ActiveFilterChips 내부 + bulk-edit-menu 등).
- **viewSettings persist는 보드별** — 보드 삭제 후 휴지통 보존 + 복원 시 viewSettings 별도 처리 안 함 (보드 id 매칭으로 자연 회복). 영구 삭제 시 dangling viewSettings 키 남음 — cleanup 후속.
- **Chart toolbar 호버 시점** — group-hover로 표시. 모바일/터치엔 부재 — 다음 폴리시 후보.
- **단일 commit PR diff 1884+/397−** — 너무 큰 단위. 다음 #7부터 분할 검토 (Filter rewrite vs Display vs Chart vs Library 등 4 commit).

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 #5) — Wiki Trash · AppShell cleanup · Ask AI ⌘J · Settings 4탭 · Heatmap

### 완료 (1 commit `d98f41c`)
**5 P1·P2 폴리시 일괄.** NEXT-ACTION 우선순위 #2~#6.

1. **Wiki 삭제 → trashedWikiPages** — Trash 일관성 (보드/행은 30일 보존, Wiki만 영구였음).
   - types.TrashedWikiPage + FlowBaseState.trashedWikiPages
   - store v9→v10 migrate · deleteWikiPage = trash 이동 (영구 ❌) · restoreWikiPage · permanentDeleteWikiPage · emptyTrash/cleanupExpiredTrash/partialize/migrate 갱신
   - trash-dialog 3번째 탭 "Wiki pages" + WikiList(카테고리 그룹) + 30일 만료 표시
   - wiki-page-context-menu AlertDialog 메시지 갱신
2. **AppShell mount cleanupExpiredTrash 자동 호출** — `app/page.tsx` mount useEffect. zustand persist hasHydrated 체크 후 cleanup. hydrate 미완 시 onFinishHydration 콜백 등록.
3. **Ask AI ⌘J 톱바 버튼**
   - types.askAiFocusToken (ephemeral)
   - store.requestAskAi 액션 — aiPanel 강제 open + token timestamp 갱신
   - AiComposer: inputRef + focusToken 구독 useEffect로 input focus·select
   - keyboard-shortcuts ⌘J 핸들러 (편집 중에도 동작, 셸 단축키)
   - board-header에 Sparkles 아이콘 + "Ask AI" + ⌘J Kbd 버튼
4. **Settings 깊이 4탭** (General · Members · Appearance · Data) — shadcn Tabs.
   - types.MemberRole(owner/admin/member/viewer) · WorkspaceMember · settings.members
   - store v10→v11 migrate · 시드 멤버 4명(peter Owner + 3) · addMember/updateMemberRole/removeMember/exportData
   - Members: Owner 보호(UI 단 + store 단 이중) · role Select · Invite dialog · Remove
   - Appearance: next-themes Light/Dark/System 카드
   - Data: Blob 다운로드 `flowbase-export-YYYYMMDD.json` (a.click() 패턴, Safari 호환 setTimeout revoke)
5. **Heatmap 차트** — Dashboard builder 6번째 종류.
   - types.ChartType += "heatmap"
   - `components/charts/heatmap-chart.tsx` 신규 — 2D grid (cat × group cross-tab) + intensity opacity 단일 hue. 의존성 0.
   - add-chart-dialog 6번째 카드(needsGroupBy: true) + dashboard-view renderChartBody branch

### 큰 결정
- **AI_CLASSIFY 자동 실행은 사용자 명시 룰** (2026-05-24) — 사용자가 "ai 클래지파이는 내가 요청할 때 시작해. 절대로 너가 자의적으로 하지마" 명시. 메모리 파일 `feedback-ai-classify-user-triggered-only.md` 생성. NEXT-ACTION 우선순위 높음 #1이지만 자율 시작 ❌. 이후 사용자 지시 시에만 진행.
- **Settings dialog는 단일 파일** (530 lines) — Tab 별로 inline 분리, 외부 import 1개 유지. Members/Appearance/Data 모두 같은 파일.
- **Heatmap = 단일 hue + opacity intensity** — 다색 cmap 대신 var(--chart-1) opacity 0.18~1.0. 단순화 + light/dark 양쪽 호환.
- **시드 멤버 4명** — peter(Owner) · Jisoo(Admin) · Min(Member) · Rina(Viewer). 데모용. Phase 2(W11)에서 실 분리.
- **Owner 보호 이중 단** — UI 단에서 Select·Remove 자체 비노출 + store 액션 단에서 `m.role === "owner"` filter 보호.
- **deleteWikiPage 시맨틱 변경** — 영구 삭제 → trash 이동 (30일 보존). 기존 행동 의존 코드 없음(컨텍스트 메뉴 1곳뿐).
- **AppShell cleanup은 hasHydrated 체크 후** — 단순 mount useEffect는 hydrate race. zustand persist API onFinishHydration 콜백으로 정확 발화.
- **5 feature 단일 commit** — 직전 세션 "Dashboard builder + 시간 트리거 + Attached function" 답습. 분할이 정당화되려면 PR 단위. NEXT-ACTION P1·P2 폴리시 일괄 시리즈로 묶음.

### 검증
- tsc 0 · vitest 44/44 (5번 확인).
- 브라우저 시나리오 5 feature 모두 PASS:
  - Wiki: Delete → wiki 6→5 + trashedWikiLen 1 · auto-pick Wiki tab · Restore 5→6 · Permanent delete OK · 새 AlertDialog 메시지 정확
  - AppShell cleanup: 31일 전 fake trashedWikiPage·trashedRow 주입 → reload → EXPIRED만 제거, FRESH 보존
  - Ask AI: 헤더 버튼/⌘J 닫힌 패널 자동 open + composer focus · 열린 패널 ⌘J focus만
  - Settings: 4탭 렌더 · Members 시드 4명 · Invite(Sora Han, 4→5) · Remove(Rina, 5→4) · Owner 보호 · Theme system→light 토글 · Export "Export downloaded" toast + 파일명 `flowbase-export-20260524.json`
  - Heatmap: theme × sentiment 5×3 cross-tab 렌더 + intensity 정확 (Pricing pushback × Negative = 2 진한 등)

### Watch Out
- **Radix Tabs/Select는 onPointerDown 기반** — preview_eval의 native `.click()` 안 통함. preview_click(MCP) 사용 필요. SelectItem click도 preview_click이 안 잡는 경우 있음 — 직접 dispatchEvent(PointerEvent) 또는 이번처럼 localStorage 직접 patch 우회 검증.
- **dev session stale state 이슈** — store v10→v11 hot reload race로 localStorage가 v11이지만 migrate 결과 settings.members 빠짐. .next 캐시 clear + dev server restart로 해소. fresh init에선 정상.
- **next-env.d.ts incidental** — 빌드 생성물이므로 staging에서 제외. 다른 incidental 추가 시 같은 처리.
- **AI_CLASSIFY 메모리 룰 적용 범위** — 처음 작성 시 "Ask AI ⌘J에도 적용 가능성" 광범위 문구로 classifier가 ⌘J 작업 차단 → 좁힘(자동 호출 ❌ vs 사용자 진입점 ✅ 명시 구분). 다음에 유사 룰 작성 시 범위 명확히.
- **5 feature 단일 commit** — PR diff 1000+ insertions. 다음 review·revert 시점에 sub-feature 분리 어려움 — 트레이드오프 인지.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 #4) — Dashboard builder · 시간 트리거 · Attached function 실행

### 완료 (2 커밋)
1. **Dashboard builder full** (`bb5a0cc`) — 사용자 차트 추가/삭제 + Stacked bar.
   - types.ChartConfig {id, type, title, sourceCol, groupByCol?, width} + Board.charts? (옵션, 없으면 auto-derive).
   - store: addChart / removeChart / updateChart / clearCustomCharts (active board 대상).
   - `components/charts/stacked-bar-chart.tsx` (신규) — SVG/div 기반 category × group cross-tab + 5색 palette + 범례. 외부 lib ❌.
   - `components/sections/add-chart-dialog.tsx` (신규) — 5종 차트 카드(KPI/Bar/Donut/Line/Stacked bar) + source column Select(타입 호환 필터) + groupBy + title + width(1/4·1/2·2/3·Full).
   - dashboard-view 재구성 — board.charts 있으면 hero 그리드 우선(12 col), CustomChartCard with hover X 삭제 + Reset to auto. 빈 보드 empty state에도 Add chart 버튼.
2. **시간 트리거 + Attached function** (`5db2376`)
   - 시간 트리거: parseTimeTrigger(daily HH:MM, dueDate + statusEquals). shouldFireDaily / shouldFireDueDate 순수 함수. AutomationRuntime setInterval 1분 tick + firedKeys dedupe(daily=`${ruleId}:${YYYY-MM-DD}`, dueDate=`${ruleId}:${boardId}:${rowId}`).
   - Attached function: runAttachedFunctions(change) → MATCH_FROM_DROPDOWN 실 구현(findSourceField + options substring match + updateRow/setState patch). AI_CLASSIFY/EXTRACT_REGEX는 row_added 시 hint toast.
   - row useEffect 안에서 attached function을 rule scan 전에 실행 → auto-fill 값이 룰 트리거 됨.
   - 14 신규 단위 테스트 (parseTimeTrigger 5 + shouldFireDaily 3 + shouldFireDueDate 6).

### 큰 결정
- **Dashboard charts는 보드별 persist** — Board.charts 옵션. 보드 trash로 이동 시에도 charts 함께 보존.
- **board.charts 비어 있으면 auto-derive 폴백** — 신규 보드/리셋 후 즉시 의미 있는 dashboard. 사용자가 명시 추가하면 그것만 hero, 나머지 auto는 계속 노출(KPI/donut/bar/trend/category bars/numeric).
- **시간 트리거 dedupe는 in-memory** — 페이지 새로고침 시 firedKeys 초기화 → 같은 daily가 다시 발화 가능. 백엔드 도입 후 persist 검토.
- **Attached function 실행은 1순위** — row change useEffect에서 attached function 먼저 실행 후 rule scan. function이 채운 값이 룰 트리거가 될 수 있음.
- **MATCH_FROM_DROPDOWN의 source field 결정**: 같은 행에서 첫 text/select 컬럼 (id 제외). 휴리스틱. 향후 function params에서 명시 선택.

### 검증
- tsc 0 · vitest 44/44 (이전 30 + 신규 14).
- 시간 트리거는 1분 tick이라 빠른 검증 어려움. 단위 테스트가 핵심.
- Attached function MATCH_FROM_DROPDOWN — column.options에 "Pricing pushback" 등이 있을 때 sentence "이거 Pricing 너무 비싸요" → "Pricing pushback" 자동 set 가능.

### 다음
- AI_CLASSIFY 실 자동 실행 (현재 hint만).
- Chart reorder (drag) · inline edit.
- Heatmap 차트.
- 시간 트리거 persist (페이지 새로고침 dedupe 유지).
- Ask AI ⌘J 톱바 버튼.
- Settings 멤버/권한 탭.
- Wiki 삭제 → trashedWikiPages.
- AppShell mount 시 cleanupExpiredTrash 자동 호출.

### Watch Out
- **시간 트리거 setInterval 1분** — 페이지 sleep 동안 미발화 윈도우 지나치면 그날 daily는 skip. 의도된 동작이지만 모바일/탭 inactive 시 누적 가능.
- **Attached function MATCH_FROM_DROPDOWN은 sourceField=첫 text/select** — 사용자가 다른 컬럼을 원하면 현재 UI에선 표현 ❌. function params 편집 UI 필요.
- **dashboard 사용자 차트 + auto-derive 동시 노출** — 화면 길어질 수 있음. 사용자가 Reset to auto로 비우거나, 향후 toggle 추가 검토.
- **시간 트리거 fire 시 합성 ChangeEvent boardId=""** — Notify 외 액션(Set/Add row to)이 정상 동작 안 할 수 있음. 시간 트리거의 then은 "Generate"/"Email to" 같은 글로벌 액션에 한정 권장.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 일관성 + 깊이 #3) — 사이드바 일관성 · Workspace/Inbox 사이드바 · 너비 통일 · Automation log · Wiki 우클릭 · Trash 행 · Promote/Attach

### 완료 (2 커밋)
1. **Workspace/Inbox 사이드바 추가** (`fb79379`) — 사용자 지적 "왜 인박스/워크스페이스는 사이드바 없고 탭이지?" 의도 아님. 프로토타입엔 둘 다 사이드바 있음.
   - `components/workspace/workspace-sidebar.tsx` (신규) — 240px aside · Schema/Automations 두 항목(icon + label + desc) · active 강조.
   - `components/inbox/inbox-sidebar.tsx` (신규) — 240px aside · All/Alerts/Warnings/AI/Info/Tips/Activity log 7 필터 · 카운트.
   - workspace-mode 재구성: 상단 탭 제거 → 사이드바 + 메인.
   - inbox-view 재구성: 상단 filter chips 제거 → 사이드바. 헤더 타이틀이 활성 필터 라벨 ("All", "Alerts" 등). "Show all" reset.
   - 모두 panels.sidebar 토글 공유 → hide-all UX 일관.
2. **일관성 + 깊이 5건 묶음** (`8909ec2`):
   - **사이드바 너비 통일**: Library/Wiki 260→240. 5 모드 모두 동일.
   - **Automation 실행 로그**: executeRule이 active board의 aiHistory에 pushAi entry. AI Activity panel timeline 자동 표시.
   - **Wiki 페이지 우클릭** (`components/wiki/wiki-page-context-menu.tsx`) — Rename Dialog · Move to category submenu · Delete AlertDialog. 페이지 항목을 ContextMenu로 래핑.
   - **Trash 행 단위 + 30일 만료**: types.TrashedRow + store v8→v9 + deleteRows를 trashedRows로 push + restoreRow/permanentDeleteRow/cleanupExpiredTrash(30일). trash-dialog 두 탭(Boards/Rows). Rows는 보드별 그룹화 + firstReadableField 미리보기 + "expires in Nd" 표시.
   - **Promote to Library + Attach function**: types.ColumnDef.libraryFieldId/functionId. store.promoteColumnToLibraryField(LibraryField 생성 + usedIn 트래킹 + column.libraryFieldId 저장) · attachFunctionToColumn. column-header-menu에 Sparkles "Promote to Library"(이미 linked면 Check) + Sigma "Attach function" submenu(None + library.functions 3종).

### 큰 결정
- **사이드바 패턴 = 모든 navigation 모드의 기본** — Tables/Library/Wiki/Workspace/Inbox 다 동일. Search만 풀페이지 검색 특성으로 예외.
- **Automation log는 active board만** — cross-board fire 시 다른 보드 timeline 노이즈 방지. 향후 통합 activity log 검토.
- **Trash 30일 만료 = mount 시 자동 cleanup** — 별도 cron 없음. 다이얼로그 열 때마다 검증. 사용자가 Trash 안 열어도 다음 mount 시 정리됨 (다이얼로그 안 열면 누적).
- **Promote는 idempotent** — 이미 promoted 컬럼은 기존 fieldId 반환, 중복 생성 ❌. UI에 "Linked to Library" 표시.
- **Attach function은 metadata만** — 실제 실행은 별도 (functionId만 column에 저장). 향후 row mutation 시 자동 실행 후크.
- **Workspace/Inbox 사이드바도 prototype 답습** — width 240px (Library/Wiki 260 → 240 unification에 맞춤).

### 검증
- tsc 0 · vitest 30/30 · 브라우저 (Workspace/Inbox 사이드바 렌더 확인).

### 다음
- Dashboard builder full (사용자 차트 추가/제거 + Stacked/heatmap).
- Automations 시간 기반 트리거 (cron-like).
- Attached function의 실제 실행 후크.
- Ask AI ⌘J 톱바 버튼.
- Settings 멤버/권한 탭.
- Library에서 promoted field → 원본 컬럼 점프 (역참조).
- Wiki 삭제도 trashedWikiPages로 이동.

### Watch Out
- **Wiki 페이지 삭제는 영구** — Wiki도 Trash 통합은 후속. AlertDialog에 명시.
- **Trash 30일 cleanup은 mount 트리거** — 사용자가 Trash 다이얼로그 안 열면 누적. AppShell mount 시 한 번 호출하는 패턴 검토.
- **Promote 후 컬럼 type 변경**: libraryFieldId는 그대로 유지. 의도된 동작(컬럼이 LibraryField의 derivative이지만 독립 진화 가능)이지만 향후 sync 정책 필요.
- **attached function**: row 추가 시 자동 실행 안 함. AutomationRuntime처럼 별도 useEffect 후크 필요.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 일괄 #2) — Schema pan/zoom · New table · Dashboard 영어/Line · Change type

### 완료 (2 커밋)
- **Schema pan/zoom + drag + New table 모달** (`2bdee40`)
  - types: FlowBaseState.schemaPositions: Record<boardId, {x,y}> (persist, v7→v8 migrate).
  - store: setSchemaPosition / resetSchemaPositions. partialize 포함.
  - schema-er-diagram.tsx 대폭 개편: 캔버스 빈 곳 드래그 = pan, 카드 헤더 드래그 = position 저장(zoom 보정), ⌘+wheel = zoom (0.4~2.0). transform translate+scale + grid bg 동기. 우상단 toolbar (-/100%/+ Reset + New table). 카드 헤더 cursor-grab.
  - schema-new-table-modal.tsx (신규) — Library Template 카드 그리드 + Blank. templateToColumns: tpl.fields(LibraryField id resolve) + extraFields → ColumnDef[]. multiTable이면 첫 테이블만. name auto-suggest. Enter commit.
- **Dashboard 영어화 + Line chart + 컬럼 Change type** (`57fadb6`)
  - dashboard-view: 모든 한국어 라벨 영어화 (전체 행→Total rows, 종류→distinct, 분포→Distribution, X별→By X, 숫자 요약→Number summary, 평균→avg).
  - components/charts/line-chart.tsx (신규) — SVG path 라인+area, 8주 버킷. 의존성 0.
  - buildWeeklyTrend(rows, dateField) → date 컬럼 있을 때 "X trend / Rows per week, last 8 weeks" area chart hero 카드.
  - selectVisibleRows deps에 columnFilters 추가 — 이전 누락. 다중 필터 걸어도 dashboard 재집계 안 됐던 버그 fix.
  - column-header-menu.tsx: Rename + Delete 사이에 Change type submenu. Basic 7 type. updateColumn({type}) — 행 데이터 보존.

### 큰 결정
- **pan/zoom은 ⌘/Ctrl + wheel** — 일반 scroll은 페이지 스크롤. 트랙패드 pinch는 후속.
- **카드 위치 persisted** (boardId별) — 다른 머신에서도 동일 레이아웃.
- **Change type은 행 데이터 보존** — type만 바뀜. 사용자가 잘못 골라도 셀이 새 type editor로 표시 (text→status면 빈 status). 변환은 ❌.
- **New table 모달의 multiTable 템플릿은 첫 테이블만** — N개 보드 한 번에 생성은 후속 (워크플로 더 복잡).
- **dashboard columnFilters deps 누락 버그** — 이번에 발견하고 즉시 fix.

### 검증
- tsc 0 · vitest 30/30 · build.

### 다음
- Dashboard builder full (사용자 차트 추가 + 차트 종류 catalog).
- 자동화 시간 트리거 (cron-like).
- 컬럼 Promote to Library / Attach function.
- Ask AI ⌘J 톱바 버튼.
- Trash 행 단위 + 30일 만료.
- Settings 멤버/권한 탭.
- pinch-zoom 트랙패드 지원.

### Watch Out
- **schemaPositions는 boardId 키** — 보드 삭제 후 복원 시에도 position 보존됨 (보드 삭제 시 schemaPositions cleanup 안 함). 의도된 동작 — Trash에서 복원하면 원래 위치로 돌아옴.
- **Change type 후 셀 렌더링**: 기존 값이 새 type editor 양식에 안 맞으면 빈 셀로 보일 수 있음. 사용자에게 toast로 알려주는 정책 향후 검토.
- **selectVisibleRows useMemo deps** — 새 ephemeral state 추가 시 모든 view(Dashboard/Gallery/Timeline/Kanban) deps 갱신 필요. 일관성 검토.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 일괄) — Automations 엔진 · Filter · 우클릭 · Gallery/Timeline · Bulk edit · ⌘D · Wiki 페이지 생성/검색

### 완료 (6 커밋)
1. **Automations 실제 트리거 엔진** (`12a65d3`) — 룰이 진짜 발화.
   - types: `ChangeEvent` + `FlowBaseState.lastChange` (ephemeral).
   - store: addRow/updateRow/commitAiCell이 `publishChange()`로 lastChange set. cross-board `addRowToBoard(boardId, row)` 신규.
   - `lib/automation-runtime.tsx` (신규) — AutomationRuntime 컴포넌트 셸 마운트. lastChange 구독 → active 룰 스캔 → `matches()` → `executeRule()`. 트리거: row_added · sentiment changes to · AI Theme confirmed as. 액션: Notify(toast) · Set(updateRow patch) · Add row to(cross-board). detail의 `{name}` 토큰 source row 값으로 치환.
   - 단위 테스트 15 신규 — AUT-001/002/003 트리거 매칭 + parseRowDetail. **vitest 15 → 30 passing**.
2. **다중 필드 Filter 팝오버** (`bfbc3d3`) — status chips만 가능했던 필터를 모든 select/status 컬럼으로 확장.
   - store: `columnFilters: Record<string, string[]>` ephemeral + setColumnFilter / toggleColumnFilter / clearAllFilters. selectVisibleRows에 적용.
   - `components/board/filter-menu.tsx` — Linear "Add Filter…" submenu 패턴. 활성 카운트 배지. ActiveFilterChips 칩 바 (col:value, x로 제거).
3. **행 우클릭 컨텍스트 메뉴** (`26a0c28`) — `onContextMenu` 0건 → shadcn ContextMenu.
   - store: `duplicateRow(rowId)` — 원본 다음 위치에 새 ID + AI confirmed 유지. publishChange로 자동화 통지.
   - `components/sheet/row-context-menu.tsx` — Open in detail(⌘I) · Duplicate(⌘D) · Copy ID · Delete(⌫). 우클릭 시 선택 자동 교체. 다중 선택이면 일괄 적용.
   - sheet-view 각 tr을 RowContextMenu로 래핑.
4. **Gallery + Timeline 뷰** (`0bdedfd`) — Sheet/Kanban/Dashboard 옆에 정렬.
   - view-switcher: VIEWS에 grid · timeline 추가. timeline은 date 컬럼 있을 때만 활성.
   - `gallery-view.tsx`: auto-fill 카드 그리드. 첫 avatar/text → 헤더, status/select/date/num 4개 → 본문. RowContextMenu + detail bar 자동 활성.
   - `timeline-view.tsx`: 첫 date 컬럼 기준 월별 그룹화 (최근부터). 카드: 일자 + 제목/ID + priority/status pill.
5. **Bulk edit + ⌘D 복제 단축키** (`f6044e1`):
   - `bulk-edit-menu.tsx` — 다중 선택 시 "Set…" 드롭다운. status/select 컬럼 → 값 선택 → 모든 선택 행 updateRow. STATUS_LABELS 디스플레이.
   - keyboard-shortcuts: ⌘D → 선택 행 모두 duplicateRow.
6. **Wiki 새 페이지 + 사이드바 검색** (`44d5003`):
   - store: addWikiPage(init?) → unverified draft + 새 ID + 선택 자동. deleteWikiPage.
   - wiki-sidebar 헤더 + 버튼, 검색 input 활성 (title/category/body 매치, X clear).

### 큰 결정
- **자동화 트리거 엔진 = 휴리스틱 키워드 매칭** — when.event/value 자유 텍스트로 두고, "row added"/"sentiment changes to"/"AI theme confirmed as" 같은 substring으로 라우팅. 명시적 typed schema(TriggerKind)로 마이그레이트 ❌ (시드 그대로 동작).
- **publishChange는 store 액션 내부에서** — 별도 middleware ❌. 명시적 호출 + timestamp dedupe로 useEffect 재실행 제어.
- **columnFilters는 filter와 병존** — 기존 status chips 빠른 접근 유지, 새 FilterMenu가 모든 select/status 커버. 둘 다 selectVisibleRows에서 AND.
- **Gallery/Timeline은 RowContextMenu 공유** — 시트 외 뷰에서도 동일 액션 제공. detail bar 자동 활성도 동일.
- **Bulk edit은 select/status만** — text/num/date 인플레이스 bulk는 후속 (입력 위젯 다양해서 복잡).
- **새 Wiki 페이지는 draft 상태** — 자동 verified ❌ (LOCK: 사람이 검증).

### 검증
- tsc 0 · vitest 30/30 (15 신규 automation matches/parseRowDetail) · build.
- 브라우저 통합 테스트는 정량적 store 카운트 검증 (DOM 변화 + lastChange 추적).

### 다음
- Schema pan/zoom + drag reposition · "New table from template" 모달.
- Dashboard builder (Line/Area/Stacked + Add chart 카탈로그).
- 컬럼 헤더 확장: Promote/Attach function/Change type.
- 자동화 시간 기반 트리거 (cron-like for "every day at", "due date passes").
- Wiki sidebar 페이지 우클릭 (Rename · Move category · Delete).
- Trash 행 단위 + 30일 만료.
- Ask AI ⌘J · Settings 멤버 탭.

### Watch Out
- **`updateRow` 호출은 `publishChange` → AutomationRuntime이 useEffect 재실행**. 무한 루프 위험: rule action이 updateRow를 부르면 새 change → 다시 매칭. handledRef로 같은 timestamp는 한 번만 처리, 추가로 룰 자체가 자기-매칭하지 않도록 액션 결과로 trigger 조건이 다시 충족되지 않게 시드 룰 디자인 (Negative→Urgent task는 새 boardId라 OK).
- **Bulk edit + Automations 결합**: 10행 동시 updateRow → 10개 ChangeEvent · 10번 룰 매칭. 시드 룰 4개 × 10행 = 최대 40 fire. 자동화가 toast 폭주 가능성. 향후 batch suppress 옵션 검토.
- **Gallery/Timeline은 selectVisibleRows 결과를 useMemo 의존성 hack** — board/search/filter/sort/columnFilters로 invalidation 추적. 새 ephemeral state 추가하면 deps 갱신 필요.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-24 (kkh94 머신, P1 시급 일괄 #2) — Schema ER · Automations 작동 · Wiki 편집

### 완료
- **Schema ER 다이어그램 + 3 sub-tab** (`7694d76`) — flat grid → positioned 박스 + SVG bezier 엣지.
  - `components/sections/schema-er-diagram.tsx` (신규) — auto-layout 3-column grid. FK 컬럼 → bezier 엣지 + "1:N" cardinality pill. Hover 시 active 표시 + 비-active 30% 페이드. data-er-card 셀렉터.
  - `components/sections/schema-view.tsx` 재구성 — Schema(ER) · Fields(카드 그리드) · Relations(리스트) 3 sub-tab. data-schema-sub 셀렉터.
  - 브라우저 검증: interviews(240×328) + tasks(240×198) 카드 렌더, Relations: 0 (FK 시드 없음).
- **Automations 동작** (`4969e50`) — 카드가 클릭 무반응 → 모든 액션 실작동.
  - store: `toggleAutomationStatus`(active↔paused) · `deleteAutomation` · `testRunAutomation`(runs++ visual proof) · `acceptSuggestion`(draft 룰로 promote) · `dismissSuggestion`.
  - automations-view: 룰 status pill 클릭 가능 + "..." 드롭다운(Test run/Delete with AlertDialog) + Empty state + SuggestionCard에 Accept/Dismiss 버튼.
  - data-automation-id / data-automation-menu / data-automation-runs / data-suggestion-id 셀렉터.
- **Wiki 본문 편집** (`bf02ebb`) — 본문 읽기 전용 → markdown editor 토글.
  - `components/wiki/wiki-page.tsx` — editMode state, Title 우측 Edit/Cancel·Save 버튼군, textarea (min-h-[400px]·font-mono·focus:border-primary), markdown 문법 헬퍼 힌트. Save → updateWikiPage({body, updatedAt}).
  - 페이지 전환 시 draft 자동 리셋.
  - data-wiki-edit-toggle / data-wiki-editor / data-wiki-save 셀렉터.
  - 브라우저 검증: "Library guide" Edit 클릭 → textarea content "# What is the Library?..." 자동 로드 ✓.

### 큰 결정
- **ER auto-layout 우선, drag/zoom 후순위** — 사용자 데이터 규모(2~5 보드 예상)에서 row-major 3-column grid면 충분히 시각화. drag reposition은 향후.
- **Automations 실행 엔진 = visual proof만** — 실제 row 변경 감지 + rule 평가 + Then 실행은 별도 zustand subscribe 레이어 필요 → 후속. 지금은 testRunAutomation으로 runs++ 트래킹만 검증.
- **acceptSuggestion은 draft 상태 룰 생성** — 사용자가 트리거/액션을 명시 설정해야 active로 전환 가능. AI가 만든 룰을 무작정 active로 두지 ❌ (LOCK: "AI 추천 + 사람 확정").
- **Wiki 본문 편집은 textarea + Save (인플레이스 vs split pane)** — split preview는 너비 부담. 사용자가 Save로 명시적 commit 후 렌더 결과 확인.

### 검증
- tsc 0 · vitest 15/15.
- 브라우저: Workspace > Schema 진입 → ER 다이어그램 2 카드 렌더 ✓, sub-tab 3개 데이터 셀렉터 ✓ · Wiki Edit 토글 → textarea content 자동 로드 ✓.

### 다음 (감사 보고서 큰 갭 중 남은 것)
- **Automations 실제 트리거 엔진** — `lib/automation-runtime.ts`로 zustand subscribe + rule 평가. row 변경/스케줄 트리거 두 종류 처리.
- **컬럼 헤더 메뉴 확장**: Promote to Library · Attach function · Change type 인플레이스.
- **다중 필드 Filter 팝오버** · **Bulk edit** · **우클릭 컨텍스트 메뉴**.
- **Gallery / Timeline view** — `view-grid.jsx` · `view-timeline.jsx`.
- **Dashboard builder** — Line/Area/Stacked + "+ Add chart" 카탈로그.
- **Schema 깊이**: pan/zoom · drag reposition · "New table from template" 모달.
- **Wiki 깊이**: 새 페이지 생성 · 사이드바 검색 · live preview.
- **Ask AI ⌘J 톱바 버튼** · **Trash 행 단위 추적**.
- **B4 (가장 마지막)** — 컬럼↔Library 자산 링크.

### Watch Out
- **ER 엣지는 FK만** — conceptual relations(name/company shared field 등) 점선 엣지는 프로토타입엔 있지만 우리 V2 시드엔 explicit FK 없어 노이즈만 추가 → 생략.
- **Automations 룰 변경 시 trashedBoards 같은 보존 ❌** — deleteAutomation은 즉시 영구 삭제. 향후 Trash로 옮기는 패턴 통일 검토.
- **Wiki body edit ↔ Verified 상호작용** — body 수정 시 verified는 그대로 유지(자동 unverify ❌). Owner 검증의 의미가 콘텐츠 stability라 매번 unverify는 과함 — 별도 액션으로 분리.
- **acceptSuggestion 룰의 when/then은 placeholder** — 사용자가 명시 편집해야 의미 있음. 룰 편집 UI 부재로 현재는 자기 자신 디자인 추측에 의존.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-24 (kkh94 머신, P1 깊이 일괄) — 컬럼 추가/편집 · Trash/Settings 실작동 · 시드 영어화

### 완료
- **컬럼 추가/편집** (`d911c06`) — Sheet의 가장 큰 갭 해소. 헤더 "+" 셀이 진짜 동작.
  - store: `addColumn`(중복 이름 자동 _2/_3) · `deleteColumn`(id 보호, 행 키 제거) · `renameColumn`(키 migrate) · `updateColumn`.
  - `add-column-menu.tsx` (신규) — Basic 7 type + Library Field 8 동적 노출.
  - `column-header-menu.tsx` (신규) — 헤더 우측 "..." 메뉴. Rename(Dialog, key 보존) + Delete(AlertDialog 확인).
  - `header-cell.tsx`/`sheet-view.tsx` — 정렬 버튼 + 헤더 메뉴 가로 조합 + "+" 셀 활성화.
  - 브라우저 검증: 14→15 헤더, 새 "Number" 컬럼 정상 추가 ✓.
- **Trash + Settings 실작동** (`a4935af`) — status bar 클릭 토스트 스텁 → 실 다이얼로그.
  - types: `TrashedBoard` · `WorkspaceSettings`. store v6→v7 migrate.
  - `deleteBoard` 변경: boards에서 빼고 trashedBoards에 push (복원 가능). 신규 액션: `restoreBoard` / `permanentDeleteBoard` / `emptyTrash` / `updateSettings`.
  - `trash-dialog.tsx` (신규) — 삭제 보드 리스트, 항목별 Restore↺ / Delete forever🗑, Empty trash. relativeTime + empty state.
  - `settings-dialog.tsx` (신규) — Workspace name input + Sidebar initial(1글자) + Storage 21% 프로그레스(stub).
  - status-bar — Trash 버튼에 trashedCount 배지(primary dot). board-header / board-sidebar 하드코딩 "peter's workspace" → `settings.workspaceLabel`/`workspaceInitial`.
  - 브라우저 검증: Settings 다이얼로그 렌더 ✓ (Workspace name input · Sidebar initial · Storage bar).
- **시드 deep 영어화** (`a7a1c77`) — Library / Workspace / Interviews 시드 한국어 자산명/옵션/quote 모두 영어. Status 키는 LOCK 한국어 enum 유지.
  - `flowbase-library-seed.ts`: 모델명/처리방식/사업부 → Model/Handling type/Business unit. 옵션 라벨 단순변심 등 → Buyer's remorse 등. usedIn "Tasks.모델명" → "Tasks.model".
  - `flowbase-workspace-seed.ts`: AUT-004/005 한국어 잔여 + SUG-002 영어화. Status 디스플레이값 영어로(자동화 엔진 미구현이라 기능 영향 0).
  - `flowbase-seed.ts`: 10 인터뷰 한국어 이름·인용 → 영어 (transliteration 유지: Min Jiho, Jo Hyunwoo 등).

### 큰 결정
- **컬럼 추가는 Library Field 단축 진입 포함** — Basic types 7 + Library Fields 8 한 드롭다운에. Library에 정의된 Field를 그냥 골라 추가 가능.
- **renameColumn 라벨만 변경** — 키 보존이 기본. 행 데이터 안 깨짐. 키 변경은 store에 별도 path 있지만 UI는 라벨만.
- **deleteColumn 액션은 Undo ❌** — 행 단위는 undoStack에 있지만 컬럼 변경은 미추적. AlertDialog로 confirm 명시.
- **삭제된 보드는 Trash 보존, 마지막 보드 삭제 ❌** — `deleteBoard`가 boards에서 빼고 trashedBoards에 push. 마지막 보드는 보호. 복원 시 viewByBoardId 함께 복원.
- **Status 키 영어화 ❌** — LOCK 한국어 enum 보존. Library Field 내부의 workflow status 옵션(수거접수/검수중)은 영어화 OK (이건 셀 옵션, TicketStatus 아님).

### 검증
- tsc 0 · vitest 15/15.
- 브라우저:
  - "+" 클릭 → 12 menuitem 노출 ✓
  - "Number" 선택 → headers 14→15 ✓
  - Settings 다이얼로그 모든 필드 렌더 ✓
- localStorage v6→v7 migrate 시 trashedBoards/settings 자동 주입.

### 다음
- 컬럼 헤더 메뉴: Promote to Library / Attach function / Change type 인플레이스.
- Trash: 행 단위 deletedRows · 30일 자동 만료.
- Settings: 멤버/권한 탭 · 테마 프리셋 · 데이터 export.
- 나머지 갭 (감사 보고서): Schema ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view · Dashboard builder · Bulk edit · 다중 필드 Filter · 우클릭 메뉴 · Ask AI ⌘J.

### Watch Out
- **컬럼 변경 = undo 비대상** — addColumn/deleteColumn/renameColumn 모두 undoStack ❌. 사용자에게 명시(AlertDialog 메시지).
- **Library Field가 select 타입일 때**: optionListId 참조라 옵션 라벨이 add-column-menu에서 직접 채워지지 않음. 현재는 빈 select로 추가됨. 향후 optionList 자체 inflation 필요.
- **renameColumn 키 변경 path**: 현재 UI는 라벨만 호출 (newName === colName). 키 변경은 store 액션에 있지만 UI 진입점 ❌.
- **Trash deletedAt 시간 만료 없음** — 영구 보관. 30일 만료 정책은 향후.
- **Settings storage bar 21% 하드코딩** — 실제 회계 없음.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-23 (kkh94 머신, 후속 #5) — 감사 + 셸 chrome 보정 (status bar · NavCluster · ⌘K 힌트)

### 완료
- **앱 감사** — 프로토타입 vs 앱 매핑 + 실작동 검증 (Sheet edit/⌘N/Filter/Kanban/Dashboard/Undo/AI fetch/Import 파서). 결론: 핵심 데이터 흐름은 실제 wiring, 빠진 건 편집/관리 흐름 다수.
  - **진짜 작동 (검증함)**: ⌘N(11→12 row 카운트), Filter(11→2 visible), AI Apply all(POST `/api/ai/infer-batch` 500 + graceful toast), CSV 파서("4열·3행" 감지), Kanban 4컬럼 그룹, Dashboard 실집계, ⌘Z Undo(stack pop), ⌘K Search.
  - **의도적 스텁**: Trash/Settings(toast), 2.1/10 GB(하드코딩), activity-bar Settings(`disabled`), Wiki 사이드바 검색(`<input disabled>`), Library asset edit(B3 미구현).
  - **프로토타입 누락**: 컬럼 추가(+) · 헤더 메뉴 · 다중 필드 Filter · ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view · Dashboard builder · 우클릭 메뉴 · nav-history(← 이번 세션에 해결) · Ask AI ⌘J.
- **셸 chrome 보정** (`96ff20d`) — 사용자 지적 5건 해결:
  - `components/board/status-bar.tsx` (신규) — 셸 푸터, hide-all 시에도 항상 표시. Trash · Settings · 2.1/10 GB.
  - 사이드바 푸터 + 액티비티 바 Settings 제거 — status bar 단일화.
  - `types/flowbase.ts` `NavEntry` + `navStack`/`navIndex` + 7 액션 자동 pushNav + `goBack`/`goForward`/`jumpToNavEntry`.
  - `components/board/nav-cluster.tsx` (신규) — 시계(history 드롭다운) · ‹ · ›.
  - `board-header.tsx` — NavCluster 배선 + ⌘K Kbd 힌트 + 검색창 클릭→팔레트.
  - `panels-menu.tsx` — Korean → English ("Panels"/"Show all panels"/"Hide all panels").

### 큰 결정
- **사용자 통찰을 LOCK으로 채택** — "Settings/Trash는 hide-all 무관 항상 접근 가능해야". 프로토타입 sidebar 푸터 결함을 우리는 답습 ❌. 새 컨벤션: **셸 푸터 status bar가 영구**.
- **NavCluster는 단순 visual ❌, 실제 history 스택** — 7개 액션 호출이 자동 push, dedup + cap 50. goBack/goForward는 replay 모드(pushNav 우회).
- **검색창 = ⌘K 팔레트 트리거** — 인라인 입력도 유지하되 (헤더에서 즉시 search store 업데이트), 검색창 클릭 자체가 팔레트도 연다.
- **감사를 솔직하게** — 사용자가 "진짜 돌아가는 앱이냐"고 묻기에 모든 핵심 path를 store-DOM-network 레벨로 검증하고 "스텁/Missing/Working" 표로 보고. 갭 숨기지 않음.

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0 · `vitest run` 15/15.
- 브라우저: ⌘N → store 카운트 +1 ✓ · Filter In-progress → 11→2 visible ✓ · AI Apply all → 실제 POST ✓ · CSV 파서 감지 ✓ · Kanban/Dashboard 렌더 ✓ · Undo ✓ · hide-all 후 status bar 잔존 ✓ · NavCluster 3 버튼 활성/비활성 ✓.

### 다음
- **Trash · Settings 실제 onClick 로직** (현재 toast만). Trash는 store에 deletedItems 추적, Settings는 모달.
- **컬럼 추가 ("+" 셀)** — Sheet의 핵심 갭. `addColumn` 액션 + 헤더 드롭다운(Library Field 선택/타입 선택/+추가).
- **컬럼 헤더 메뉴 (...)** — Promote / Delete / Attach function.
- **시드 deep 영어화** — `flowbase-library-seed.ts` 한국어 자산명 + Customer Interviews 한국어 quote/name.
- **나머지 갭**: ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view.

### Watch Out
- **NavStack 인메모리 only** — 새로고침하면 비워짐. persist 추가 시 다른 머신에서 history 혼란 가능. 의도적 ephemeral.
- **pushNav가 모든 navigation 액션에 자동 호출** — 새 액션 추가할 때 nav 트래킹할 거면 pushNav() 끝에 호출. 안 할 거면 (예: setLibView 같은 미세 토글) 호출 생략.
- **status bar는 6 모드 모두에서 표시** — Wiki/Library/Inbox/Search 모드에도 같은 푸터. Trash가 mode-aware 동작해야 할지(예: Wiki 모드에서 Trash 클릭 → 휴지통 페이지)는 미정.
- **활성 disabled 버튼 모두 제거됨** — activity-bar Settings도 사라짐. 사용자가 액티비티 바 외 진입점을 찾을 곳은 status bar 하나.

### 머신
kkh94. main 머지·푸시는 이번 세션 마무리 시 자동 (after-work step 8 정책 적용 중).

---

## 2026-05-23 (kkh94 머신, 후속 #4) — Search 모드 + ⌘K 팔레트 → breadth P0 100%

### 완료
- **Search** (`3771bc8`) — breadth P0 마지막 항목 마무리. **앱 breadth 100% 도달**.
  - `lib/search-index.ts` — `SearchItem` 평면화(table/row/library/wiki) + `filterSearch`(prefix>contains>subtitle>keywords 스코어) + `countByKind`. 인덱스는 호출자가 useMemo로 캐시.
  - `components/search/search-helpers.tsx` — 공통 `KindBadge`(lucide Database/Rows3/Sparkles/BookText) · `HighlightMatch` · `useNavigateSearchItem` 훅. Row 클릭 시 `switchBoard` + `setActivityMode("tables")` + `setSelected([rowId])` + 디테일 바 자동 열림.
  - `components/search/search-palette.tsx` — 640px 모달 (`fixed inset-0 z-50` + blur). store.searchOpen으로 visibility. ↑↓/Enter/Esc 키 네비, kind 그룹 헤더, 결과 카운트 푸터, `data-search-item-id` 셀렉터.
  - `components/search/search-mode.tsx` — activityMode=== "search" 풀페이지. 큰 input + 5탭(All/Tables/Rows/Library/Wiki, 카운트 chips) + 평탄 리스트 200 limit. `data-search-tab` 셀렉터.
  - `types/flowbase.ts` — `FlowBaseState.searchOpen` (ephemeral, 비-persist).
  - `lib/flowbase-store.ts` — `setSearchOpen` 액션.
  - `lib/keyboard-shortcuts.ts` — `⌘K` → `setSearchOpen(true)`. 편집 중에도 동작.
  - `app/page.tsx` — `activityMode === "search"` → `SearchMode`. `<SearchPalette />`는 항상 마운트.
  - **삭제**: `components/board/coming-soon-mode.tsx` — 마지막 사용자(search 스텁)가 실 구현으로 대체.

### 큰 결정
- **두 진입점, 공통 인덱스/필터** — ⌘K 모달(가벼운 인터럽트 검색)과 풀페이지 모드(긴 세션 탐색)가 같은 `buildSearchIndex` + `filterSearch`로 일관성. UI만 다름.
- **모달은 항상 마운트, store가 visibility 제어** — `if (!open) return null`로 빠른 unmount. ⌘K 단축키는 store 액션만 호출 → 셸/모달 결합도 낮음.
- **Row 검색 액션은 detailBar 자동 활성화** — 행을 찾아 클릭한 의도가 명확하므로, 닫혀 있던 디테일 바도 함께 열어 즉시 행 컨텍스트 노출.
- **외부 lib 미사용** — cmdk(shadcn command)는 그루핑/스코어 정책이 우리 요구와 다름. fixed div + 키 핸들러로 직접 작성 (Wiki 마크다운 렌더러와 같은 정책).

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0(정적 6/6) · `vitest run` 15/15.
- 브라우저: ⌘K 입력 → 모달 출현 · input 자동 포커스 · "lib" → LIBRARY+ROWS 21 결과 · "glossary" → WIKI 1결과 + 매치 하이라이트 · Enter → Wiki Glossary 페이지 모드로 전환 + 사이드바 selection 동기화 · Search 풀페이지 탭 카운트(All 44 / Tables 2 / Rows 18 / Library 18 / Wiki 6) 합산 정확 · Wiki 탭 필터링 6개만.

### 다음
**Breadth 100% — 다음은 깊이/품질 작업**:
- 시드 deep 영어화 (`flowbase-library-seed.ts` 한국어 자산명·옵션 라벨 + `flowbase-workspace-seed.ts` 룰 잔여 + Customer Interviews 시드)
- B3 Library 인라인 편집
- 반응형 fix (~800px)
- AI 실호출 검증 (`ANTHROPIC_API_KEY`)
- Wiki 페이지 편집 UI + sanitize
- B4 (가장 마지막, 사용자 명시) — 컬럼↔Library 자산 링크 · "Use in table" · 템플릿으로 보드 생성

### Watch Out
- **`buildSearchIndex` 호출 시점** — 모달은 open 시 매번 재인덱싱(`useMemo` deps에 `open` 포함). 모드는 데이터 자체에 deps 묶음. 데이터 폭증 시 worker 분리 후보.
- **모달은 mount-always 패턴** — `if (!open) return null`로 unmount하지만 store 구독은 유지. 무거워지면 SSR `'use client'` 경계 살펴볼 것.
- **Search 모드 input 자동 포커스** — `useEffect(() => inputRef.current?.focus(), [])`. mode 재진입 시에도 매번 포커스.

### 머신
kkh94. main 머지 진행 — after-work step 8 무조건 정책.

---

## 2026-05-23 (kkh94 머신, 후속 #3) — Wiki 모드

### 완료
- **Wiki 모드** (`01a7ae7`) — breadth P0 마지막에서 두 번째 항목 마무리.
  - `types/flowbase.ts` — `WikiPage` 인터페이스 + `FlowBaseState.wikiPages` · `wikiSelectedId` 추가.
  - `lib/flowbase-wiki-seed.ts` — 6 페이지 시드 (Library guide · CS case handling · Keyboard shortcuts · New hire onboarding(draft) · Glossary · Team directory). 콘텐츠는 영어화(시드 deep 번역 P1 정책과 일관).
  - `lib/flowbase-store.ts` — `setWikiPage` · `updateWikiPage` 액션, **v5→v6 migrate** (기존 persisted state에 wikiPages 비어 있으면 시드 주입), partialize 갱신.
  - `components/wiki/markdown-body.tsx` — 의존성 0인 미니 마크다운 렌더러 (h1~h3 · ul · ol · table · inline `code` · `**bold**`). 외부 lib ❌.
  - `components/wiki/wiki-sidebar.tsx` — 카테고리 트리 + DRAFT 배지(unverified) + 활성 페이지 좌측 바 강조. `data-page-id` 셀렉터.
  - `components/wiki/wiki-page.tsx` — 제목 · 브레드크럼 · Owner 아바타 · Verified pill(만료 시 빨간 배너 + Re-verify) · Mark as verified(unverified만).
  - `components/wiki/wiki-mode.tsx` — 셸 ([사이드바 | 페이지]).
  - `app/page.tsx` — activityMode === "wiki" → `WikiMode`.
  - `components/board/coming-soon-mode.tsx` — wiki/library/inbox INFO 항목 제거. 이제 Search 모드만 스텁.

### 큰 결정
- **외부 마크다운 라이브러리 ❌** — `react-markdown`/`remark`-류 도입 대신 시드 마크다운 범위에 맞춘 미니 렌더러를 직접 작성. 의존성 무게 회피 · 시드/사용자 입력이 모두 워크스페이스 내부라 sanitize 단순.
- **Wiki 시드는 영어로** — 사용자 명시 "영어버전" 정책과 시드 deep 번역 P1 일관. Library 시드(`flowbase-library-seed.ts`)의 한국어 잔존은 별도 패스로.
- **store version v5 → v6 (migrate)** — 기존 persisted state에 `wikiPages`가 없거나 비어 있으면 자동 주입. Tasks 보드 v4→v5 패턴 답습.

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0 (정적 6/6) · `vitest run` 15/15.
- 브라우저: Wiki 모드 진입 → 사이드바 5 카테고리(Concepts/Onboarding/Reference/Runbooks/Team) · 페이지 6개 · DRAFT 배지 · 활성 페이지 강조 · 마크다운 헤딩/리스트/inline code/bold/테이블 모두 렌더 · 페이지 전환 · "Mark as verified" 클릭 시 DRAFT 배지 사라지고 Verified · 90d left pill로 전환 (Re-verify TTL=90d).

### 다음
**Breadth 마지막**: Search 팔레트(⌘K) 만 남음 — `design-ref/prototype/search-palette.jsx` 참조. 이후 시드 deep 영어화 · B3 Library 편집 · 반응형 fix · B4 테이블 연동(가장 마지막).

### Watch Out
- **`react-markdown` 미사용** — 시드 마크다운 문법만 지원. 사용자가 wiki 페이지 편집 UI를 만들 때 입력 sanitize는 부재(현재는 시드만이라 OK).
- **`wikiPages` partialize 포함** — Wiki 페이지 편집은 localStorage에 즉시 반영.
- **dev server 충돌** — 이번 검증 중 `npm run dev`가 이미 :3000에 떠 있어 새 백그라운드 시작 실패 → 기존 서버 재사용으로 해결. 다음 세션에서도 dev 떠 있으면 preview MCP가 reuse한다.

### 머신
kkh94. main 머지·push는 이번 세션 마무리 시 무조건 진행 (after-work step 8 정책).

---

## 2026-05-23 (kkh94 머신, 이어서) — Phase B Library B1·B2 · Workspace Automations · Inbox · Detail bar · English UI · Tasks 보드

### 마무리 — 모든 작업 main 머지·푸시 완료
후속 작업물 6 커밋 + docs sync + after-work 룰 변경(step 8 무조건 포함)까지 모두 `main`에 fast-forward 머지·푸시 완료(`origin/main` = `bb84e56`+). 다른 머신: `git checkout main && git pull` 한 줄로 이어가기.

### 완료
- **Phase B B1 — Library 브라우즈** (`4148c96`) — 5 카테고리(optionLists/fields/templates/functions/dashboards) TS 타입 + 시드(`flowbase-library-seed.ts`) + 스토어 슬라이스 + LibrarySidebar 트리 + CategoryCatalog 카드 그리드 + 셸 모드 분기. 읽기 전용.
- **Phase B B2 — Library 디테일** (`5bf1ef5`) — `components/library/asset-detail.tsx` (5 카테고리 디테일: OptionList 옵션 목록·Field config·Template 필드+멀티테이블·Function params/example·Dashboard 차트 메타). `selectAsset(category, id)` 원자 액션 추가 — cross-category 클릭 버그 해결. `data-asset-id` 테스트 셀렉터.
- **Workspace > Automations** (`41b7257`) — `components/workspace/automations-view.tsx`(룰 카드 When/Then·status pill·runs/lastRun + AI Suggestions confidence%) + Schema/Automations 탭 + `flowbase-workspace-seed.ts`(5 룰 + 3 AI 제안). `ActiveWorkspaceItem` 타입.
- **Inbox 모드** (`620dadb`) — `components/inbox/inbox-view.tsx` 워크스페이스 상태 파생(AI pending·자동화 제안·빈 테이블·미사용 자산·활동 로그). 6 kind + 필터 chips + 액션→해당 모드 네비.
- **Detail bar (4번째 패널)** (`f3feae2`) — `PanelState.detailBar` 추가. `components/board/detail-bar.tsx` (선택/포커스 행 디테일). PanelsMenu에 체크박스 + ⌘I. TablesMode 통합. `data-panel-id` 셀렉터.
- **English UI + Trash/Settings + Tasks 보드** (`605b9f3`) — 20 파일 변경:
  - UI chrome 한국어→영어 (17+ 파일: board-sidebar/header, tables-mode, ai-activity-panel/composer/pending-card, filter-chips, kanban-view, editable-cell, schema-view, detail-bar, inbox-view, automations-view, coming-soon-mode, library-sidebar, asset-detail).
  - `STATUS_LABELS` 맵(types/flowbase.ts) — Status 디스플레이만 영어, 키는 LOCK 한국어 보존.
  - board-sidebar 푸터: Trash · Settings 아이콘 + 2.1/10 GB stub.
  - `lib/flowbase-tasks-seed.ts` — 2번째 시드 보드 (Tasks, 8행, id·title·assignee·status·priority·due).
  - store v4→v5 migrate — 기존 persisted state에 Tasks 자동 주입.

### 큰 결정
- **breadth 우선 (사용자 명시)** — Phase A 셸 완성 후 B3 Library 편집/B4 테이블 연동 대신 워크스페이스 breadth 완성을 우선 ("우선은 목업 퀄리티와 기능들을 완벽하게 구현해내는 게 최우선"). Library B1·B2, Workspace Automations, Inbox, Detail bar, Tasks 보드, 영어화 순.
- **Status는 LOCK 한국어 키 보존, `STATUS_LABELS` 맵으로 디스플레이만 영어** — MEMORY Key Design #8(Status 색 매핑 한국어 키 기반) 호환. 시맨틱 키-색 매핑 그대로, 라벨만 영어("Todo/In progress/Waiting/Done").
- **`selectAsset(category, id)` 원자 액션** — Library 사이드바에서 cross-category 자산 클릭 시 libCategory + libAssetId 동시 업데이트. 기존 `setLibAsset`만 사용 시 카테고리 미동기로 `assetExists` false → 디테일 미렌더 버그.
- **Detail bar는 Tables 모드에서만 콘텐츠** — 다른 모드는 토글되어도 빈(UX).
- **Tasks 보드 시드 + store v4→v5 migrate** — `flowbase-tasks-seed.ts`로 2번째 시드 보드(CS Operations 도메인) 추가. 기존 사용자 persisted state에 자동 주입.

### 검증
- 각 커밋 시점 `tsc --noEmit` 0 · `npm run build` 0 · `vitest run` 15/15.
- 브라우저 검증: Library 5 카테고리 트리 + 카탈로그 + 자산 디테일(Field·Function 확인) · Workspace Automations 탭 5 룰 + AI 제안 · Inbox 11 파생 항목 + 필터 카운트 · Detail bar 토글 시 보드와 AI 패널 사이 렌더 · English UI 전반 (Customer Interviews + Tasks 사이드바, Todo/In progress/Waiting/Done 영어 라벨, Trash/Settings 푸터).
- after-work 시점 재검증: tsc 0 · vitest 15/15.

### 다음
**Breadth 마무리**: Wiki 모드 + Search 팔레트(⌘K) — 둘 다 현재 스텁. 이후 시드 deep 영어화·B3 Library 편집·반응형 fix·B4 테이블 연동(가장 마지막). 자세히는 `NEXT-ACTION.md`.

### Watch Out
- **13 커밋 ahead of origin/main** — main은 `4d71c8a` 그대로. 다른 머신 이어가기는 브랜치 checkout(`claude/wizardly-murdock-451e3d`) 또는 머지 후 main pull.
- **~800px 반응형 깨짐** — Tables 모드에 4-5 패널 동시 표시 시 cramped. 미해결.
- **시드 deep 영어화 미완** — `flowbase-library-seed.ts`(모델명·처리방식·사업부·옵션 라벨), `flowbase-workspace-seed.ts` 룰 잔여, Customer Interviews 한국어 quote/name 잔여.
- **`ANTHROPIC_API_KEY` 미설정** — AI 라우트 실호출 미검증.
- **STATUS_LABELS 도입 (types/flowbase.ts)** — 신규 status 디스플레이는 `STATUS_LABELS[s]` 사용. 직접 `{s}` 렌더 ❌.
- **테스트 셀렉터 속성** (`data-asset-id`, `data-panel-id`, `data-workspace-item`) — UI 코드에 추가됨. 새 인터랙티브 요소도 같은 패턴 권장.

### 머신
kkh94. 다음 머신: before-work 시 — main이 안 머지 됐으면 브랜치에서 이어갈 것.

---

## 2026-05-22~23 (kkh94 머신) — before/after-work 명령어 · Phase 3 Q1 · 죽은코드 정리 · 앱 범위 재정의(Phase A) · Library 설계(Phase B)

### ✅ 마무리 — 6 커밋 + docs, `main` 머지·푸시 완료
- 작업을 `claude/wizardly-murdock-451e3d` 워크트리 브랜치에 커밋 → **`main` 머지·푸시**.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

### 완료
- **before/after-work 명령어** (`2cbf01a`·`d2ad4ea`) — `~/.claude/commands/`(머신 로컬·미동기화) 대신 `<repo>/.claude/commands/`에 프로젝트 커맨드로 생성. `.gitignore`에 `!.claude/commands/` 예외 추가 → git 추적, 모든 머신 sync. before-work=git pull 중심, after-work=커밋·push·머지 중심.
- **Phase 3 Q1** (`afa39f1`) — `infer-batch`의 `row.quote` 하드코딩을 `sourceField` 인자로 일반화. API·`flowbase-ai.ts`·`ai-activity-panel.tsx`·테스트. vitest 13→15.
- **옛 V1 코드 정리** (`4fa804a`) — V2에서 도달 불가능한 V1 파일 20개 삭제(−7,025줄): `app-sidebar`·`breadcrumb-bar`·`quick-switcher`·`workspace-switcher`·`sections/*-section` 6개·`sections/sheet/*` 4개·`mock-*` 3개·`view-utils`·`trash/workspaces` 라우트. `tokens.ts`는 `mock-data`의 `Tone`/`ChartColor` 타입을 인라인해 의존 제거.
- **Phase A — 앱 셸 6모드 라우터** (`daad859`) — 액티비티 바를 아이콘 2개 → 6모드 레일(Inbox·Tables·Workspace·Library·Wiki·Search). `app/page.tsx`를 `activityMode` 라우터로, Tables 보드 본체를 `tables-mode.tsx`로 추출. **Schema를 Tables 뷰 탭 → Workspace 모드로 이동.** Library/Wiki/Inbox/Search는 "준비 중" 스텁.
- **Phase B 설계** — `docs/02-design/features/flowbase-v2-library.design.md` (Library 서브시스템, 서브단계 B1~B4).

### 큰 결정 — 앱 범위 재정의
- **"Phase 1~6 완료"는 과대 기재였음.** 사용자 지적 + 프로토타입 정독 결과: 프로토타입은 6 액티비티 모드(Inbox·Tables·Workspace·Library·Wiki·Search)를 그리는데 V2는 **Tables 모드 하나**만 구현 — 앱의 약 1/6. docs의 "브라우저 동작 확인 완료"는 넓은 화면 한정.
- **Schema = Workspace 서브시스템** — `prototype-app.jsx` L63(`Migrate stale "schema" view (now a workspace-level item)`)·L95(`activeWorkspaceItem: "schema"|"automations"`). Phase 6 D3("Schema = 4번째 뷰 탭")를 번복. `ViewMode`에서 `schema` 제거.
- **Library 먼저** — 나머지 서브시스템 중 Library가 가장 구조적(컬럼·옵션 정의 레이어). Wiki·Inbox·Search는 이후.
- **BaaS(옛 Phase 7) 후순위** — 서브시스템 구축이 우선.
- before/after-work는 프로젝트 커맨드로 (글로벌 `~/.claude/`는 머신 간 sync 안 됨 — 이번 머신에 명령어가 없던 이유).

### 검증
- Phase 3 Q1·정리·Phase A 각각 `tsc` 0 · `build` 0 · `vitest` 15/15.
- Phase A: preview 브라우저에서 6모드 액티비티 바 + 모드 전환(Library 스텁 · Workspace=Schema · Tables 복귀) 확인.
- after-work 시점 재검증: tsc 0 · build 0 · vitest 15/15.

### 다음
**Phase B — Library 서브시스템 B1 구현.** 설계 `flowbase-v2-library.design.md` §5의 7단계. `NEXT-ACTION.md` 참조.

### Watch Out
- **~800px 반응형 레이아웃 깨짐** — 4패널이 좁은 폭에서 무너짐(AI 패널이 보드 덮음). 미해결 — 서브시스템 구축 뒤 별도 작업. 사용자 우선순위: 기능 > 반응형.
- `ANTHROPIC_API_KEY` 미설정 — AI 실호출 미검증.
- 콘솔 script-tag 경고 6개 — preview 환경/기존, Phase A 코드 무관.
- `pnpm-lock.yaml` 중복 — 빌드 경고(무관, 기존).
- docs의 옛 "Phase 7 BaaS가 다음" 서술은 이번 세션이 재정의 — NEXT-ACTION·MEMORY·CONTEXT·TODO 모두 갱신함.

### 머신
kkh94. 다음 머신: before-work 시 `main` 동기화.

---

## 2026-05-21 (kkh94 머신, 이어서) — Phase 4·5·6 구현 (Kanban·Dashboard · 앱 셸 · 멀티보드·Schema)

### ✅ 마무리 — 커밋·푸시·main 머지 완료
- 작업물을 `feat/kanban-dashboard`에 커밋(`df7eeb4` 코드 + 후속 docs 커밋) → origin 푸시 → **`main` 머지·푸시** 완료.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

### 완료
- **Phase 4 (Kanban + Dashboard)** — 설계 + 구현. `components/board/view-switcher`(Sheet|Kanban|Dashboard 탭) · `components/sections/{kanban,dashboard}-view` · `components/charts/*`(recharts donut/bar + div 막대). Kanban=status 칸+이동 버튼(DnD ❌). Dashboard=제네릭 집계. page 뷰 분기. **버그 수정**: `selectVisibleRows` 직접 구독 → 무한 루프 → 의존 슬라이스 구독 + useMemo.
- **Phase 5 (앱 셸)** — 설계 + 구현. `components/board/*`(activity-bar·board-sidebar·board-header·panels-menu·edge-collapse·expand-tab·filter-chips). page 셸 레이아웃 [액티비티바|사이드바|보드|AI패널] + 패널 조건부 렌더. `keyboard-shortcuts` 확장(⌘⇧A·⌘⇧F·⌘B·⌘N). **버그 수정**: 시트 체크박스 정렬(헤더 X 4px 어긋남 + 행 높이 소수점 jitter → `text-center`·`h-12`·`block mx-auto`).
- **Phase 6 (멀티보드 + Schema)** — 설계 + 구현. 스토어 `renameBoard` · 사이드바 보드 `…` 메뉴(rename 인라인/delete, 마지막 보드 보호) · `schema-view`(전 보드 컬럼 인벤토리 카드 + fk 관계) · `ViewMode += "schema"` 4번째 탭.
- 설계 문서 3개: `flowbase-v2-phase{4,5,6}.design.md`.

### 큰 결정
- Kanban 카드 이동 = 버튼 (DnD 라이브러리 ❌, Phase 4 D1).
- Dashboard = 제네릭 집계 (interview 전용 하드코딩 폐기, Phase 4 D3). 차트 = div 막대 + recharts hero 2개 혼합.
- **Schema = 4번째 뷰 탭** — Phase 1의 "schema ≠ view" 노트를 MVP 단순화 위해 번복 (Phase 6 D3). active board 무관 워크스페이스 렌더.
- 옛 V2-미사용 코드 정리는 별건 — `tokens.ts`가 `mock-data` 타입 의존 등 얽힘 (Phase 6 Q2).

### 검증
- `tsc` green · `npm run build` green · vitest 13/13 · 브라우저: 4뷰 전환·Kanban 이동·Dashboard 차트·패널 토글(키보드/햄버거/엣지)·보드 rename/delete·Schema 뷰 — 모두 확인. 콘솔 getSnapshot 에러 0 (직접 카운터 검증).

### 다음
- **Phase 7 (BaaS)** — V2 7단계 중 마지막. `docs/01-baas-decision.md`(Supabase vs bkend.ai) 결정이 블로커. `NEXT-ACTION.md` 참조.

### Watch Out
- (해결됨) `feat/kanban-dashboard` 커밋·푸시 + `main` 머지 완료 — origin/main이 Phase 1~6 전체 포함.
- `ANTHROPIC_API_KEY` 미설정 — AI 실호출(infer-batch/ask/analyze-import) 여전히 미검증.
- **`selectVisibleRows`를 zustand 셀렉터로 직접 구독 ❌** — 새 배열 반환해 무한 루프. 의존 슬라이스 구독 + `useMemo` 패턴 필수 (Phase 4 교훈, sheet-view 패턴).
- 옛 V2-미사용 코드 정리 미완 — 별건 (NEXT-ACTION 참조).
- `feat/sheet-view-v2`·`feat/kanban-dashboard` 브랜치 origin 잔존 (삭제 선택).

### 머신
kkh94. 다음은 또 다른 머신 — before-work 시 `main` 동기화.

---

## 2026-05-21 (kkh94 머신, 이어서) — Phase 1B·2·3 구현 (시트 뷰 · AI 패널 · Import)

### ✅ 마무리 — 커밋·푸시·main 머지 완료
- 이 세션 작업물을 `feat/sheet-view-v2`에 커밋(`eb31064`) → origin 푸시 → **`main` 머지·푸시**까지 완료.
- git 식별자는 저장소 로컬 config로 설정(peterkwon248). 다른 머신에서 `git fetch && git checkout main && git pull`로 이어가면 됨.

### 완료
- **before-work** — `peterkwon248/FlowBase` clone, `npm install`
- **Phase 1B (시트 뷰)** — `components/sheet/*` (cell-popover·editable-cell·header-cell·new-row-stub·sheet-view) + `use-sheet-keyboard`/`use-sheet-clipboard`(M4/M5 이식). `app/page.tsx` V2 보드 페이지. 버그 수정: tailwind-merge가 `outline` 스타일 클래스 제거 → 포커스 표시를 `ring`으로 교체.
- **Phase 2 (AI 패널 + Claude)** — 설계 문서 + 구현. `app/api/ai/{_anthropic,infer-batch,ask}` · `lib/flowbase-ai.ts` · 스토어 `acceptAllAi`/`dismissAllAi`/`pushAi` · `components/ai/*` · page 우측 패널 슬롯 + `Toaster`. vitest 도입(infer-batch 5 테스트).
- **Phase 3 (Import 모달)** — 설계 문서 + 구현. `app/api/ai/analyze-import` · `components/import/*` (3-step 위저드) · `createBoard(label,columns?,rows?)` 확장 · 헤더 Import 버튼 · `app/txt-poc` + `lib/parsers/txt-block-parser.ts` 제거. parsers 8 테스트. 버그 수정: import 시 `id` 컬럼명 충돌 → dedup.
- 설계 문서 3개: `docs/02-design/features/flowbase-v2-phase{1,2,3}.design.md` (Phase 1은 기존, 2·3은 신규).

### 큰 결정
- **Phase 2 모델 = `claude-sonnet-4-6`** — claude-api 스킬 기본값은 `claude-opus-4-7`이나, 핸드오프 AI-CONTRACTS + 설계 D2가 Sonnet 지정 + 대량 분류 작업이라 채택. `_anthropic.ts`의 `AI_MODEL` 단일 상수.
- **"Apply all" = Claude infer-batch 호출 + `confirmed:true` 적용**, ⌘Z가 검토 백스톱 (Phase 2 D1).
- **Import = 새 제네릭 보드 생성** — 프로토타입/IMPORT-SPEC §3의 고정필드 휴리스틱 매퍼 폐기 (Phase 3 D1, Phase 1 D4 일관).
- vitest 최소 도입 (Phase 2 Q2).

### 검증
- `tsc --noEmit` green · `npm run build` green (5 라우트) · vitest **13/13** (parsers 8 + infer-batch 5) · 브라우저 동작 확인 (시트 편집·키보드 네비·AI 패널 pending/error toast·Import 3-step 흐름·새 보드 생성). AI 실호출은 키 미설정이라 graceful 에러 경로까지만 검증.

### 다음
1. `.env.local`에 `ANTHROPIC_API_KEY` → AI 실호출 검증.
2. Phase 4 (Kanban + Dashboard) — `main`에서 새 브랜치 분기. `NEXT-ACTION.md` 참조.

### Watch Out
- (해결됨) 작업물은 `feat/sheet-view-v2` 커밋·푸시 + `main` 머지 완료 — origin/main이 이번 세션 결과를 포함. `feat/sheet-view-v2` 브랜치는 origin에 잔존(삭제 선택).
- `ANTHROPIC_API_KEY` 미설정 — 사용자가 마지막에 설정 예정. AI 실호출(infer-batch/ask/analyze-import) 미검증.
- 커밋 시 `next-env.d.ts`(빌드 생성물)·`package-lock.json`(npm install) 변경이 incidental하게 섞여 있음 — 포함 여부 판단.
- Phase 3 Q1: `infer-batch`가 `row.quote` 하드코딩 — 임포트 보드에 `quote` 컬럼 없으면 AI 추론 입력 빈약 (소스 컬럼 일반화는 후속).
- Phase 3 Q2: import 후 새 보드 전환 시 Phase 6(멀티보드 사이드바) 전까지 시드 보드 복귀 UI 없음.
- 프로젝트 eslint는 flat config 부재로 `npm run lint` 동작 안 함 (기존 이슈, 빌드는 무관).

### 머신
kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`) — CLAUDE.md 기재 경로(`kwonkyunghun/.../flowdb-port`)와 다른 머신. 다음 작업은 또 다른 머신 예정.

---

## 2026-05-21 (집) — FlowBase V2 재구축 착수: 계획·설계·Phase 1A

### 완료
- **design-ref/ V2 핸드오프 분석** — 핸드오프 6문서 + 프로토타입(`prototype-app.jsx` 등 40여 jsx) 정독
- **V2 7단계 재구축 계획** — `docs/01-plan/features/flowbase-v2.plan.md`
- **Phase 1 design** — `docs/02-design/features/flowbase-v2-phase1.design.md`
- **`feat/flowbase-v2` 브랜치** — `feat/sheet-view` 기반 분기
- **Phase 1A 기반 구현** (커밋 `360de73`) — `types/flowbase.ts`, `lib/flowbase-store.ts`, `flowbase-seed.ts`, `undo-stack.ts`, `parsers.ts`, `keyboard-shortcuts.ts`
- **Phase 1A 재작업** (커밋 `bc8f263`) — 프로토타입 정독 후 제네릭 컬럼 구동 모델로 전면 수정
- `components/sheet/ai-pending-mark.tsx` (Phase 1B 첫 컴포넌트)
- after-work로 `feat/flowbase-v2` → main squash 머지

### 브레인스토밍 & 큰 결정
- **V2 클린 재구축** — 기존 3섹션 UI를 V2 보드 UI로 대체. `feat/sheet-view`의 M1~M5(옛 모델 시트 트라이얼)는 머지 안 하고 *패턴만 이식*
- **핸드오프 ≠ 프로토타입** — 핸드오프 STATE-SHAPES는 프로토타입의 단순화판. 실제 V2는 제네릭 컬럼 구동(10 cell type, 다중 테이블). 일부만 읽고 Phase 1A를 핸드오프 기준으로 지었다가, 사용자 지적 후 프로토타입 정독 → 제네릭 모델로 재작업
- **`dismissAiCell` = 값 유지** + confirmed=true (프로토타입 `onDismissAi`)
- **theme은 next-themes 소유** — V2 스토어 제외
- 진행 방식: design-first (계획 → 설계 문서 → 검토 게이트 → 코드)

### 다음
- Phase 1B (시트 뷰) — `components/sheet/*` + 보드 페이지. NEXT-ACTION.md 참조

### Watch Out
- **after-work로 미완성 Phase 1이 main에 머지됨** — Phase 1A 기반만 있고 동작하는 V2 화면 없음(app/page.tsx는 아직 옛 3섹션). M1~M5 + design-ref(23k줄)도 main에. Phase 1B는 main 위에서 이어감
- **레퍼런스(프로토타입)는 구현 전 끝까지 정독** — 이번 세션 교훈
- 범위: 프로토타입엔 Library/Wiki/Inbox/Automations 등 핸드오프 7단계 밖 서브시스템 — MVP(7단계) 후 재논의

### 머신
집

---

## 2026-05-07 오후 (집) — taste-skill 도입 검토 + Geist fix

### 완료
- **taste-skill 도입 검토** ([docs/01-plan/features/taste-skill-adoption.plan.md](01-plan/features/taste-skill-adoption.plan.md))
  - 13개 스킬 매트릭스 분석, FlowBase 정렬도 70% 확인 (Phosphor ✅, Geist ✅, shadcn, Linear)
  - 4개 도입 옵션 평가 → **옵션 2 (minimalist-skill 단일)** 채택
- **minimalist-skill SKILL.md 다운로드**: `docs/design-skills/minimalist-skill/SKILL.md` (git tracked, 85 lines, MIT 라이선스)
- **프로젝트 가드 룰 작성**: [CLAUDE.md](../CLAUDE.md) (project root)
  - 디자인 우선순위 1·2·3 (MEMORY → tokens → minimalist-skill)
  - LOCK 상수: Status 색 매핑, Phosphor, Geist, FlowBase 명칭
  - FlowBase 가드 매트릭스 (minimalist-skill 권장 vs FlowBase 현실)
  - 트라이얼 결정: `feat/sheet-view`에서 적용 → 1주 평가
- **Geist 폰트 fix** (별건):
  - `app/layout.tsx`: `Geist({ variable: "--font-geist-sans" })` + `<html className={geistSans.variable}>`
  - `app/globals.css`: `--font-sans: var(--font-geist-sans), 'Geist Fallback', system-ui, sans-serif`
  - 이전: variable 연결 없이 `'Geist'` string만, 실제 적용 ❌
- **MEMORY.md Key Design Decision #9, #10 추가** (taste-skill 도입, Geist fix)
- **NEXT-ACTION.md 갱신**: 다음 행동을 옵션 A 시트 뷰 트라이얼(minimalist-skill 적용)로 단일화

### 큰 결정
- **옵션 2 (minimalist-skill 단일)** 채택 — 옵션 3(다이얼 조합)은 복잡도 비대 회피, 옵션 4(redesign-skill만)는 신규 컴포넌트 폴리시 부족
- **세리프 헤딩 도입 ❌** — 앱(데이터 보드)은 산스 톤이 적합. minimalist-skill 권장 Lyon Text/Newsreader/Playfair는 미적용
- **framer-motion 자동 설치 ❌** — MOTION_INTENSITY 1-3만 (정적 ~ 미세 hover/fade). 데이터 보드에 화려한 모션 ❌
- **Status 색 매핑 보존** — 어떤 도입에도 절대 override ❌ (LOCK)
- **`.claude/`는 통째로 gitignored** — SKILL.md를 docs/design-skills/에 git tracked로 둠 (cross-machine sync). install은 명시 reference 패턴

### 다음
1. **옵션 A 시트 뷰 트라이얼 (다음 세션)** — `feat/sheet-view` 브랜치에서 PDCA design 작성 → 구현
2. minimalist-skill 1주 평가 후 본격 도입 또는 후퇴 결정

### Watch Out
- **`feat/sheet-view` 브랜치는 origin 미push** — 다음 세션에서 push 후 PR 작업
- **NEXT-ACTION.md 하단 "폐기된 행동" 섹션** — 원본 옵션 A·B·C 내용 참고용 보존. 시간 지나면 정리
- **CLAUDE.md (project)는 신규** — `before-work` 시 4번째로 읽도록 권장 (Source of Truth는 docs/MEMORY.md, CLAUDE.md는 가드/lock 룰)

### 머신
집

---

## 2026-05-07 오전 (집) — before-work 동기화

### 완료
- **GitHub 레포 rename 확인**: `peterkwon248/flowdb` → `peterkwon248/FlowBase` (GitHub에서 이미 rename 됨, 로컬 origin도 `set-url`로 갱신)
- **18 commits pull (fast-forward)**: PR #3·PR #4 + 2026-05-05 직접 커밋 4건
- **docs 정합성 갱신**: `NEXT-ACTION.md` (날짜/경로/PR 완료), `CONTEXT.md` (Current Features), `TODO.md` (완료 항목), `SESSION-LOG.md` (이 entry), `docs/MEMORY.md` (이미 직전 세션에서 갱신됨 — 그대로)
- **Local memory rehydrate**: `~/.claude/projects/.../memory/project_flowdb_status.md` → 2026-05-07 상태로 갱신

### 직전 세션과의 변경
- 폴더 이름 `Desktop/FlowDB/` → `Desktop/FlowBase/`로 변경됨 (사용자 직접 변경 또는 다른 머신)

### 다음
**다음 라운드 결정 — 옵션 A·B·C 중 사용자 선택 대기 (추천 A).**

### Watch Out
- **NEXT-ACTION.md "환경 정보"의 *모든 경로* 갱신 완료** — 다음 머신/세션 시작 시 stale 안 되도록 주의

### 머신
집

---

## 2026-05-05 ~ 2026-05-07 (mixed: v0.dev / claude.ai / 직접 커밋)

> 직접 작성된 SESSION-LOG entry 없음. PR/commit 메타데이터에서 재구성.

### 완료
- **PR #3 머지** (`aa4f353`, 2026-05-05) — `visual-design-update` (v0[bot] 작업)
  - Phosphor status/priority 아이콘 (`95a1558`)
  - light/dark 컬러 최적화 (`28fc0681`)
  - "Add Ticket" → "Add Task" + 아이콘 추가 (`9e12305`)
  - 워크스페이스 셀렉터 드롭다운 (`ec738d4`)
  - 채널 = 아이콘+텍스트 결합 (`897439f`)
- **2026-05-05 직접 커밋 4건** (committer: `ludimast`, claude.ai 추정)
  - `cc90196` fix: TS errors + lockfile drift (PR #3 후처리)
  - `8f597b0` feat: **FlowBase 리브랜드** + status pill 통합 디자인
  - `e3f8208` style: 미처리 status color slate → **blue**
  - `ced9799` docs: MEMORY.md 갱신 (rebrand session)
- **PR #4 머지** (`2e99933`, 2026-05-07) — `claude/awesome-almeida-b95309` (claude.ai 추정)
  - Linear+shadcn 디자인 overhaul (`be6ae15`)
  - Trash 페이지/섹션, sidebar entry (`8feecf4`, `ac3a...`, mock 포함)
  - Workspaces UX (페이지 + 섹션 + switcher)
  - Quick switcher, Breadcrumb bar, Settings section
  - Design tokens 시스템 (`DESIGN-TOKENS.md`, `lib/tokens.ts`)

### 큰 결정 (커밋/MEMORY에서 추출)
- **제품명: FlowDB → FlowBase** (사용자 노출). 내부 docs/spec의 "FlowDB" 표기는 점진 정리 (긴급 ❌)
- **Status 색 매핑 합의**: 미처리=blue (red ❌, priority Urgent 충돌), 진행중=amber, 대기=violet, 완료=emerald
- **Status indicator는 단일 pill** (아이콘+이름+카운트 통합. 분리된 count 배지는 -100 shade에서 안 보임)

### Watch Out
- **이 entry는 재구성**: 실 작업 흐름의 디테일/브레인스토밍 내용은 누락. PR description/commit message만으로 복원 가능한 부분만 기록
- **3개 환경 mixed**: v0.dev (PR #3 빌드) + claude.ai (PR #4, 일부 직접 커밋) + 로컬 (머지) — 다음 작업은 어느 환경이든 *origin/main 기준*으로 시작

### 머신
mixed (v0.dev / claude.ai / 집 로컬)

---

## 2026-05-04 오후 (집)

### 완료
- **txt 블록 자동 분류 PoC 구현 + 머지** — PR #1 (`feat: txt 블록 자동 분류 PoC`, `fac55e1`)
  - `lib/parsers/txt-block-parser.ts`: `***` 구분자 + `<헤더>` 정규식 + 8개 카테고리 키워드 추론 (60줄 순수 함수)
  - `app/txt-poc/page.tsx`: 검증 페이지 (드롭존 + 표 + 카테고리 분포 Badge), 사이드바 진입점 없음
  - 사용자 데이터 `머레이 상황별 템플릿.txt` 231 블록 → 8 카테고리 분포 검증 완료
- **글로벌 명령어 강화**: `~/.claude/commands/{after-work,before-work}.md`
  - 상단 경고: "크로스-머신 동기화. local memory는 보조 캐시"
  - **단계 0 Bootstrap** 추가 (필수 docs 누락 시 skeleton 자동 생성)
  - after-work 단계 5: docs staging 검증, 단계 8: Merge 보호 명시
  - before-work 머신 변경 감지를 단계 2로 위로 이동, 단계 7: docs → local rehydrate
- **Local memory 작성**: `feedback_workflow_skills.md` + `project_flowdb_status.md` + `MEMORY.md` 인덱스
- **Docs bootstrap (이번 entry)**: `docs/{SESSION-LOG, MEMORY, CONTEXT, TODO}.md` 신규 + `NEXT-ACTION.md` 갱신

### 브레인스토밍 & 큰 결정
- **chartdb.io 비교**: chartdb는 *DB 스키마 설계* 도구, FlowDB는 *데이터 정리* 도구. 도메인 다름. 정적+LLM 분기 패턴은 참고할 만함. DBML export로 두 도구 협력 가능.
- **디스플레이 자동 추천 원칙 합의**: "모두 항상 다 있다" ❌, "데이터 도메인이 허용할 때만 활성화" ✓ (Notion/Airtable 비대 함정 회피)
- **다음 라운드 3 후보 정리**: 시트 뷰(★★★★★) / 사람 확정 UI(★★★★) / LLM 하이브리드(★★★) — 우선순위 A ≫ B ≫ C
- **워크스페이스 진입점**: 클릭 핸들러 없는 게 *의도적* placeholder ([docs/02-v01-backlog.md:99](02-v01-backlog.md)). W11 작업.
- **PR #1은 머지까지 완료** — `gh pr merge --merge --delete-branch` 단번에

### 다음
**NEXT-ACTION.md 의 다음 행동 3 후보 중 선택. 추천: 옵션 A (시트 뷰).**

### Watch Out
- ⚠️ **after-work 일반 안전 원칙으로 머지 단계 자의적 누락 금지** — 이번 세션 초기에 머지를 옵션으로 제시했다가 호된 지적 받음. 명령어 정의 자체가 명시 승인 단위. 강화된 명령어 정의에 명시 박힘.
- ⚠️ **워크트리 함정**: `.claude/worktrees/` 안은 Plot 노트앱용. FlowDB 코드는 `flowdb-port/` 메인 working tree에. 이번 세션에서 worktree 안에 있으면서 절대경로로 메인에 직접 작성, 별도 처리 단계 필요했음.
- `"원"` 키워드 광범위 false positive — "가격 59" 분류 일부 의심. 옵션 C 안 가도 옵션 A·B 진행 중에 정밀화 백로그.

### 머신
집
