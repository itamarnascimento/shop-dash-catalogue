export const Loading = () => {
  return (
    <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-[9999] flex-col gap-2">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
        <span>Carregando...</span>
    </div>
  )
}