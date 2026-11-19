import {seal,unseal} from './core';
import {meta,now,type Settings,type AppEnv,type Account} from './meta';

export const UNIFIED_VERSION='v26.0';
const PREFIX='dc-unified:';
export class UnifiedLoginError extends Error {}
export async function accountCredential(env:AppEnv,a:Account){
 const stored=await unseal(a.token,env.APP_KEY);
 if(!stored.startsWith(PREFIX))return {accessToken:stored,unified:false};
 const data=JSON.parse(stored.slice(PREFIX.length));
 if(typeof data.accessToken!=='string'||!data.accessToken)throw Error('Invalid stored credential');
 return {...data,unified:true} as {accessToken:string;unified:true;businessId:string;configId:string};
}
export function authorizationURL(cfg:Settings,origin:string,state:string){
 const q=new URLSearchParams({client_id:cfg.appId,redirect_uri:origin+'/oauth/callback',response_type:'code',state});
 if(cfg.loginMode==='unified'){
  if(!/^\d{5,30}$/.test(cfg.configId||''))throw Error('Informe o ID da configuração do login unificado.');
  q.set('config_id',cfg.configId!);q.set('prompt','login');
  return 'https://www.facebook.com/dialog/oauth?'+q;
 }
 q.set('scope','instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages');
 return 'https://www.instagram.com/oauth/authorize?'+q;
}
export async function exchangeUnified(env:AppEnv,cfg:Settings,code:string):Promise<Account>{
 const base='https://graph.facebook.com/'+UNIFIED_VERSION+'/';
 const token=await meta(base+'oauth/access_token?'+new URLSearchParams({client_id:cfg.appId,client_secret:cfg.appSecret,code}));
 if(typeof token.access_token!=='string'||!token.access_token)throw Error('Token não recebido.');
 const headers={Authorization:'Bearer '+token.access_token};
 const business=await meta(base+'me?fields=client_business_id',{headers});
 if(!/^\d{1,30}$/.test(String(business.client_business_id||'')))throw Error('Portfólio empresarial não recebido.');
 const accounts=await meta(base+'me/assigned_instagram_accounts?fields=id,username&limit=2',{headers});
 if(!Array.isArray(accounts.data)||accounts.data.length!==1||accounts.paging?.next)throw new UnifiedLoginError('Autorize somente uma conta do Instagram por conexão. Use Conectar outra conta para adicionar as demais.');
 const profile=accounts.data[0];
 if(!/^\d{1,30}$/.test(String(profile.id))||typeof profile.username!=='string'||!profile.username)throw Error('Conta do Instagram não recebida.');
 const duration=Number(token.expires_in||0);
 if(!Number.isFinite(duration)||duration<0)throw Error('Validade inválida.');
 return {id:String(profile.id),username:profile.username,expires:duration?now()+duration:0,refreshed:now(),
  token:await seal(PREFIX+JSON.stringify({accessToken:token.access_token,businessId:String(business.client_business_id),configId:cfg.configId}),env.APP_KEY)};
}
