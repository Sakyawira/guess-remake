import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  isDark: boolean
  onToggleTheme: () => void
}

export function Header({ isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-2xl font-bold tracking-tight">
        <span className="text-red-500">Guess</span>The Song
      </h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
    </header>
  )
}
