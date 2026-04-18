'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import type { Editor } from '@tiptap/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Unlink,
  Minus,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Props ───────────────────────────────────────────────────────────

interface RichTextEditorProps {
  /** HTML content */
  value: string
  /** Callback with updated HTML on every change */
  onChange: (html: string) => void
  /** Placeholder text shown when editor is empty */
  placeholder?: string
  /** CSS min-height class for the editor area (default 'min-h-[250px]') */
  minHeight?: string
  /** Show the toolbar (default true) */
  showToolbar?: boolean
}

// ── Preset colours ──────────────────────────────────────────────────

const PRESET_COLORS = [
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Black', value: '#000000' },
  { label: 'Default', value: '' },
]

// ── Toolbar button ──────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()} // keep editor focus
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500',
        isActive
          ? 'bg-white/15 text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/10',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      {children}
    </button>
  )
}

// ── Vertical divider ────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-5 bg-white/10 mx-0.5 self-center" />
}

// ── Colour picker ───────────────────────────────────────────────────

function ColorPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click-outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const activeColor = editor.getAttributes('textStyle').color as string | undefined

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        onClick={() => setOpen((v) => !v)}
        isActive={!!activeColor}
        title="Text colour"
      >
        <Palette className="w-4 h-4" />
      </ToolbarButton>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-xl flex flex-wrap gap-1.5 w-[184px]">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              aria-label={c.label}
              onClick={() => {
                if (c.value) {
                  editor.chain().focus().setColor(c.value).run()
                } else {
                  editor.chain().focus().unsetColor().run()
                }
                setOpen(false)
              }}
              className={cn(
                'w-7 h-7 rounded-md border-2 transition-transform hover:scale-110',
                c.value === '' ? 'border-gray-500 bg-white/5 flex items-center justify-center' : 'border-transparent',
                activeColor === c.value && 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-gray-800',
              )}
              style={c.value ? { backgroundColor: c.value } : undefined}
            >
              {c.value === '' && (
                <span className="text-xs text-gray-400 leading-none select-none">Aa</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Link button ─────────────────────────────────────────────────────

function LinkButton({ editor }: { editor: Editor }) {
  const { from, to } = editor.state.selection
  const text = editor.state.doc.textBetween(from, to, '')
  const isLink = editor.isActive('link')

  const handleLink = useCallback(() => {
    if (isLink) {
      editor.chain().focus().unsetLink().run()
      return
    }

    let url = ''
    if (text) {
      url = window.prompt('Enter URL:', 'https://')
    } else {
      const label = window.prompt('Enter link text:', '')
      if (!label) return
      url = window.prompt('Enter URL:', 'https://')
      if (!url) return
      // Insert the label text first, then wrap it with a link
      editor.chain().focus().insertContent(label).run()
      // Select the inserted text
      const { from: newFrom } = editor.state.selection
      editor
        .chain()
        .focus()
        .setTextSelection({ from: newFrom - label.length, to: newFrom })
        .setLink({ href: url })
        .run()
      return
    }

    if (!url) return

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run()
  }, [editor, text, isLink])

  return (
    <ToolbarButton
      onClick={handleLink}
      isActive={isLink}
      title={isLink ? 'Remove link' : 'Add link'}
    >
      {isLink ? <Unlink className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
    </ToolbarButton>
  )
}

// ── ProseMirror content styles ──────────────────────────────────────

const EDITOR_STYLES = `
/* ── SMGH Rich Text Editor – ProseMirror Overrides ── */
.ProseMirror p { margin-bottom: 0.5em; }
.ProseMirror h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
.ProseMirror h2 { font-size: 1.25em; font-weight: 600; margin: 0.5em 0; }
.ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0; }
.ProseMirror ul,
.ProseMirror ol { padding-left: 1.5em; margin: 0.5em 0; }
.ProseMirror ul { list-style-type: disc; }
.ProseMirror ol { list-style-type: decimal; }
.ProseMirror li { margin: 0.25em 0; }
.ProseMirror blockquote { border-left: 3px solid #10b981; padding-left: 1em; margin: 0.5em 0; color: #9ca3af; }
.ProseMirror a { color: #10b981; text-decoration: underline; }
.ProseMirror hr { border-color: #374151; margin: 1em 0; }
.ProseMirror code { background: rgba(255,255,255,0.1); padding: 0.15em 0.3em; border-radius: 0.25em; font-size: 0.9em; }
.ProseMirror pre { background: rgba(255,255,255,0.05); padding: 1em; border-radius: 0.5em; overflow-x: auto; }
.ProseMirror pre code { background: none; padding: 0; }

/* Placeholder */
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #6b7280;
  pointer-events: none;
  height: 0;
}
`

// ── RichTextEditor ──────────────────────────────────────────────────

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing\u2026',
  minHeight = 'min-h-[250px]',
  showToolbar = true,
}: RichTextEditorProps) {
  const isInitialised = useRef(false)

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        TextStyle,
        Color,
      ],
      content: '',
      // SSR-safe: only render after mount
      immediatelyRender: false,
      onUpdate: ({ editor: updatedEditor }) => {
        const html = updatedEditor.getHTML()
        // Report empty as empty string regardless of TipTap's default wrapper
        onChange(updatedEditor.isEmpty ? '' : html)
      },
      editorProps: {
        attributes: {
          class: 'outline-none',
        },
      },
    },
    [onChange, placeholder],
  )

  // Set initial content once after the editor mounts
  useEffect(() => {
    if (!editor || isInitialised.current) return
    isInitialised.current = true
    if (value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div className="bg-white/5 border border-gray-700 rounded-xl text-white overflow-hidden">
      {/* ── Inline style tag ── */}
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />

      {/* ── Toolbar ── */}
      {showToolbar && (
        <div className="bg-white/5 border-b border-gray-700 px-2 py-1.5 flex flex-wrap items-center gap-0.5">
          {/* Text style */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>

          <Divider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <Divider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered list"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <Divider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>

          <Divider />

          {/* Insert */}
          <LinkButton editor={editor} />
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <Divider />

          {/* Colour */}
          <ColorPicker editor={editor} />
        </div>
      )}

      {/* ── Editor area ── */}
      <div className={cn('px-4 py-3', minHeight)}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default RichTextEditor
