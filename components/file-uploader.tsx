"use client"

import { useCallback, useState } from "react"

interface FileUploaderProps {
  onFileUpload: (data: string, fileName: string) => void
  fileName: string | null
}

export function FileUploader({ onFileUpload, fileName }: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        alert("Por favor, sube un archivo CSV")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        onFileUpload(text, file.name)
      }
      reader.readAsText(file)
    },
    [onFileUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : fileName
            ? "border-primary/50 bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleInputChange}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      
      {fileName ? (
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            Click o arrastra para cambiar el archivo
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">
            Arrastra tu archivo CSV aqui
          </p>
          <p className="text-xs text-muted-foreground">
            o haz click para seleccionar
          </p>
        </div>
      )}
    </div>
  )
}
