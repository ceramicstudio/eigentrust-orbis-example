import Header from "@/components/header"
import AgentSection from "@/components/agent-section"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-2 md:gap-10 pt-16 p-2 md:p-24 background-gradient bg-[#d36a1f]">
      <Header />
      <AgentSection />
    </main>
  )
}
