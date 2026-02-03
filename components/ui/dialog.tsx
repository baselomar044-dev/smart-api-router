"use client"
import * as React from "react"

const DialogContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({ open: false, setOpen: () => {} })

const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
  const [isOpen, setIsOpen] = React.useState(open || false)
  
  React.useEffect(() => {
    if (open !== undefined) setIsOpen(open)
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { setOpen } = React.useContext(DialogContext)
  return <div onClick={() => setOpen(true)} className={className}>{children}</div>
}

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { open, setOpen } = React.useContext(DialogContext)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`bg-background rounded-lg p-6 shadow-lg max-w-lg w-full relative ${className || ""}`}>
         <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">X</button>
         {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className || ""}`}>{children}</div>
const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => <h2 className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`}>{children}</h2>

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }