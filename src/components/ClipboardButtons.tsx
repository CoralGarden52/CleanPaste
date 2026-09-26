interface ClipboardButtonsProps {
  onCopy: () => void | Promise<void>
  onClear: () => void
  status?: string
}

export function ClipboardButtons({ onCopy, onClear, status }: ClipboardButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[#e5e5e5] px-4 py-3">
      <button className="secondary-button" type="button" onClick={() => void onCopy()}>
        复制结果
      </button>
      <button className="secondary-button" type="button" onClick={onClear}>
        清空
      </button>
      {status ? (
        <span className="text-sm text-[#666666]" role="status" aria-live="polite">
          {status}
        </span>
      ) : null}
    </div>
  )
}
