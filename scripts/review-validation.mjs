export const taxonomyVersion='filing-topic-v1';
export const topics=['financial_results','financing','governance','business_update','other','uncertain'];
export function validateReviews(rows,documents,now=new Date()) {
 if(!Array.isArray(rows))throw new Error('Reviews must be an array');
 const docs=new Map(documents.map(d=>[d.id,d])),seen=new Set(),groups=new Map();
 for(const r of rows){
  const d=docs.get(r.documentId),key=[r.documentId,r.contentHash,r.reviewerCode,r.taxonomyVersion].join(':');
  if(!d||r.contentHash!==d.contentHash||r.sourceUrl!==d.url)throw new Error('Unknown or changed source');
  if(r.method!=='human'||r.taxonomyVersion!==taxonomyVersion||!topics.includes(r.topic)||!['positive','negative','mixed','neutral','not_assessable'].includes(r.sentiment))throw new Error('Invalid taxonomy or review method');
  if(!/^[A-Za-z0-9_-]{3,64}$/.test(r.reviewerCode||'')||typeof r.evidenceNote!=='string'||r.evidenceNote.trim().length<20||r.evidenceNote.length>2000)throw new Error('Reviewer and original evidence note required');
  if(!Number.isFinite(Date.parse(r.reviewedAt))||Date.parse(r.reviewedAt)>+now||Date.parse(r.reviewedAt)<Date.parse(d.firstObservedAt))throw new Error('Invalid review date');
  if(seen.has(key))throw new Error('Duplicate review by the same reviewer');seen.add(key);
  if(!groups.has(r.documentId))groups.set(r.documentId,[]);groups.get(r.documentId).push(r);
 }
 const doubleReviewed=[...groups.values()].filter(g=>g.length>=2).length;
 const disagreements=[...groups.values()].filter(g=>new Set(g.map(r=>r.topic+':'+r.sentiment)).size>1).length;
 return {reviewCount:rows.length,uniqueDocuments:groups.size,doubleReviewed,disagreements,doubleReviewFraction:groups.size?doubleReviewed/groups.size:null};
}
