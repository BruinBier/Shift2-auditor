'use client';

import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { useMemo } from 'react';

const TALEN = { html, css, js: javascript } as const;

/**
 * Een codeveld met syntaxkleuring. Tab springt naar het volgende veld en
 * springt niet in: anders zit wie met het toetsenbord werkt vast in de editor.
 */
export default function Codeveld({
  id,
  label,
  taal,
  waarde,
  zet,
  hoogte = '12rem',
}: {
  id: string;
  label: string;
  taal: keyof typeof TALEN;
  waarde: string;
  zet: (v: string) => void;
  hoogte?: string;
}) {
  const extensies = useMemo(
    () => [
      TALEN[taal](),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-labelledby': `${id}-label`, id }),
    ],
    [taal, id],
  );
  return (
    <div>
      <span id={`${id}-label`} className="block text-sm font-medium text-gray-800 mb-1">
        {label}
      </span>
      <div className="rounded-md border border-gray-300 overflow-hidden text-sm">
        <CodeMirror
          value={waarde}
          onChange={zet}
          extensions={extensies}
          indentWithTab={false}
          height={hoogte}
          basicSetup={{ foldGutter: false, highlightActiveLine: false }}
        />
      </div>
    </div>
  );
}
