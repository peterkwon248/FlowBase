"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DesignSection } from "@/components/sections/design-section"
import { DataSection } from "@/components/sections/data-section"
import { OperationsSection } from "@/components/sections/operations-section"

export default function Home() {
  const [activeSection, setActiveSection] = useState("design")

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="flex-1 overflow-hidden">
        {activeSection === "design" && <DesignSection />}
        {activeSection === "data" && <DataSection />}
        {activeSection === "operations" && <OperationsSection />}
      </main>
    </div>
  )
}
