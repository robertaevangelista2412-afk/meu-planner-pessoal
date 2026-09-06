(async()=>{
const STORAGE='meu-planner-pessoal-v1';
const status=t=>{const e=document.getElementById('syncStatus');if(e)e.textContent=t};
const countState=s=>{try{const keys=['events','tasks','goals','people','notes','house','trips','studies','outings','transactions'];return keys.reduce((n,k)=>n+(Array.isArray(s&&s[k])?s[k].length:0),0)}catch{return 0}};
try{
 status('☁️ Recuperando seus dados...');
 if(!window.supabase){status('⚠️ Biblioteca de sincronização não carregou');return}
 const client=window.supabase.createClient('https://agcqgwlusfzvvjuxunli.supabase.co','sb_publishable_BEoptb7_L-2pqS_SQ16Eqg_TNzy-xeK');
 const {data:{session}}=await client.auth.getSession();
 if(!session){status('Entre em Minha conta para sincronizar');return}
 const user=session.user;
 const email=document.getElementById('accountEmail');if(email)email.textContent=user.email||'Minha conta';
 const {data,error}=await client.from('planner_app_state').select('data,updated_at').eq('user_id',user.id).maybeSingle();
 if(error)throw error;
 if(!data||!data.data){status('☁️ Nenhum dado na nuvem para restaurar');return}
 const cloud=data.data, localText=localStorage.getItem(STORAGE)||'{}';
 let local={};try{local=JSON.parse(localText)}catch{}
 const cloudCount=countState(cloud),localCount=countState(local);
 // A nuvem é a cópia de segurança: nunca sobrescrevemos uma cópia maior por uma tela vazia.
 if(cloudCount>0 && (localCount===0 || cloudCount>=localCount || JSON.stringify(cloud)!==localText)){
   localStorage.setItem(STORAGE,JSON.stringify(cloud));
   window.__plannerCloudRecovery={count:cloudCount,updatedAt:data.updated_at};
   const attempts=Number(sessionStorage.getItem('planner-recovery-attempts')||'0');
   if(attempts<2){
     sessionStorage.setItem('planner-recovery-attempts',String(attempts+1));
     status('☁️ Dados recuperados. Reabrindo Planner...');
     setTimeout(()=>location.reload(),250);
     return;
   }
 }
 sessionStorage.removeItem('planner-recovery-attempts');
 status('☁️ Dados sincronizados');
}catch(e){console.error('BOOT RECOVERY',e);status('⚠️ '+(e&&e.message?e.message:'Erro na sincronização'))}
})();