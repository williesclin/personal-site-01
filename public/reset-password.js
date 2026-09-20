const params=new URLSearchParams(location.hash.slice(1));
let recoveryToken=params.get('access_token');
history.replaceState(null,'',location.pathname);
const form=document.querySelector('#form'),message=document.querySelector('#message'),submit=document.querySelector('#submit');
if(!recoveryToken||params.get('type')!=='recovery'){message.textContent='重設連結無效或已過期，請重新申請重設信。';submit.disabled=true;}
form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;message.textContent='處理中…';try{const res=await fetch('/api/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access_token:recoveryToken,password:document.querySelector('#password').value})});const data=await res.json();if(!res.ok)throw new Error(data.error||'重設失敗');message.textContent='密碼已更新，請返回登入。';form.hidden=true;recoveryToken=null;}catch(err){message.textContent=err.message;submit.disabled=false;}});
