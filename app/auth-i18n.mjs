export const authCopy = {
 en: {
  'auth.heading':'Research starts with a clear record.', 'auth.intro':'Verified members can use the free Taiwan lottery workspace. Full stock research requires an eligible paid plan; subscriptions are not open.',
  'auth.login.title':'Welcome back.', 'auth.signup.title':'Create your free account', 'auth.reset.title':'Forgot your password?',
  'auth.login.description':'Sign in to continue your research.', 'auth.signup.description':'Verify your email before using the member tools. Creating an account does not subscribe or charge you.', 'auth.reset.description':'Enter your registered email to request a password reset link.',
  'auth.email':'Email', 'auth.password':'Password', 'auth.passwordHint':'At least 12 characters',
  'auth.login.submit':'Sign in', 'auth.signup.submit':'Register and request verification email', 'auth.reset.submit':'Request reset email',
  'auth.signup.link':'Create account', 'auth.reset.link':'Forgot password', 'auth.login.link':'Back to sign in',
  'auth.signup.success':'If this email is eligible, a verification email will be sent. Complete verification before signing in.', 'auth.reset.success':'If this email has an account, a password reset email will be sent.',
  'auth.unavailable':'Member services are unavailable. Account and password entry is disabled; no credentials will be submitted.',
  'auth.scope':'Sign-in, research overview and spending records are bilingual. Lottery analysis, planning, administration and the password-setting page still use Traditional Chinese.',
  'auth.demo':'Explore the workspace demo', 'auth.demoHint':'Synthetic personal records and model results; no paid access or complete lottery tools.',
  'auth.home':'Back to public page', 'auth.language':'Change form language',
  'status.busy':'Processing…', 'status.loading':'Checking member services…',
  'errors.credentials':'Sign-in could not be completed. Check your email, password and verification status.',
  'errors.rateLimit':'Too many requests. Please wait before trying again.', 'errors.unavailable':'The service is unavailable. Please try again later.',
  'errors.network':'The request could not be completed. Check your connection and try again.', 'errors.request':'The request was not completed. Check your input and try again.',
 },
 'zh-hant': {
  'auth.heading':'讓研究，從清楚的紀錄開始。', 'auth.intro':'驗證會員可免費使用台灣樂透工作台。完整股票研究需有效付費方案；訂閱尚未開放。',
  'auth.login.title':'歡迎回來。', 'auth.signup.title':'建立免費帳號', 'auth.reset.title':'忘記密碼？',
  'auth.login.description':'登入後，接著上一次的研究繼續。', 'auth.signup.description':'完成 Email 驗證後才能使用會員工具。建立帳號不會訂閱或扣款。', 'auth.reset.description':'輸入註冊信箱，申請密碼重設連結。',
  'auth.email':'電子郵件', 'auth.password':'密碼', 'auth.passwordHint':'至少 12 個字元',
  'auth.login.submit':'登入工作台', 'auth.signup.submit':'註冊並申請驗證信', 'auth.reset.submit':'申請重設信',
  'auth.signup.link':'建立帳號', 'auth.reset.link':'忘記密碼', 'auth.login.link':'返回登入',
  'auth.signup.success':'若此信箱符合註冊資格，驗證信將寄至信箱。請完成驗證後再登入。', 'auth.reset.success':'若此信箱已有帳號，將收到密碼重設信。',
  'auth.unavailable':'會員服務目前無法使用，帳號與密碼輸入已停用，不會送出登入資料。',
  'auth.scope':'登入、研究總覽及收支紀錄提供中英文。樂透分析、規劃、管理與新密碼設定頁仍為繁體中文。',
  'auth.demo':'探索示範工作台', 'auth.demoHint':'個人紀錄與模型結果為合成資料，不開通付費權益或完整樂透工具。',
  'auth.home':'返回公開頁面', 'auth.language':'切換表單語言',
  'status.busy':'處理中…', 'status.loading':'確認會員服務中…',
  'errors.credentials':'無法完成登入，請確認信箱、密碼與驗證狀態。',
  'errors.rateLimit':'請求過於頻繁，請稍後再試。', 'errors.unavailable':'服務暫時無法使用，請稍後重試。',
  'errors.network':'請求未完成，請確認連線後再試。', 'errors.request':'請求未完成，請檢查輸入後再試。',
 }
};
export const normalizeLocale = value => value === 'zh-hant' ? 'zh-hant' : 'en';
export const authText = (locale,key) => authCopy[normalizeLocale(locale)][key] ?? authCopy.en['errors.request'];
export function authErrorKey(status) {
 if (status===429) return 'errors.rateLimit';
 if (status>=500) return 'errors.unavailable';
 if ([400,401,403].includes(status)) return 'errors.credentials';
 return 'errors.request';
}
// The same submitter lives for the form lifetime: double submits fail closed.
export function createAuthSubmitter(fetcher) {
 let pending=false;
 return async ({view,email,password,configured}) => {
  if (pending) return {ignored:true};
  if (!configured) return {error:'errors.unavailable'};
  if (!['login','signup','reset'].includes(view)) return {error:'errors.request'};
  pending=true;
  try {
   const response=await fetcher('/api/'+view,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(view==='reset'?{email}:{email,password})});
   // Never display provider error bodies or send them to analytics/logging.
   if (!response.ok) {const key=authErrorKey(response.status);return {error:key==='errors.credentials'&&view!=='login'?'errors.request':key};}
   const body=await response.json().catch(()=>null);
   return body?.ok===true?{ok:true}:{error:'errors.request'};
  } catch { return {error:'errors.network'}; }
  finally { pending=false; }
 };
}
