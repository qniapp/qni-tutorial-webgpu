"""Classical arithmetic/complexity-model checks for unported shor_hsp. No quantum simulator."""
import argparse,hashlib,json,math
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',type=Path);args=p.parse_args();source=args.source.read_text()
def order(a,N):
 assert math.gcd(a,N)==1
 value=1
 for r in range(1,N+1):
  value=value*a%N
  if value==1:return r
 raise AssertionError('order missing')
def factor_example(a,N):
 r=order(a,N);assert r%2==0
 plus,minus=math.gcd(N,pow(a,r//2)+1),math.gcd(N,pow(a,r//2)-1)
 return {'a':a,'N':N,'r':r,'gcdPlus':plus,'gcdMinus':minus,'product':plus*minus,'nontrivial':[x for x in [plus,minus] if 1<x<N]}
valid,bad=factor_example(2,15),factor_example(14,15)
assert valid['r']==4 and [valid['gcdPlus'],valid['gcdMinus']]==[5,3]
assert bad['r']==2 and [bad['gcdPlus'],bad['gcdMinus']]==[15,1] and bad['product']==15 and not bad['nontrivial']
# Counterexample to 'any a<N': a=3 never returns to 1 for x>=1 (all residues divisible by 3).
noncoprime=[pow(3,x,15) for x in range(16)];assert math.gcd(3,15)==3 and 1 not in noncoprime[1:]
# Fixed a=2, composite Mersenne numbers: order is bit count, not necessarily exponential growth.
linear=[]
for bits in [4,6,8,10,12,16]:
 N=2**bits-1;r=order(2,N);assert r==bits
 linear.append({'bits':bits,'N':N,'a':2,'r':r})
assert pow(4,3,7)==1 and pow(4,1,7)!=1 and pow(4,2,7)!=1
large=[]
for exponent in range(2,7):
 N=3**exponent;r=order(2,N);assert r==2*3**(exponent-1)
 large.append({'N':N,'bits':N.bit_length(),'a':2,'r':r})
# GNFS heuristic leading L_N[1/3,c], omitting o(1); not an exact count at a fixed size.
bits=1024;lnN=bits*math.log(2);c=(64/9)**(1/3)
log10L=c*lnN**(1/3)*math.log(lnN)**(2/3)/math.log(10)
result={'GPUExecuted':False,'sourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'valid15Example':valid,'trivialFactorCounterexample':bad,'nonCoprime3Mod15':noncoprime,'plot2Mod15':[pow(2,x,15) for x in range(16)],'linearOrderCounterexamples':linear,'largeOrderExamplesForNaiveEnumeration':large,'oddOrderIntegerGcdCounterexample':{'N':7,'a':4,'r':3,'aToHalfOrder':8,'gcdPlus':math.gcd(7,9),'gcdMinus':math.gcd(7,7)},'complexityModelComparison':{'bits':bits,'GNFSLeadingHeuristicLog10':log10L,'GNFSLeadingHeuristic':10**log10L,'ShorTextbookCubicTerm':bits**3,'ShorTextbookCubicTermLog10':math.log10(bits**3),'caveat':'GNFS omits o(1) and constants; n^3 is an illustrative polynomial term, not exact Shor operation count. Original 278/61 have no supplied model, so no automatic numeric substitution.'},'decision':'STOP: complexity basis, coprime selection, trivial-factor/product check, even-order wording, unconditional order growth and unqualified classical necessity need owner decisions'}
assert result['plot2Mod15']==[1,2,4,8]*4
text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if args.output:args.output.write_text(text)
else:print(text)
