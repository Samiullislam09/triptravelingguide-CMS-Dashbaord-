"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CharacterCount from "@tiptap/extension-character-count";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { cn } from "@/components/ui";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Upload,
  Table as TableIcon,
  Undo2,
  Redo2,
  Strikethrough,
  Minus,
  Code2,
  Code,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Columns,
  Rows,
  Trash2,
  Eraser,
  Maximize2,
  Minimize2,
  Loader2,
  Baseline,
} from "lucide-react";

const FONT_SIZES = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "" },
  { label: "Large", value: "20px" },
  { label: "Huge", value: "28px" },
];

/**
 * Professional WordPress-style WYSIWYG editor (TipTap v3).
 * Full-height writing canvas with a rich, grouped toolbar: headings, inline
 * formatting, text color + highlight, font size, alignment, lists + checklists,
 * quotes, code, tables, links, and real image UPLOAD (drag / paste / button →
 * Supabase). Includes a live word/character counter and a distraction-free
 * fullscreen mode. Outputs clean HTML for storage + WordPress/Vercel publishing.
 */
export default function RichEditor({
  initialHtml,
  onChange,
  minHeight = "calc(100vh - 300px)",
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  minHeight?: string;
}) {
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  // Upload an image file to Supabase and insert it at the cursor.
  const insertImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      editorRef.current?.chain().focus().setImage({ src: data.url }).run();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false, // required for Next SSR (no hydration mismatch)
    extensions: [
      // v3 StarterKit bundles its own Link; disable it so our configured Link wins.
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: "Start writing… use the toolbar for headings, images, tables and links. Paste or drop an image to upload it.",
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      TextStyle,
      FontSize,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
    ],
    content: initialHtml || "",
    editorProps: {
      attributes: {
        class: "tiptap article-content focus:outline-none",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it.kind === "file" && it.type.startsWith("image/")) {
            const file = it.getAsFile();
            if (file) {
              event.preventDefault();
              insertImageFile(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const file = event.dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/")) {
          event.preventDefault();
          insertImageFile(file);
          return true;
        }
        return false;
      },
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Lock the page behind the editor while in fullscreen mode.
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [fullscreen]);

  if (!editor) {
    return <div className="min-h-[480px] bg-white/60 rounded-2xl skeleton" />;
  }

  const words = editor.storage.characterCount?.words?.() ?? 0;
  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const readMins = Math.max(1, Math.round(words / 200));

  return (
    <div
      className={cn(
        fullscreen &&
          "fixed inset-0 z-50 bg-canvas/95 backdrop-blur-md p-3 sm:p-5 flex flex-col"
      )}
    >
      <div
        className={cn(
          "border border-line rounded-2xl overflow-hidden bg-white/85 backdrop-blur-sm shadow-glass flex flex-col",
          fullscreen && "flex-1 min-h-0"
        )}
      >
        <Toolbar
          editor={editor}
          uploading={uploading}
          onUploadClick={() => fileInputRef.current?.click()}
          fullscreen={fullscreen}
          onToggleFullscreen={() => setFullscreen((v) => !v)}
        />

        {uploadError && (
          <div className="px-4 py-2 text-xs text-danger bg-danger-soft border-b border-danger/20">
            {uploadError}
          </div>
        )}

        <div
          className={cn(
            "px-4 sm:px-7 py-6",
            fullscreen ? "flex-1 min-h-0 overflow-y-auto" : ""
          )}
          style={fullscreen ? undefined : { minHeight }}
          onClick={() => editor.chain().focus().run()}
        >
          <div className="mx-auto w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-line bg-white/70 text-xs text-muted">
          <div className="flex items-center gap-3">
            <span><b className="text-ink font-semibold tabular-nums">{words}</b> words</span>
            <span className="text-line">·</span>
            <span className="tabular-nums">{chars} chars</span>
            <span className="text-line">·</span>
            <span className="tabular-nums">{readMins} min read</span>
          </div>
          {uploading && (
            <span className="flex items-center gap-1.5 text-ai-600">
              <Loader2 size={12} className="animate-spin" /> Uploading image…
            </span>
          )}
        </div>
      </div>

      {/* Hidden file input for the toolbar upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) insertImageFile(file);
        }}
      />
    </div>
  );
}

/* -------------------------------- toolbar -------------------------------- */

function Toolbar({
  editor,
  uploading,
  onUploadClick,
  fullscreen,
  onToggleFullscreen,
}: {
  editor: Editor;
  uploading: boolean;
  onUploadClick: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  function addLink() {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function addImageUrl() {
    const url = window.prompt("Image URL (paste a hosted image link)");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  const inTable = editor.isActive("table");
  const curColor = (editor.getAttributes("textStyle").color as string) || "#0f172a";
  const curSize = (editor.getAttributes("textStyle").fontSize as string) || "";

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-line bg-white/95 sticky top-0 z-10">
      {/* Block type */}
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 size={16} /></Btn>

      {/* Font size */}
      <select
        title="Font size"
        value={curSize}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontSize(v).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
        className="ml-1 h-8 rounded-lg border border-line bg-white px-1.5 text-xs text-ink outline-none focus:border-brand-300 cursor-pointer"
      >
        {FONT_SIZES.map((f) => (
          <option key={f.label} value={f.value}>{f.label}</option>
        ))}
      </select>

      <Sep />

      {/* Inline formatting */}
      <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)"><Bold size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)"><Italic size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)"><UnderlineIcon size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight"><Highlighter size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code"><Code size={16} /></Btn>

      {/* Text color */}
      <label
        title="Text color"
        className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-ink hover:bg-slate-100 cursor-pointer transition"
      >
        <Baseline size={16} style={{ color: curColor }} />
        <input
          type="color"
          value={/^#/.test(curColor) ? curColor : "#0f172a"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <Btn on={() => editor.chain().focus().unsetColor().run()} title="Reset text color"><Eraser size={15} /></Btn>

      <Sep />

      {/* Alignment */}
      <Btn on={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left"><AlignLeft size={16} /></Btn>
      <Btn on={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center"><AlignCenter size={16} /></Btn>
      <Btn on={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right"><AlignRight size={16} /></Btn>
      <Btn on={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify"><AlignJustify size={16} /></Btn>

      <Sep />

      {/* Lists + blocks */}
      <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist"><ListChecks size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote size={16} /></Btn>
      <Btn on={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block"><Code2 size={16} /></Btn>
      <Btn on={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={16} /></Btn>

      <Sep />

      {/* Insert */}
      <Btn on={addLink} active={editor.isActive("link")} title="Insert link"><LinkIcon size={16} /></Btn>
      {editor.isActive("link") && (
        <Btn on={() => editor.chain().focus().unsetLink().run()} title="Remove link"><Unlink size={16} /></Btn>
      )}
      <Btn on={onUploadClick} title="Upload image" disabled={uploading}>
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
      </Btn>
      <Btn on={addImageUrl} title="Insert image by URL"><ImageIcon size={16} /></Btn>
      <Btn on={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table"><TableIcon size={16} /></Btn>
      {inTable && (
        <>
          <Btn on={() => editor.chain().focus().addColumnAfter().run()} title="Add column"><Columns size={15} /></Btn>
          <Btn on={() => editor.chain().focus().addRowAfter().run()} title="Add row"><Rows size={15} /></Btn>
          <Btn on={() => editor.chain().focus().deleteTable().run()} title="Delete table"><Trash2 size={15} /></Btn>
        </>
      )}

      <Sep />

      {/* Utility */}
      <Btn on={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting"><Eraser size={16} /></Btn>
      <Btn on={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo2 size={16} /></Btn>
      <Btn on={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo2 size={16} /></Btn>

      {/* Fullscreen (pushed right) */}
      <div className="ml-auto">
        <Btn on={onToggleFullscreen} active={fullscreen} title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}>
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Btn>
      </div>
    </div>
  );
}

function Btn({
  on,
  active,
  title,
  disabled,
  children,
}: {
  on: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={on}
      title={title}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center h-8 w-8 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed",
        active ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:text-ink hover:bg-slate-100"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-6 bg-line mx-1 shrink-0" />;
}
