'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

// Notities zijn opgeslagen als HTML. Oudere notities zijn platte tekst met regelafbrekingen;
// die zetten we om, anders valt alles op één regel en zijn de links niet aan te klikken.
export function notitieNaarHtml(notitie: string): string {
  if (/<(p|h[1-6]|ul|ol|li|strong|em|b|i|a|br)\b/i.test(notitie)) return notitie;
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const metLinks = (s: string) =>
    escape(s).replace(/(https?:\/\/[^\s<>"')]+)/g, '<a href="$1">$1</a>');
  return notitie
    .split(/\n{2,}/)
    .map((alinea) => `<p>${alinea.split('\n').map(metLinks).join('<br>')}</p>`)
    .join('');
}

// Dezelfde editor toont en bewerkt: ook in leesstand gaat de HTML door het schema van TipTap,
// dus wat er niet in thuishoort (scripts, stijlen) valt eruit.
const STIJL =
  'text-sm text-gray-800 focus:outline-none break-words ' +
  '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3:first-child]:mt-0 ' +
  '[&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1 ' +
  '[&_p]:mb-2 [&_p:last-child]:mb-0 ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 ' +
  '[&_li_p]:mb-0 ' +
  '[&_a]:text-blue-700 [&_a]:underline [&_a]:break-all hover:[&_a]:text-blue-900';

export default function NotitieEditor({
  html,
  editable,
  onChange,
}: {
  html: string;
  editable: boolean;
  onChange?: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [3, 4] }, codeBlock: false, code: false, blockquote: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer', title: 'opent in nieuw tabblad' },
      }),
    ],
    content: html,
    onUpdate: ({ editor }) => onChange?.(editor.isEmpty ? '' : editor.getHTML()),
    editorProps: {
      attributes: {
        class: editable ? `${STIJL} min-h-24 px-3 py-2` : STIJL,
        ...(editable ? { 'aria-label': 'Notitie' } : {}),
      },
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return <div className="text-sm text-gray-400">Laden…</div>;
  if (!editable) return <EditorContent editor={editor} />;

  return (
    <div className="border border-gray-300 rounded focus-within:ring-1 focus-within:ring-purple-400">
      <Werkbalk editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Werkbalk({ editor }: { editor: Editor }) {
  const knop = (label: string, titel: string, actief: boolean, actie: () => void, extra = '') => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={actie}
      title={titel}
      aria-label={titel}
      aria-pressed={actief}
      className={`px-2 py-1 text-xs rounded ${extra} ${
        actief ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  const zetLink = () => {
    const huidig = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Webadres van de link (leeg laten om de link te verwijderen)', huidig ?? 'https://');
    if (url === null) return;
    if (!url.trim() || url.trim() === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-1 py-1 rounded-t">
      {knop('Kop', 'Kop', editor.isActive('heading', { level: 3 }), () =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(), 'font-semibold')}
      {knop('Subkop', 'Subkop', editor.isActive('heading', { level: 4 }), () =>
        editor.chain().focus().toggleHeading({ level: 4 }).run())}
      <span className="mx-1 h-4 w-px bg-gray-300" aria-hidden="true" />
      {knop('B', 'Vet', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'font-bold')}
      {knop('I', 'Cursief', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'italic')}
      <span className="mx-1 h-4 w-px bg-gray-300" aria-hidden="true" />
      {knop('• Opsomming', 'Opsomming', editor.isActive('bulletList'), () =>
        editor.chain().focus().toggleBulletList().run())}
      {knop('1. Genummerd', 'Genummerde lijst', editor.isActive('orderedList'), () =>
        editor.chain().focus().toggleOrderedList().run())}
      <span className="mx-1 h-4 w-px bg-gray-300" aria-hidden="true" />
      {knop('Link', 'Link', editor.isActive('link'), zetLink, 'underline')}
    </div>
  );
}
