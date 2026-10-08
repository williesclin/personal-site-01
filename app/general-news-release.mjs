export const REQUIRED_RIGHTS_USES=['collect','store','display','model','retention','commercial'];

const nonEmpty=value=>typeof value==='string'&&value.trim().length>0;
const httpsUrl=value=>{
 try{return new URL(value).protocol==='https:';}catch{return false;}
};
const count=value=>Number.isInteger(value)&&value>=0;
const positive=value=>Number.isFinite(value)&&value>0;

export function evaluateGeneralNewsRelease(gate){
 const missing=[];
 const rights=gate?.rights||{};
 for(const use of REQUIRED_RIGHTS_USES){
  const entry=rights[use];
  if(entry?.status!=='approved')missing.push(`rights.${use}.status`);
  if(!httpsUrl(entry?.evidenceUrl))missing.push(`rights.${use}.evidenceUrl`);
 }

 const coverage=gate?.coverage||{};
 const window=coverage.window||{};
 if(!nonEmpty(coverage.universe))missing.push('coverage.universe');
 if(!nonEmpty(coverage.querySetVersion))missing.push('coverage.querySetVersion');
 for(const key of ['start','end','timezone','cutoffTime'])if(!nonEmpty(window[key]))missing.push(`coverage.window.${key}`);
 for(const key of ['attemptedQueries','successfulQueries','failedQueries','retrievedDocuments','deduplicatedDocuments']){
  if(!count(coverage[key]))missing.push(`coverage.${key}`);
 }
 if(!positive(coverage.attemptedQueries))missing.push('coverage.attemptedQueries.positive');
 if(count(coverage.attemptedQueries)&&count(coverage.successfulQueries)&&count(coverage.failedQueries)&&coverage.successfulQueries+coverage.failedQueries!==coverage.attemptedQueries){
  missing.push('coverage.queryAccounting');
 }
 if(count(coverage.retrievedDocuments)&&count(coverage.deduplicatedDocuments)&&coverage.deduplicatedDocuments>coverage.retrievedDocuments){
  missing.push('coverage.deduplicationAccounting');
 }

 for(const policy of ['correctionPolicy','deletionPolicy']){
  if(!httpsUrl(gate?.[policy]?.url))missing.push(`${policy}.url`);
  if(!positive(gate?.[policy]?.slaHours))missing.push(`${policy}.slaHours`);
 }

 const review=gate?.humanReview||{};
 if(!count(review.reviewedDocuments))missing.push('humanReview.reviewedDocuments');
 if(!positive(review.minimumReviewed))missing.push('humanReview.minimumReviewed');
 if(count(review.reviewedDocuments)&&positive(review.minimumReviewed)&&review.reviewedDocuments<review.minimumReviewed)missing.push('humanReview.minimumReviewed.notMet');
 if(!count(review.doubleReviewedDocuments))missing.push('humanReview.doubleReviewedDocuments');
 if(!(Number.isFinite(review.minimumDoubleReviewRate)&&review.minimumDoubleReviewRate>=0&&review.minimumDoubleReviewRate<=1))missing.push('humanReview.minimumDoubleReviewRate');
 if(count(review.reviewedDocuments)&&review.reviewedDocuments>0&&count(review.doubleReviewedDocuments)&&Number.isFinite(review.minimumDoubleReviewRate)&&review.doubleReviewedDocuments/review.reviewedDocuments<review.minimumDoubleReviewRate){
  missing.push('humanReview.minimumDoubleReviewRate.notMet');
 }
 if(!(Number.isFinite(review.agreementRate)&&review.agreementRate>=0&&review.agreementRate<=1))missing.push('humanReview.agreementRate');
 if(review.disagreementsResolved!==true)missing.push('humanReview.disagreementsResolved');

 const uniqueMissing=[...new Set(missing)];
 const rightsApproved=!uniqueMissing.some(key=>key.startsWith('rights.'));
 const coverageComplete=!uniqueMissing.some(key=>key.startsWith('coverage.'));
 const policyComplete=!uniqueMissing.some(key=>key.startsWith('correctionPolicy.')||key.startsWith('deletionPolicy.'));
 const humanReviewReady=!uniqueMissing.some(key=>key.startsWith('humanReview.'));
 return {
  releaseAllowed:rightsApproved&&coverageComplete&&policyComplete&&humanReviewReady,
  rightsApproved,
  coverageComplete,
  policyComplete,
  humanReviewReady,
  missing:uniqueMissing
 };
}
