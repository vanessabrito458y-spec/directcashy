/* Start OAuth only in the browser that will receive its session-bound callback. */
(() => {
 function showConnection(add) {
  document.querySelector('#browser-connection')?.remove();
  const dialog=document.createElement('dialog');dialog.id='browser-connection';
  dialog.style.cssText='width:min(440px,calc(100vw - 32px));max-height:85dvh;overflow:auto;box-sizing:border-box';
  const heading=document.createElement('h2');heading.textContent='Conectar pelo navegador';
  const info=document.createElement('p');info.textContent='No celular, conclua a conexão pelo Chrome ou Safari. Se o Instagram abrir no aplicativo, volte aqui e copie o link abaixo.';
  const steps=document.createElement('ol');
  for(const text of ['Toque em Copiar link.','Abra o Chrome ou Safari e cole o link na barra de endereço.','Entre com a senha do painel, se solicitado. Depois toque em Continuar conexão e autorize pelo site do Instagram.']){
   const li=document.createElement('li');li.textContent=text;steps.append(li);
  }
  const url=new URL('/',location.origin);url.searchParams.set('connect_browser',add?'add':'connect');
  const field=document.createElement('input');field.value=url.href;field.readOnly=true;field.setAttribute('aria-label','Link para conectar no navegador');field.style.cssText='width:100%;box-sizing:border-box';field.onclick=()=>field.select();
  const status=document.createElement('p');status.setAttribute('role','status');
  const copy=document.createElement('button');copy.type='button';copy.className='gold';copy.textContent='Copiar link';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(url.href);status.textContent='Link copiado! Cole na barra de endereço do Chrome ou Safari.';}catch{field.focus();field.select();status.textContent='Toque e segure no endereço acima e escolha Copiar.';}};
  const proceed=document.createElement('a');proceed.className='outline';proceed.textContent='Continuar conexão neste navegador';proceed.href='/oauth/start'+(add?'?add=1':'');proceed.style.cssText='display:block;margin:16px 0';
  const close=document.createElement('button');close.type='button';close.className='subtle';close.textContent='Fechar';close.onclick=()=>dialog.close();
  dialog.append(heading,info,steps,field,copy,status,proceed,close);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a');if(!link)return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||url.pathname!=='/oauth/start'||link.closest('#browser-connection'))return;
  event.preventDefault();showConnection(url.searchParams.get('add')==='1');
 });
 window.resumeBrowserConnection=()=>{
  const url=new URL(location.href),mode=url.searchParams.get('connect_browser');
  if(!['add','connect'].includes(mode))return;
  url.searchParams.delete('connect_browser');history.replaceState(null,'',url.pathname+url.search+url.hash);showConnection(mode==='add');
 };
})();
