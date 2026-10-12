"""Authored amplitudes + finite Fourier sums/Fractions only; no gate simulator."""
import argparse,cmath,hashlib,json,math,re
from fractions import Fraction
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',type=Path);args=p.parse_args();source=args.source.read_text()
cells=[(float(a),int(k))for a,k in re.findall(r"{{\s*'([^']+)'\s*\|\s*qubit_circle:\s*(\d+),\s*'base'\s*}}",source,re.S)];assert len(cells)==256
labeldiff=[]
for index,(a,k) in enumerate(cells):
 x,f=divmod(index,16);assert a==(.25 if f==pow(2,x,15) else 0)
 if k!=index:labeldiff.append({'position':index,'before':k,'after':index,'amplitude':a})
assert labeldiff==[{'position':242,'before':241,'after':242,'amplitude':0.0}]
assert sum(a*a for a,k in cells)==1
# Mathematical DFT on each fixed f coset; not execution of the circuit JSON.
vec=[];prob=[]
for k in range(16):
 row=[]
 for f in range(16):
  z=sum(cmath.exp(-2j*math.pi*k*x/16)for x in range(16)if pow(2,x,15)==f)/16
  row.append([0.0 if abs(z.real)<1e-12 else z.real,0.0 if abs(z.imag)<1e-12 else z.imag])
 vec+=row;prob.append(sum(a*a+b*b for a,b in row))
assert abs(sum(prob)-1)<1e-12
for k,v in enumerate(prob):assert abs(v-(.25 if k in [0,4,8,12] else 0))<1e-12
candidates=[]
for r in [2,4,8]:
 candidates.append({'r':r,'modularResult':pow(2,r,15),'gcdPlus':math.gcd(pow(2,r//2)+1,15),'gcdMinus':math.gcd(pow(2,r//2)-1,15)})
assert candidates==[{'r':2,'modularResult':4,'gcdPlus':3,'gcdMinus':1},{'r':4,'modularResult':1,'gcdPlus':5,'gcdMinus':3},{'r':8,'modularResult':1,'gcdPlus':1,'gcdMinus':15}]
circuits=[json.loads(x)for x in re.findall(r"data-json='([^']*)'",source)];assert len(circuits)==1
result={'sourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'GPUExecuted':False,'quantumCPUSimulatorExecuted':False,'method':'Finite negative Fourier coset sums, Fraction reduction, integer gcd; no gate JSON execution','circuits':circuits,'palette':[[]],'maxWireCount':[1],'runButtonCount':1,'imageCount':0,'authoredCircleCount':256,'labelDiff':labeldiff,'measurements':[0,4,8,12],'probabilities':prob,'fractions':[str(Fraction(y,16))for y in [0,4,8,12]],'denominators':[Fraction(y,16).denominator for y in [0,4,8,12]],'usefulCandidates':[2,4],'gcdCandidates':candidates,'mathSignedDFTExpected':vec,'norm':sum(prob),'decision':'STOP before shor_qft route: final candidates/success wording and ket242 need page-specific approval'}
text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if args.output:args.output.write_text(text)
else:print(text)
