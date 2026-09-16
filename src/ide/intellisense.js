import { ideRequest, projectId, createProject, activateProject } from './api';
const toRange = range => ({startLineNumber:range.start.line+1,startColumn:range.start.character+1,endLineNumber:range.end.line+1,endColumn:range.end.character+1});
const markup = contents => (Array.isArray(contents)?contents:[contents]).filter(Boolean).map(item=>({value:typeof item==='string'?item:item.language?`\`\`\`${item.language}\n${item.value}\n\`\`\``:item.value,isTrusted:false}));
export function registerIntelliSense(monaco,{models,files,onStatus}) {
  let disposed=false, queue=Promise.resolve();
  const pathFor = model => [...models.current].find(([,value])=>value===model)?.[0];
  const request = (method,model,position,token)=>{
    const path=pathFor(model);if(!path)return null;
    const version=model.getVersionId(),snapshot={...files.current,[path]:model.getValue()};
    let project=projectId();
    const stale=()=>disposed || token?.isCancellationRequested || model.isDisposed() || projectId()!==project || version!==model.getVersionId();
    // Skip superseded requests before they consume a backend queue slot.
    const task=queue.catch(()=>{}).then(async()=>{
    if(stale())return null;
    onStatus('Analyzing Rust / Soroban SDK…');
    try {
      if(!project){
        const id=await createProject(snapshot);
        if(stale())return null;
        project=id;activateProject(id);
      }
      let response;
      for(let attempt=0;attempt<3;attempt++){
        if(stale())return null;
        try {
          response=await ideRequest('language',{method,path,position:{line:position.lineNumber-1,character:position.column-1},files:snapshot});
          break;
        }catch(error){
          if(attempt===2 || error.status!==503 || !/Indexing|still starting/.test(error.message))throw error;
          if(stale())return null;
          onStatus('Indexing Soroban SDK… suggestions will appear when ready');
          await new Promise(resolve=>setTimeout(resolve,1000));
        }
      }
      if(stale() || JSON.stringify({...files.current,[path]:model.getValue()})!==JSON.stringify(snapshot))return null;
      onStatus('Rust IntelliSense ready');
      for(const [file,diagnostics]of Object.entries(response.diagnostics||{})){
        const target=models.current.get(file);if(!target)continue;
        monaco.editor.setModelMarkers(target,'rust-analyzer',diagnostics.map(item=>({...toRange(item.range),message:item.message,severity:item.severity===1?monaco.MarkerSeverity.Error:item.severity===2?monaco.MarkerSeverity.Warning:monaco.MarkerSeverity.Info})));
      }
      return response.result;
    }catch(error){if(!disposed && !token?.isCancellationRequested)onStatus(error.message);return null;}
    });
    queue=task;
    return task;
  };
  const kinds=['Text','Method','Function','Constructor','Field','Variable','Class','Interface','Module','Property','Unit','Value','Enum','Keyword','Snippet','Color','File','Reference','Folder','EnumMember','Constant','Struct','Event','Operator','TypeParameter'];
  const providers=[
    monaco.languages.registerCompletionItemProvider('rust',{triggerCharacters:['.',':'],async provideCompletionItems(model,position,_context,token){
      const result=await request('textDocument/completion',model,position,token);
      const word=model.getWordUntilPosition(position),fallback={startLineNumber:position.lineNumber,endLineNumber:position.lineNumber,startColumn:word.startColumn,endColumn:word.endColumn};
      return {incomplete:result?.isIncomplete||false,suggestions:(Array.isArray(result)?result:result?.items||[]).slice(0,300).map(item=>({label:item.labelDetails?{label:item.label,detail:item.labelDetails.detail,description:item.labelDetails.description}:item.label,preselect:item.preselect,tags:item.tags?.includes(1)?[monaco.languages.CompletionItemTag.Deprecated]:undefined,kind:monaco.languages.CompletionItemKind[kinds[item.kind-1]]??monaco.languages.CompletionItemKind.Text,detail:item.detail,documentation:markup(item.documentation)[0],insertText:item.textEdit?.newText||item.insertText||item.label,insertTextRules:item.insertTextFormat===2?monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet:undefined,range:item.textEdit?toRange(item.textEdit.range||item.textEdit.replace):fallback,filterText:item.filterText,sortText:item.sortText,additionalTextEdits:item.additionalTextEdits?.map(edit=>({range:toRange(edit.range),text:edit.newText}))}))};
    }}),
    monaco.languages.registerHoverProvider('rust',{async provideHover(model,position,token){const result=await request('textDocument/hover',model,position,token);return result?{contents:markup(result.contents),...(result.range?{range:toRange(result.range)}:{})}:null;}}),
    monaco.languages.registerSignatureHelpProvider('rust',{signatureHelpTriggerCharacters:['(',','],signatureHelpRetriggerCharacters:[','],async provideSignatureHelp(model,position,token){const result=await request('textDocument/signatureHelp',model,position,token);return result?{value:{...result,activeSignature:result.activeSignature||0,activeParameter:result.activeParameter||0,signatures:result.signatures.map(item=>({...item,documentation:markup(item.documentation)[0],parameters:item.parameters?.map(param=>({...param,documentation:markup(param.documentation)[0]}))||[]}))},dispose(){}}:null;}}),
    monaco.languages.registerDefinitionProvider('rust',{async provideDefinition(model,position,token){const result=await request('textDocument/definition',model,position,token);return (Array.isArray(result)?result:result?[result]:[]).flatMap(location=>{
      const uri=location.uri||location.targetUri;if(!uri?.startsWith('file:///tmp/project/'))return [];
      const file=decodeURIComponent(uri.slice('file:///tmp/project/'.length));if(!Object.hasOwn(files.current,file))return [];
      let target=models.current.get(file);if(!target){target=monaco.editor.createModel(files.current[file],'rust');models.current.set(file,target);}
      return [{uri:target.uri,range:toRange(location.range||location.targetSelectionRange)}];
    });}})
  ];
  const warm=()=>{const model=[...models.current.values()].find(model=>model.getLanguageId()==='rust');if(model && projectId())request('textDocument/hover',model,{lineNumber:1,column:1});};
  const timer=setTimeout(warm,1000);window.addEventListener('sorobuild-project',warm);
  return {dispose(){disposed=true;clearTimeout(timer);window.removeEventListener('sorobuild-project',warm);providers.forEach(provider=>provider.dispose());}};
}
