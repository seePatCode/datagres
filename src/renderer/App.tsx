import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background font-sans">
      <h2 className="mb-5 text-xl font-semibold text-foreground">
        Datagres - Database Explorer
      </h2>
      <div className="flex gap-2 items-center">
        <Input 
          placeholder="Paste connection string here"
          className="w-96"
        />
        <Button>React Connect</Button>
      </div>
    </div>
  )
}

export default App