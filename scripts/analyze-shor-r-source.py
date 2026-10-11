"""Finite Fourier sums over residue classes and rational arithmetic; no circuit simulator."""
import argparse,cmath,hashlib,json,math
from fractions import Fraction
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',type=Path);p.add_argument('--approved',action='store_true');args=p.parse_args();source=args.source.read_text()
Q=16;r=4
probabilities=[sum(abs(sum(cmath.exp(-2j*math.pi*k*(j+r*t)/Q) for t in range(Q//r))/Q)**2 for j in range(r)) for k in range(Q)]
expected=[.25 if k in [0,4,8,12] else 0 for k in range(Q)]
assert max(abs(a-b) for a,b in zip(probabilities,expected))<1e-14
fractions=[Fraction(k,Q) for k in [0,4,8,12]]
assert [f.denominator for f in fractions]==[1,4,2,4]
def cf(f):
 a,b=f.numerator,f.denominator;terms=[]
 while b:terms.append(a//b);a,b=b,a%b
 return terms
trials=[]
for candidate in [2,4,8]:
 plus,minus=math.gcd(15,pow(2,candidate//2)+1),math.gcd(15,pow(2,candidate//2)-1)
 trials.append({'candidate':candidate,'powMod15':pow(2,candidate,15),'gcdPlus':plus,'gcdMinus':minus,'nontrivial':[d for d in [plus,minus] if 1<d<15]})
assert trials[0]['gcdPlus']==3 and trials[0]['gcdMinus']==1
assert trials[1]['gcdPlus']==5 and trials[1]['gcdMinus']==3
assert trials[2]['gcdPlus']==1 and trials[2]['gcdMinus']==15 and not trials[2]['nontrivial']
result={'GPUExecuted':False,'sourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'Q':Q,'r':r,'probabilities':probabilities,'expectedPeaks':expected,'norm':sum(probabilities),'continuedFractions':[{'measurement':k,'fraction':str(f),'cf':cf(f),'denominator':f.denominator,'useful':k!=0} for k,f in zip([0,4,8,12],fractions)],'rawDenominators':[f.denominator for f in fractions],'usefulCandidateSet':[2,4],'gcdTrials':trials,'method':'Finite negative-Fourier sums per f(x) coset, sum target probabilities; exact Fraction reduction. Not CPU quantum simulation or GPU verification.','decision':'STOP: original 4/8 candidate claim lacks a multiplier-search explanation and disagrees with raw CF denominators; success requires nontrivial factors, not merely divisors. Ask exact fixes before port.'}
if args.approved:
 assert 'の候補として 2 と 4 が得られます。' in source
 assert 'より小さい非自明な因数かチェックします。' in source
 result['decision']='APPROVED C1/C2 only applied; no other text or graph-data changes'
text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if args.output:args.output.write_text(text)
else:print(text)
