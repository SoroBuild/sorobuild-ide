import { registerIntelliSense } from './intellisense';
import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
export default function CodeEditor({ files, activeFile, onChange, editorRef, onOpenFile, diagnostics = [], readOnly = false }) {
  const host = useRef(null), instance = useRef(null), models = useRef(new Map()), views = useRef(new Map()), syncing = useRef(false), callback = useRef(onChange);
  const openCallback=useRef(onOpenFile);openCallback.current=onOpenFile;
  const source=useRef(files);source.current=files;
  const [languageStatus,setLanguageStatus]=useState('Rust · Ctrl+Space for suggestions');
  callback.current = onChange;
  useEffect(() => {
    monaco.editor.defineTheme('sorobuild-clean', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#0d141f', 'editorGutter.background': '#0d141f', 'editorOverviewRuler.background': '#00000000', 'scrollbar.shadow': '#00000000', 'editor.foreground': '#c9d5e4', 'editorLineNumber.foreground': '#42556c', 'editorLineNumber.activeForeground': '#91a8c0', 'editor.selectionBackground': '#234558', 'editor.lineHighlightBackground': '#0d141f', 'editor.lineHighlightBorder': '#00000000', 'editorIndentGuide.background1': '#ffffff09', 'editorCursor.foreground': '#75dcc9',
      'editorSuggestWidget.background': '#17212e',
      'editorSuggestWidget.border': '#405166',
      'editorSuggestWidget.foreground': '#dce6ef',
      'editorSuggestWidget.selectedBackground': '#253f59',
      'editorSuggestWidget.selectedForeground': '#ffffff',
      'editorSuggestWidget.highlightForeground': '#75beff',
      'editorSuggestWidget.focusHighlightForeground': '#9cdcfe',
      'editorSuggestWidgetStatus.foreground': '#a6b7ca',
      'editorHoverWidget.background': '#17212e',
      'editorHoverWidget.foreground': '#dce6ef',
      'editorHoverWidget.border': '#405166',
      'editorHoverWidget.statusBarBackground': '#121c28',
      'editorWidget.background': '#17212e',
      'editorWidget.border': '#405166',
      'widget.shadow': '#00000066',
      'textLink.foreground': '#75beff',
      'symbolIcon.methodForeground': '#b4a0e5',
      'symbolIcon.functionForeground': '#b4a0e5',
      'symbolIcon.structForeground': '#4ec9b0',
      'symbolIcon.variableForeground': '#9cdcfe',
      'symbolIcon.fieldForeground': '#9cdcfe',
      'symbolIcon.keywordForeground': '#c586c0' } });
    const editor = monaco.editor.create(host.current, { theme: 'sorobuild-clean', automaticLayout: true, minimap: { enabled: false }, fontSize: 13, lineHeight: 22, padding: { top: 16 }, scrollBeyondLastLine: false, smoothScrolling: true, overviewRulerBorder: false, scrollbar: { useShadows: false, verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, renderLineHighlight: 'none',
      suggestFontSize: 13, suggestLineHeight: 24,
      quickSuggestions: {other: 'on', comments: 'off', strings: 'off'},
      quickSuggestionsDelay: 200, suggestOnTriggerCharacters: true,
      wordBasedSuggestions: 'currentDocument', snippetSuggestions: 'bottom',
      suggest: {showIcons: true, showStatusBar: true, showInlineDetails: true, preview: false, snippetsPreventQuickSuggestions: false},
      parameterHints: {enabled: true, cycle: true},
      hover: {enabled: true, delay: 350, sticky: true},
      model: null });
    instance.current = editor; editorRef.current = editor;
    const language=registerIntelliSense(monaco,{models,files:source,onStatus:setLanguageStatus});
    const navigation=editor.onDidChangeModel(() => { if (!syncing.current) { const found=[...models.current].find(([,model])=>model===editor.getModel()); if(found)openCallback.current?.(found[0]); } });
    const listener = editor.onDidChangeModelContent(() => {
      if (syncing.current) return;
      for (const [path, model] of models.current) if (model === editor.getModel()) callback.current(path, model.getValue());
    });
    return () => { language.dispose(); navigation.dispose(); listener.dispose(); editor.dispose(); for (const model of models.current.values()) model.dispose(); models.current.clear(); instance.current = null; editorRef.current = null; };
  }, [editorRef]);
  useEffect(() => {
    const editor = instance.current; if (!editor) return;
    syncing.current = true;
    try {
      for (const [path, model] of models.current) if (!Object.hasOwn(files, path)) { if (editor.getModel() === model) editor.setModel(null); model.dispose(); models.current.delete(path); views.current.delete(path); }
      for (const [path, text] of Object.entries(files)) {
        let model = models.current.get(path);
        if (!model && path !== activeFile) continue;
        if (!model) { model = monaco.editor.createModel(text, path.endsWith('.rs') ? 'rust' : path.endsWith('.toml') ? 'ini' : path.endsWith('.md') ? 'markdown' : 'plaintext'); models.current.set(path, model); }
        else if (model.getValue() !== text) model.pushEditOperations([], [{ range: model.getFullModelRange(), text }], () => null);
      }
      const next = models.current.get(activeFile) || null;
      if (editor.getModel() !== next) {
        for (const [path, model] of models.current) if (model === editor.getModel()) views.current.set(path, editor.saveViewState());
        editor.setModel(next); if (views.current.has(activeFile)) editor.restoreViewState(views.current.get(activeFile));
      }
    } finally { syncing.current = false; }
    for (const [path, model] of models.current) monaco.editor.setModelMarkers(model, 'sorobuild', diagnostics.filter(item => item.path === path).map(item => ({
      severity: item.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
      message: item.message, startLineNumber: item.line, endLineNumber: item.line, startColumn: item.column, endColumn: item.column + 1,
    })));
  }, [files, activeFile, diagnostics]);
  useEffect(() => { instance.current?.updateOptions({readOnly, readOnlyMessage:{value:"Build in progress. Editing resumes when it finishes."}}); }, [readOnly]);
  return <div className="sorobuild-code-editor relative min-h-0 flex-1 w-full overflow-hidden"><div ref={host} className="absolute inset-0" /><span className="absolute bottom-1 right-4 max-w-[75%] truncate rounded bg-transparent px-2 py-1 text-[10px] text-slate-500" role="status" title={languageStatus}>{languageStatus}</span></div>;
}
