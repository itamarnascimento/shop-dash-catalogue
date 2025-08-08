import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import React from "react"

interface AlertProps {
  description: string,
  yes: React.MouseEventHandler<HTMLButtonElement>,
  setShowAlert: React.Dispatch<React.SetStateAction<boolean>>
}
const AlertConfirm = (props: AlertProps) => {
  const { description, yes, setShowAlert } = props
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Alert className="max-w-sm w-full bg-white shadow-lg">
        <AlertCircle className="h-4 w-4" />
        <div className="flex flex-col gap-2">
          <AlertTitle>Confirmação</AlertTitle>
          <AlertDescription>
            {description}
          </AlertDescription>

          <div className="flex gap-2 mt-3">
            <button
              onClick={yes}
              className="flex-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Sim
            </button>
            <button
              onClick={() => setShowAlert(false)}
              className="flex-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Não
            </button>
          </div>
        </div>
      </Alert>
    </div>
  )
}

export { AlertConfirm }