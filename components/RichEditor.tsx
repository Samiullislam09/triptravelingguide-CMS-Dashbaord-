"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { cn } from "@/components/ui";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  Strikethrough,
  Minus,
  Columns,
  Rows,
  Trash2,
} from "lucide-react";

/**
 * Professional WYSIWYG editor (TipTap) — the manual post writer.
 * Outputs clean HTML which is what we store and ship to WordPress / the Vercel site.
 * Light-glass theme — TipTap logic/extensions are unchanged, only the chrome
 * around it was restyled to match the rest of the command center.
 */
export default function RichEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // required for Next SSR (no hydration mismatch)
    extensions: [
      // v3 StarterKit bundles its own Link; disable it so our configured Link wins.
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image,
      Placeholder.configure({
        placeholder: "Start writing your post… use the toolbar for headings, tables, images and links.",
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialHtml || "",
    editorProps: {
      attributes: {
        class: "tiptap article-content focus:outline-none min-h-[420px]",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return <div className="min-h-[480px] bg-white/60 rounded-2xl skeleton" />;
  }

  return (
    <div className="border border-line rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-glass">
      <Toolbar editor={editor} />
      <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
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

  function addImage() {
    const url = window.prompt("Image URL (paste a hosted image link)");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  const inTable = editor.isActive("table");

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-2 border-b border-line bg-white/90 sticky top-0 z-10">
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 size={15} /></Btn>
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 size={15} /></Btn>
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 size={15} /></Btn>
      <Sep />
      <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold size={15} /></Btn>
      <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic size={15} /></Btn>
      <Btn on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough size={15} /></Btn>
      <Sep />
      <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List size={15} /></Btn>
      <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered size={15} /></Btn>
      <Btn on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote size={15} /></Btn>
      <Btn on={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={15} /></Btn>
      <Sep />
      <Btn on={addLink} active={editor.isActive("link")} title="Insert link"><LinkIcon size={15} /></Btn>
      <Btn on={addImage} title="Insert image by URL"><ImageIcon size={15} /></Btn>
      <Btn on={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table"><TableIcon size={15} /></Btn>
      {inTable && (
        <>
          <Btn on={() => editor.chain().focus().addColumnAfter().run()} title="Add column"><Columns size={14} /></Btn>
          <Btn on={() => editor.chain().focus().addRowAfter().run()} title="Add row"><Rows size={14} /></Btn>
          <Btn on={() => editor.chain().focus().deleteTable().run()} title="Delete table"><Trash2 size={14} /></Btn>
        </>
      )}
      <Sep />
      <Btn on={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={15} /></Btn>
      <Btn on={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={15} /></Btn>
    </div>
  );
}

function Btn({
  on,
  active,
  title,
  children,
}: {
  on: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={on}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition",
        active ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:text-ink hover:bg-slate-100"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-line mx-1" />;
}
