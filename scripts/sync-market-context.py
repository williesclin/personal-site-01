"""Refresh public official metadata only; retain last successful observations on failure."""
import json, re, math, hashlib, urllib.request, urllib.parse, xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
NOW=datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
class Table(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.row=[]
  if tag in ('td','th') and self.row is not None:self.cell=[]
 def handle_data(self,data):
  if self.cell is not None:self.cell.append(data)
 def handle_endtag(self,tag):
  if tag in ('td','th') and self.cell is not None:self.row.append(' '.join(''.join(self.cell).split()));self.cell=None
  if tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'QuantPathLabs/1.0 (+https://quantpathlabs.com; official-source research)'})
 with urllib.request.urlopen(req,timeout=25) as r:return r.read().decode('utf-8-sig')

def ecb(text):
 out=[]
 for e in ET.fromstring(text).iter():
  if 'time' not in e.attrib:continue
  rates={c.attrib.get('currency'):float(c.attrib['rate']) for c in e if 'rate' in c.attrib}
  if rates.get('USD',0)>0 and rates.get('JPY',0)>0:out.append({'date':e.attrib['time'],'eurUsd':rates['USD'],'usdJpy':rates['JPY']/rates['USD']})
 out.sort(key=lambda x:x['date']);assert len(out)>10
 return out

def h10(text):
 p=Table();p.feed(text)
 dates=[];release=re.search(r'Release Date:\s*[A-Za-z]+\s+\d{1,2},?\s+(\d{4})',re.sub('<[^>]+>',' ',text));year=int(release[1]) if release else datetime.now(timezone.utc).year
 for row in p.rows:
  found=[re.fullmatch(r'([A-Za-z]+)\.?\s+(\d{1,2})',c) for c in row]
  if sum(m is not None for m in found)>=3:
   for m in found:
    if m:dates.append(datetime.strptime(f'{m[1][:3]} {m[2]} {year}','%b %d %Y').date().isoformat())
   break
 assert dates,'No H10 observation dates'
 def values(label):
  for row in p.rows:
   if label in ' '.join(row[:2]).upper():
    cells=row[-len(dates):]
    return [float(c) if re.fullmatch(r'\d+(?:\.\d+)?',c) else None for c in cells]
  raise ValueError('H10 missing '+label)
 tw,jp,eu=values('TAIWAN'),values('JAPAN'),values('EMU')
 return [dict(date=d,usdTwd=tw[i],usdJpy=jp[i],eurUsd=eu[i]) for i,d in enumerate(dates) if all(v[i] is not None and v[i]>0 for v in [tw,jp,eu])]

def rss(text,source,host):
 root=ET.fromstring(text);out=[]
 for item in root.findall('.//item'):
  url=(item.findtext('link') or '').strip();title=(item.findtext('title') or '').strip();date=(item.findtext('pubDate') or '').strip()
  parsed=urllib.parse.urlparse(url)
  if parsed.scheme!='https' or not (parsed.hostname==host or parsed.hostname.endswith('.'+host)):continue
  try:published=parsedate_to_datetime(date).astimezone(timezone.utc).isoformat().replace('+00:00','Z')
  except Exception:continue
  if not title or published>NOW:continue
  canonical=urllib.parse.urlunparse(parsed._replace(fragment='',query=''))
  topic='inflation' if any(k in title.lower() for k in ['price','inflation','cpi']) else 'policy-rates' if any(k in title.lower() for k in ['monetary','rate','policy']) else None
  out.append(dict(id=hashlib.sha256((canonical+'|'+published).encode()).hexdigest()[:24],source=source,url=canonical,title=title[:220],publishedAt=published,topic=topic,symbols=[],association='topic-only',retrievedAt=NOW))
 assert out,'No valid RSS entries'
 return out[:60]

SOURCES=[('ecb','https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml',ecb),('h10','https://www.federalreserve.gov/releases/h10/current/',h10),('bls-news','https://www.bls.gov/feed/bls_latest.rss',lambda t:rss(t,'BLS','bls.gov')),('fed-news','https://www.federalreserve.gov/feeds/press_all.xml',lambda t:rss(t,'Federal Reserve','federalreserve.gov'))]
def run():
 path=ROOT/'data/market-context.json';old=json.loads(path.read_text()) if path.exists() else {'version':1,'sources':{}}
 def work(x):
  key,url,parser=x
  try:
   rows=parser(get(url));assert rows
   return key,dict(url=url,status='available',retrievedAt=NOW,lastAttemptAt=NOW,rows=rows)
  except Exception as e:
   prior=old['sources'].get(key,{})
   return key,{**prior,'url':prior.get('url',url),'status':'stale' if prior.get('rows') else 'unavailable','lastAttemptAt':NOW,'error':type(e).__name__,'rows':prior.get('rows',[])}
 results=dict(ThreadPoolExecutor(max_workers=4).map(work,SOURCES));out={'version':1,'attemptedAt':NOW,'sources':results}
 # All values must be finite; errors never become zero-valued observations.
 path.write_text(json.dumps(out,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
 print({k:{'status':v['status'],'observations':len(v['rows'])} for k,v in results.items()})
 if not any(v['status']=='available' for v in results.values()):raise SystemExit('All official-source refreshes failed')
if __name__=='__main__':run()
